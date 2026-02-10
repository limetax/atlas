import { Request, Response } from 'express';
import { z } from 'zod';

import { AssistantService } from '@/assistant/assistant.service';
import {
  ChatContextSchema,
  type ChatDocument,
  ChatMessageMetadata,
  MessageSchema,
} from '@atlas/shared';
import { ChatService } from '@chat/application/chat.service';
import { IChatRepository } from '@chat/domain/chat.entity';
import { DocumentService } from '@document/application/document.service';
import {
  Body,
  Controller,
  Inject,
  Logger,
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
    @Inject(IChatRepository) private readonly chatRepo: IChatRepository,
    private readonly documentService: DocumentService,
    private readonly supabase: SupabaseService
  ) {}

  @Post('stream')
  @UseInterceptors(FilesInterceptor('files', 5))
  async streamChat(
    @Body() body: unknown,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    // When using multipart/form-data, fields come as strings
    // Parse them to get proper types
    const rawBody = body as Record<string, unknown>;
    const parsed = StreamChatBodySchema.parse({
      message: rawBody.message,
      history:
        typeof rawBody.history === 'string' ? JSON.parse(rawBody.history) : (rawBody.history ?? []),
      chatId: rawBody.chatId || undefined,
      assistantId: rawBody.assistantId || undefined,
      context:
        typeof rawBody.context === 'string'
          ? JSON.parse(rawBody.context)
          : (rawBody.context ?? undefined),
    });

    const { message, history, chatId, assistantId, context } = parsed;

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

    // Resolve or create the chat
    let resolvedChatId = chatId;

    if (!resolvedChatId) {
      // Lazy chat creation: create a new chat on first message
      const autoTitle = message.substring(0, 50) + (message.length > 50 ? '...' : '');
      const chat = await this.chatRepo.create(advisorId, autoTitle, context);
      resolvedChatId = chat.id;

      // Notify the frontend of the newly created chat ID
      res.write(`data: ${JSON.stringify({ type: 'chat_created', chatId: resolvedChatId })}\n\n`);
    } else {
      // Auto-title: if this is the first message in an existing chat, update title
      const existingMessages = await this.chatRepo.findMessagesByChatId(resolvedChatId, advisorId);
      if (existingMessages.length === 0) {
        const autoTitle = message.substring(0, 50) + (message.length > 50 ? '...' : '');
        await this.chatRepo.updateTitle(resolvedChatId, advisorId, autoTitle);
      }
    }

    // Process uploaded files (before LLM call so content is available for RAG)
    const processedDocuments: ChatDocument[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const doc = await this.documentService.processAndStore(file, resolvedChatId, advisorId);
        processedDocuments.push({
          id: doc.id,
          chatId: doc.chatId,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          status: doc.status,
          errorMessage: doc.errorMessage,
          chunkCount: doc.chunkCount,
          createdAt: doc.createdAt,
        });
      }

      // Notify frontend that files are processed
      res.write(
        `data: ${JSON.stringify({ type: 'files_processed', documents: processedDocuments })}\n\n`
      );
    }

    // Persist user message before streaming
    await this.chatRepo.addMessage(resolvedChatId, 'user', message);

    // Stream response and accumulate assistant content + tool calls
    let assistantContent = '';
    const toolCalls: Array<{ name: string; status: 'started' | 'completed' }> = [];

    for await (const chunk of this.chatService.processMessage(
      message,
      history ?? [],
      customSystemPrompt,
      context,
      resolvedChatId
    )) {
      const data = JSON.stringify(chunk);
      res.write(`data: ${data}\n\n`);

      // Accumulate text content for persistence
      if (chunk.type === 'text' && chunk.content) {
        assistantContent += chunk.content;
      }

      // Accumulate tool calls for metadata persistence
      if (chunk.type === 'tool_call' && chunk.toolCall) {
        const existingIdx = toolCalls.findIndex((tc) => tc.name === chunk.toolCall.name);
        if (existingIdx >= 0) {
          toolCalls[existingIdx] = chunk.toolCall;
        } else {
          toolCalls.push(chunk.toolCall);
        }
      }
    }

    // Persist the complete assistant response with metadata
    if (assistantContent) {
      const metadata: ChatMessageMetadata = toolCalls.length > 0 ? { toolCalls } : {};
      await this.chatRepo.addMessage(resolvedChatId, 'assistant', assistantContent, metadata);
    }

    // Send done signal
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  }

  /**
   * Extract and validate JWT from Authorization header
   * Returns the advisor (user) ID
   */
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
