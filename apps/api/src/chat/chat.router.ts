import { Router, Query, Mutation, UseMiddlewares, Input, Ctx } from 'nestjs-trpc';
import { z } from 'zod';
import { ChatRepository } from '@chat/domain/chat.repository';
import { type Chat, type ChatMessage } from '@chat/domain/chat.entity';
import { AuthMiddleware } from '@shared/trpc/auth.middleware';
import type { User } from '@supabase/supabase-js';
// Values inlined for nestjs-trpc code generation (it cannot resolve imported constants).
// Keep in sync with RESEARCH_SOURCES and INTEGRATION_TYPES from @atlas/shared.
const ChatContextSchema = z.object({
  research: z.array(z.enum(['handelsregister', 'german_law', 'law_publishers'])).optional(),
  integration: z.enum(['datev']).optional(),
  mandant: z.string().optional(),
});

const CreateChatInputSchema = z.object({
  title: z.string().max(200).optional(),
  context: ChatContextSchema.optional(),
});

const UpdateTitleInputSchema = z.object({
  chatId: z.string().uuid(),
  title: z.string().min(1).max(200),
});

const UpdateContextInputSchema = z.object({
  chatId: z.string().uuid(),
  context: ChatContextSchema,
});

const ChatIdInputSchema = z.object({
  chatId: z.string().uuid(),
});

/**
 * Chat Router - tRPC procedures for chat CRUD operations
 * Streaming is handled separately by ChatController (SSE)
 */
@Router({ alias: 'chat' })
export class ChatRouter {
  constructor(private readonly chatRepo: ChatRepository) {}

  @Query()
  @UseMiddlewares(AuthMiddleware)
  async listChats(@Ctx() ctx: { user: User }): Promise<Chat[]> {
    return this.chatRepo.findAllByAdvisorId(ctx.user.id);
  }

  @Query({ input: ChatIdInputSchema })
  @UseMiddlewares(AuthMiddleware)
  async getChat(@Input('chatId') chatId: string, @Ctx() ctx: { user: User }): Promise<Chat | null> {
    return this.chatRepo.findById(chatId, ctx.user.id);
  }

  @Mutation({ input: CreateChatInputSchema })
  @UseMiddlewares(AuthMiddleware)
  async createChat(
    @Input('title') title: string | undefined,
    @Input('context') context: z.infer<typeof ChatContextSchema> | undefined,
    @Ctx() ctx: { user: User }
  ): Promise<Chat> {
    return this.chatRepo.create(ctx.user.id, title ?? 'Neuer Chat', context);
  }

  @Mutation({ input: UpdateTitleInputSchema })
  @UseMiddlewares(AuthMiddleware)
  async updateChatTitle(
    @Input('chatId') chatId: string,
    @Input('title') title: string,
    @Ctx() ctx: { user: User }
  ): Promise<Chat | null> {
    return this.chatRepo.updateTitle(chatId, ctx.user.id, title);
  }

  @Mutation({ input: UpdateContextInputSchema })
  @UseMiddlewares(AuthMiddleware)
  async updateChatContext(
    @Input('chatId') chatId: string,
    @Input('context') context: z.infer<typeof ChatContextSchema>,
    @Ctx() ctx: { user: User }
  ): Promise<Chat | null> {
    return this.chatRepo.updateContext(chatId, ctx.user.id, context);
  }

  @Mutation({ input: ChatIdInputSchema })
  @UseMiddlewares(AuthMiddleware)
  async deleteChat(@Input('chatId') chatId: string, @Ctx() ctx: { user: User }): Promise<boolean> {
    return this.chatRepo.delete(chatId, ctx.user.id);
  }

  @Query({ input: ChatIdInputSchema })
  @UseMiddlewares(AuthMiddleware)
  async getChatMessages(
    @Input('chatId') chatId: string,
    @Ctx() ctx: { user: User }
  ): Promise<ChatMessage[]> {
    return this.chatRepo.findMessagesByChatId(chatId, ctx.user.id);
  }
}
