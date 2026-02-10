import { Router, Query, Mutation, UseMiddlewares, Input, Ctx } from 'nestjs-trpc';
import { z } from 'zod';
import { DocumentService } from '@document/application/document.service';
import { type ChatDocumentEntity } from '@document/domain/document.entity';
import { AuthMiddleware } from '@shared/trpc/auth.middleware';
import type { User } from '@supabase/supabase-js';

const ChatIdInputSchema = z.object({
  chatId: z.string().uuid(),
});

const DocumentIdInputSchema = z.object({
  documentId: z.string().uuid(),
});

/**
 * Document Router - tRPC procedures for document management
 * Upload is handled by ChatController (multipart/form-data SSE endpoint)
 */
@Router({ alias: 'document' })
export class DocumentRouter {
  constructor(private readonly documentService: DocumentService) {}

  @Query({ input: ChatIdInputSchema })
  @UseMiddlewares(AuthMiddleware)
  async getDocumentsByChatId(
    @Input('chatId') chatId: string,
    @Ctx() ctx: { user: User }
  ): Promise<ChatDocumentEntity[]> {
    return this.documentService.getDocumentsByChat(chatId, ctx.user.id);
  }

  @Mutation({ input: DocumentIdInputSchema })
  @UseMiddlewares(AuthMiddleware)
  async deleteDocument(
    @Input('documentId') documentId: string,
    @Ctx() ctx: { user: User }
  ): Promise<boolean> {
    return this.documentService.deleteDocument(documentId, ctx.user.id);
  }
}
