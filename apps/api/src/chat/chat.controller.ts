import { Controller, Post, Body, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from '@chat/application/chat.service';
import { AssistantService } from '@/assistant/assistant.service';
import { Message } from '@chat/domain/message.entity';

/**
 * Chat Controller - HTTP endpoint for streaming chat
 * Uses Server-Sent Events (SSE) for streaming
 * Supports optional assistantId to use pre-configured assistant prompts
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
    @Body() body: { message: string; history: Message[]; assistantId?: string },
    @Res() res: Response
  ) {
    const { message, history, assistantId } = body;

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

    try {
      // Stream response (pass customSystemPrompt if assistant selected)
      for await (const chunk of this.chatService.processMessage(
        message,
        history || [],
        customSystemPrompt
      )) {
        const data = JSON.stringify(chunk);
        res.write(`data: ${data}\n\n`);
      }

      // Send done signal
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
    } catch (error) {
      this.logger.error('Streaming error:', error);
      const errorData = JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
      });
      res.write(`data: ${errorData}\n\n`);
      res.end();
    }
  }
}
