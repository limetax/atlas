import { Controller, Post, Body, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { Message } from '@lime-gpt/shared';

/**
 * Chat Controller - HTTP endpoint for streaming chat
 * Uses Server-Sent Events (SSE) for streaming
 */
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post('stream')
  async streamChat(@Body() body: { message: string; history: Message[] }, @Res() res: Response) {
    const { message, history } = body;

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      // Stream response
      for await (const chunk of this.chatService.processMessage(message, history || [])) {
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
