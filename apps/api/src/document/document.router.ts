import { Ctx, Input, Mutation, Query, Router, UseMiddlewares } from 'nestjs-trpc';
import { z } from 'zod';

import { AdvisorRepository } from '@auth/domain/advisor.repository';
import { DocumentService } from '@document/application/document.service';
import { type DocumentEntity } from '@document/domain/document.entity';
import { AuthMiddleware } from '@shared/trpc/auth.middleware';
import type { User } from '@supabase/supabase-js';
import { TRPCError } from '@trpc/server';

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
 *
 * Authorization pattern:
 *   1. Resolve advisory_id from the authenticated user (via advisorRepo)
 *   2. For document mutations, verify the document belongs to that advisory before acting
 *   3. DocumentService is pure domain logic — no auth concerns
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
    const advisor = await this.advisorRepo.findById(ctx.user.id);
    if (!advisor?.advisory_id) throw new TRPCError({ code: 'FORBIDDEN' });
    const docs = await this.documentService.getDocumentsByChatId(chatId);

    return docs.filter((doc) => doc.advisoryId === advisor.advisory_id);
  }

  @Mutation({ input: DocumentIdInputSchema })
  @UseMiddlewares(AuthMiddleware)
  async deleteDocument(
    @Input('documentId') documentId: string,
    @Ctx() ctx: { user: User }
  ): Promise<boolean> {
    const advisor = await this.advisorRepo.findById(ctx.user.id);
    if (!advisor?.advisory_id) throw new TRPCError({ code: 'FORBIDDEN' });
    const doc = await this.documentService.getDocumentById(documentId);

    if (!doc || doc.advisoryId !== advisor.advisory_id) return false;

    return this.documentService.deleteDocument(documentId);
  }

  @Mutation({ input: LinkDocumentSchema })
  @UseMiddlewares(AuthMiddleware)
  async linkDocumentToChat(
    @Input('chatId') chatId: string,
    @Input('documentId') documentId: string,
    @Ctx() ctx: { user: User }
  ): Promise<boolean> {
    const advisor = await this.advisorRepo.findById(ctx.user.id);
    if (!advisor?.advisory_id) throw new TRPCError({ code: 'FORBIDDEN' });
    const doc = await this.documentService.getDocumentById(documentId);
    if (!doc || doc.advisoryId !== advisor.advisory_id) throw new TRPCError({ code: 'FORBIDDEN' });
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
    const advisor = await this.advisorRepo.findById(ctx.user.id);
    if (!advisor?.advisory_id) throw new TRPCError({ code: 'FORBIDDEN' });
    const doc = await this.documentService.getDocumentById(documentId);
    if (!doc || doc.advisoryId !== advisor.advisory_id) throw new TRPCError({ code: 'FORBIDDEN' });
    await this.documentService.unlinkDocumentFromChat(chatId, documentId);
    return true;
  }

  @Query({ input: DocumentIdInputSchema })
  @UseMiddlewares(AuthMiddleware)
  async getDownloadUrl(
    @Input('documentId') documentId: string,
    @Ctx() ctx: { user: User }
  ): Promise<{ url: string }> {
    const advisor = await this.advisorRepo.findById(ctx.user.id);
    if (!advisor?.advisory_id) throw new TRPCError({ code: 'FORBIDDEN' });
    const doc = await this.documentService.getDocumentById(documentId);
    if (!doc || doc.advisoryId !== advisor.advisory_id) throw new TRPCError({ code: 'FORBIDDEN' });
    return this.documentService.getDownloadUrl(documentId);
  }
}
