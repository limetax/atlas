import { Request, Response } from 'express';
import { z } from 'zod';

import { AssistantService } from '@/assistant/assistant.service';
import { AdvisorRepository } from '@/auth/domain/advisor.repository';
import { ChatContextSchema, MessageSchema } from '@atlas/shared';
import { ChatService } from '@chat/application/chat.service';
import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  Logger,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SupabaseService } from '@shared/infrastructure/supabase.service';

const StreamChatBodySchema = z.object({
  message: z.string().min(1),
  history: z.array(MessageSchema).default([]),
  chatId: z.string().uuid().optional(),
  assistantId: z.string().optional(),
  context: ChatContextSchema.optional(),
  documentIds: z.array(z.string().uuid()).optional(),
});

/**
 * Chat Controller - HTTP endpoint for streaming chat
 * Uses Server-Sent Events (SSE) for streaming
 * Supports optional chatId for message persistence
 * Authenticates via JWT from Authorization header
 */
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly assistantService: AssistantService,
    private readonly supabase: SupabaseService,
    private readonly advisorRepo: AdvisorRepository
  ) {}

  @Post('stream')
  @UseInterceptors(FilesInterceptor('files', 5))
  async streamChat(
    @Body() body: unknown,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({
            fileType: /(application\/pdf|image\/(jpeg|png|gif|webp))/,
          }),
        ],
        fileIsRequired: false,
      })
    )
    files: Express.Multer.File[] | undefined,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    // When using multipart/form-data, fields come as strings
    // Parse them to get proper types
    const rawBody = body as Record<string, unknown>;

    let parsedHistory: unknown;
    let parsedContext: unknown;
    let parsedDocumentIds: unknown;
    try {
      parsedHistory =
        typeof rawBody.history === 'string' ? JSON.parse(rawBody.history) : (rawBody.history ?? []);
      parsedContext =
        typeof rawBody.context === 'string'
          ? JSON.parse(rawBody.context)
          : (rawBody.context ?? undefined);
      parsedDocumentIds =
        typeof rawBody.documentIds === 'string'
          ? JSON.parse(rawBody.documentIds)
          : (rawBody.documentIds ?? undefined);
    } catch {
      throw new BadRequestException('Ungültiges JSON in history oder context');
    }

    const parsed = StreamChatBodySchema.parse({
      message: rawBody.message,
      history: parsedHistory,
      chatId: rawBody.chatId ? rawBody.chatId : undefined,
      assistantId: rawBody.assistantId ? rawBody.assistantId : undefined,
      context: parsedContext,
      documentIds: parsedDocumentIds,
    });

    const { message, history, chatId, assistantId, context, documentIds } = parsed;

    // Authenticate the user
    const advisorId = await this.authenticateRequest(req);

    // Lookup assistant system prompt if assistantId provided
    let customSystemPrompt: string | undefined;
    if (assistantId) {
      customSystemPrompt = this.assistantService.getSystemPrompt(assistantId);
      if (customSystemPrompt) {
        this.logger.debug(`Using assistant: ${assistantId}`);
      } else {
        this.logger.warn(`Assistant not found: ${assistantId}, using default`);
      }
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Delegate full chat flow to service — controller only writes SSE events
    for await (const chunk of this.chatService.streamChat(
      advisorId,
      message,
      history,
      chatId,
      customSystemPrompt,
      context,
      files,
      documentIds
    )) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.end();
  }

  // TODO(TEC-120): authenticateRequest is duplicated from tax-assessment.controller.ts — extract to a shared NestJS guard
  private async authenticateRequest(req: Request): Promise<string> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Anmeldung erforderlich');
    }

    const token = authHeader.slice(7);
    const { data, error } = await this.supabase.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Ungültiges Token');
    }

    return data.user.id;
  }
}
