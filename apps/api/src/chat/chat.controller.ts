import { Controller, Post, Body, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from '@chat/application/chat.service';
import { AssistantService } from '@/assistant/assistant.service';
import { Message } from '@chat/domain/message.entity';
import { ChatContext } from '@atlas/shared';

/**
 * Chat Controller - HTTP endpoint for streaming chat
 * Uses Server-Sent Events (SSE) for streaming
 * Supports optional assistantId to use pre-configured assistant prompts
 * Supports optional context for MCP tool selection
 * No try-catch - errors bubble up to NestJS exception filter
 */
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly assistantService: AssistantService
  ) {}

  @Post('stream')
  async streamChat(
    @Body()
    body: {
      message: string;
      history: Message[];
      assistantId?: string;
      context?: ChatContext;
    },
    @Res() res: Response
  ): Promise<void> {
    const { message, history, assistantId, context } = body;

    void context; // TODO: Handle context after integrating Langdock

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

    // Stream response - errors bubble up to NestJS exception filter
    for await (const chunk of this.chatService.processMessage(
      message,
      history ?? [],
      customSystemPrompt
    )) {
      const data = JSON.stringify(chunk);
      res.write(`data: ${data}\n\n`);
    }

    // Send done signal
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  }
}
