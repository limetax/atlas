import { type DocumentSource, type DocumentStatus } from '@atlas/shared';
import {
  type DocumentChunkInsert,
  type DocumentEntity,
  DocumentRepository,
} from '@document/domain/document.entity';
import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '@shared/infrastructure/supabase.service';

import { DocumentPersistenceMapper } from './document-persistence.mapper';
import { sanitizeTextForPostgres } from './text-sanitizer.util';

/**
 * Supabase Document Repository - Infrastructure implementation for document data access
 * Extends DocumentRepository using Supabase client with service role key
 */
@Injectable()
export class SupabaseDocumentRepository extends DocumentRepository {
  private readonly logger = new Logger(SupabaseDocumentRepository.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly mapper: DocumentPersistenceMapper
  ) {
    super();
  }

  // --- Document CRUD ---

  async create(params: {
    advisoryId: string;
    uploadedBy: string;
    name: string;
    sizeBytes: number;
    storagePath: string;
    mimeType: string;
    source?: DocumentSource;
    clientId?: string;
  }): Promise<DocumentEntity> {
    const { data, error } = await this.supabase.db
      .from('documents')
      .insert({
        advisory_id: params.advisoryId,
        uploaded_by: params.uploadedBy,
        name: params.name,
        size_bytes: params.sizeBytes,
        storage_path: params.storagePath,
        mime_type: params.mimeType,
        source: params.source ?? 'limetaxos',
        client_id: params.clientId ?? null,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create document:', error);
      throw new Error(`Failed to create document: ${error.message}`);
    }

    return this.mapper.toDomain(data);
  }

  async updateStatus(
    documentId: string,
    status: DocumentStatus,
    errorMessage?: string,
    chunkCount?: number
  ): Promise<void> {
    const updateData: Record<string, unknown> = { status };
    if (errorMessage !== undefined) {
      updateData.error_message = errorMessage;
    }
    if (chunkCount !== undefined) {
      updateData.chunk_count = chunkCount;
    }

    const { data, error } = await this.supabase.db
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
      .select('id');

    if (error || !data?.length) {
      const reason = error?.message ?? 'no rows updated (document not found or RLS blocked)';
      this.logger.error(`Failed to update document status for ${documentId}: ${reason}`);
      throw new Error(`Failed to update document status: ${reason}`);
    }
  }

  async findByAdvisoryId(advisoryId: string): Promise<DocumentEntity[]> {
    const { data, error } = await this.supabase.db
      .from('documents')
      .select('*')
      .eq('advisory_id', advisoryId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Failed to fetch documents for advisory ${advisoryId}:`, error);
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    return (data ?? []).map((row) => this.mapper.toDomain(row));
  }

  async findById(documentId: string): Promise<DocumentEntity | null> {
    const { data, error } = await this.supabase.db
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      this.logger.error(`Failed to fetch document ${documentId}:`, error);
      throw new Error(`Failed to fetch document: ${error.message}`);
    }

    return this.mapper.toDomain(data);
  }

  async delete(documentId: string): Promise<boolean> {
    const { error } = await this.supabase.db.from('documents').delete().eq('id', documentId);

    if (error) {
      this.logger.error(`Failed to delete document ${documentId}:`, error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }

    return true;
  }

  // --- Chunk operations ---

  async insertChunks(chunks: DocumentChunkInsert[]): Promise<void> {
    const rows = chunks.map((chunk) => {
      const { sanitized, charsRemoved } = sanitizeTextForPostgres(chunk.content);

      if (charsRemoved > 0) {
        this.logger.warn(
          `Sanitization removed ${charsRemoved} character${charsRemoved !== 1 ? 's' : ''} from document chunk (${chunk.content.length} → ${sanitized.length} chars)`
        );
      }

      return {
        document_id: chunk.documentId,
        advisory_id: chunk.advisoryId,
        content: sanitized,
        page_number: chunk.pageNumber ?? null,
        chunk_index: chunk.chunkIndex,
        embedding: chunk.embedding,
      };
    });

    const { error } = await this.supabase.db.from('document_chunks').insert(rows);

    if (error) {
      this.logger.error('Failed to insert document chunks:', error);
      throw new Error(`Failed to insert document chunks: ${error.message}`);
    }
  }

  // --- Chat-document join operations ---

  async linkToChat(chatId: string, documentId: string): Promise<void> {
    const { error } = await this.supabase.db
      .from('chat_documents')
      .upsert({ chat_id: chatId, document_id: documentId }, { onConflict: 'chat_id,document_id' });

    if (error) {
      this.logger.error(`Failed to link document ${documentId} to chat ${chatId}:`, error);
      throw new Error(`Failed to link document to chat: ${error.message}`);
    }
  }

  async unlinkFromChat(chatId: string, documentId: string): Promise<void> {
    const { error } = await this.supabase.db
      .from('chat_documents')
      .delete()
      .eq('chat_id', chatId)
      .eq('document_id', documentId);

    if (error) {
      this.logger.error(`Failed to unlink document ${documentId} from chat ${chatId}:`, error);
      throw new Error(`Failed to unlink document from chat: ${error.message}`);
    }
  }

  async findDocumentIdsByChatId(chatId: string): Promise<string[]> {
    const { data, error } = await this.supabase.db
      .from('chat_documents')
      .select('document_id')
      .eq('chat_id', chatId);

    if (error) {
      this.logger.error(`Failed to fetch document IDs for chat ${chatId}:`, error);
      throw new Error(`Failed to fetch document IDs: ${error.message}`);
    }

    return (data ?? []).map((row) => row.document_id);
  }

  async findByChatId(chatId: string): Promise<DocumentEntity[]> {
    const { data: links, error: linkError } = await this.supabase.db
      .from('chat_documents')
      .select('document_id')
      .eq('chat_id', chatId);

    if (linkError) {
      this.logger.error(`Failed to fetch chat document links for chat ${chatId}:`, linkError);
      throw new Error(`Failed to fetch chat documents: ${linkError.message}`);
    }

    if (!links?.length) return [];

    const documentIds = links.map((l) => l.document_id);

    const { data, error } = await this.supabase.db
      .from('documents')
      .select('*')
      .in('id', documentIds)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Failed to fetch documents for chat ${chatId}:`, error);
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    return (data ?? []).map((row) => this.mapper.toDomain(row));
  }
}
