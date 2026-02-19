import { Router, Query, Mutation, UseMiddlewares, Input, Ctx } from 'nestjs-trpc';
import { z } from 'zod';
import { DocumentService } from '@document/application/document.service';
import { type DocumentEntity } from '@document/domain/document.entity';
import { AdvisorRepository } from '@auth/domain/advisor.repository';
import { AuthMiddleware } from '@shared/trpc/auth.middleware';
import type { User } from '@supabase/supabase-js';

const DocumentIdInputSchema = z.object({
  documentId: z.string().uuid(),
});

const ChatIdInputSchema = z.object({
  chatId: z.string().uuid(),
});

const LinkDocumentSchema = z.object({
  chatId: z.string().uuid(),
  documentId: z.string().uuid(),
});

/**
 * Document Router - tRPC procedures for advisory-scoped document management
 * Upload is handled by DocumentController (multipart/form-data HTTP endpoint)
 */
@Router({ alias: 'document' })
export class DocumentRouter {
  constructor(
    private readonly documentService: DocumentService,
    private readonly advisorRepo: AdvisorRepository
  ) {}

  @Query()
  @UseMiddlewares(AuthMiddleware)
  async listDocuments(@Ctx() ctx: { user: User }): Promise<DocumentEntity[]> {
    const advisor = await this.advisorRepo.findById(ctx.user.id);
    if (!advisor?.advisory_id) return [];
    return this.documentService.getDocumentsByAdvisory(advisor.advisory_id);
  }

  @Query({ input: ChatIdInputSchema })
  @UseMiddlewares(AuthMiddleware)
  async getDocumentsByChatId(
    @Input('chatId') chatId: string,
    @Ctx() ctx: { user: User }
  ): Promise<DocumentEntity[]> {
    void ctx;
    return this.documentService.getDocumentsByChatId(chatId);
  }

  @Mutation({ input: DocumentIdInputSchema })
  @UseMiddlewares(AuthMiddleware)
  async deleteDocument(
    @Input('documentId') documentId: string,
    @Ctx() ctx: { user: User }
  ): Promise<boolean> {
    void ctx;
    return this.documentService.deleteDocument(documentId);
  }

  @Mutation({ input: LinkDocumentSchema })
  @UseMiddlewares(AuthMiddleware)
  async linkDocumentToChat(
    @Input('chatId') chatId: string,
    @Input('documentId') documentId: string,
    @Ctx() ctx: { user: User }
  ): Promise<boolean> {
    void ctx;
    await this.documentService.linkDocumentToChat(chatId, documentId);
    return true;
  }

  @Mutation({ input: LinkDocumentSchema })
  @UseMiddlewares(AuthMiddleware)
  async unlinkDocumentFromChat(
    @Input('chatId') chatId: string,
    @Input('documentId') documentId: string,
    @Ctx() ctx: { user: User }
  ): Promise<boolean> {
    void ctx;
    await this.documentService.unlinkDocumentFromChat(chatId, documentId);
    return true;
  }

  @Query({ input: DocumentIdInputSchema })
  @UseMiddlewares(AuthMiddleware)
  async getDownloadUrl(
    @Input('documentId') documentId: string,
    @Ctx() ctx: { user: User }
  ): Promise<{ url: string }> {
    void ctx;
    return this.documentService.getDownloadUrl(documentId);
  }
}
