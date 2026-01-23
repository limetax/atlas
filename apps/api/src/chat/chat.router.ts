import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc/trpc.service';
import { observable } from '@trpc/server/observable';
import { ChatService } from './chat.service';
import { MessageSchema, ChatStreamChunk } from '@lime-gpt/shared';

/**
 * Chat Router - tRPC procedures for chat functionality
 * Implements streaming via tRPC subscriptions
 */
@Injectable()
export class ChatRouter {
  private readonly logger = new Logger(ChatRouter.name);

  constructor(private readonly chatService: ChatService) {}

  createRouter() {
    return router({
      sendMessage: protectedProcedure
        .input(
          z.object({
            message: z.string().min(1),
            history: z.array(MessageSchema),
          })
        )
        .subscription(({ input, ctx }) => {
          return observable<ChatStreamChunk>((emit) => {
            (async () => {
              try {
                this.logger.debug(
                  `[${ctx.requestId}] Starting chat stream for: ${input.message.substring(0, 50)}...`
                );

                // Stream from ChatService
                for await (const chunk of this.chatService.processMessage(
                  input.message,
                  input.history
                )) {
                  emit.next(chunk);
                }

                emit.complete();
                this.logger.debug(`[${ctx.requestId}] Chat stream completed`);
              } catch (error) {
                this.logger.error(`[${ctx.requestId}] Chat stream error:`, error);
                emit.error(error);
              }
            })();
          });
        }),
    });
  }
}
