import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  Logger,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ChatService } from '@chat/application/chat.service';
import { AssistantService } from '@/assistant/assistant.service';
import { IChatRepository } from '@chat/domain/chat.entity';
import { SupabaseService } from '@shared/infrastructure/supabase.service';
import { LlmService } from '@llm/application/llm.service';
import { TITLE_GENERATION_PROMPT } from '@chat/application/chat.prompts';
import { z } from 'zod';
import { ChatMessageMetadata, ChatContextSchema, MessageSchema } from '@atlas/shared';

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
    private readonly supabase: SupabaseService,
    private readonly llmService: LlmService
  ) {}

  @Post('stream')
  async streamChat(
    @Body() body: unknown,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const { message, history, chatId, assistantId, context } = StreamChatBodySchema.parse(body);

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

      // Fire-and-forget: generate AI title in background
      this.generateSmartTitle(resolvedChatId, advisorId, message).catch((err) =>
        this.logger.warn(`Failed to generate smart title: ${err.message}`)
      );
    } else {
      // Auto-title: if this is the first message in an existing chat, update title
      const existingMessages = await this.chatRepo.findMessagesByChatId(resolvedChatId, advisorId);
      if (existingMessages.length === 0) {
        // Fire-and-forget: generate AI title in background
        this.generateSmartTitle(resolvedChatId, advisorId, message).catch((err) =>
          this.logger.warn(`Failed to generate smart title: ${err.message}`)
        );
      }
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
      context
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
   * Fire-and-forget: generates an AI title from the first user message
   * and updates the chat record. Non-blocking — errors are logged, not thrown.
   */
  private async generateSmartTitle(
    chatId: string,
    advisorId: string,
    firstMessage: string
  ): Promise<void> {
    const title = await this.llmService.getCompletion(
      [{ role: 'user', content: firstMessage }],
      TITLE_GENERATION_PROMPT
    );

    const trimmedTitle = title.trim().substring(0, 100);
    if (trimmedTitle) {
      await this.chatRepo.updateTitle(chatId, advisorId, trimmedTitle);
      this.logger.debug(`Generated smart title for chat ${chatId}: "${trimmedTitle}"`);
    }
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
