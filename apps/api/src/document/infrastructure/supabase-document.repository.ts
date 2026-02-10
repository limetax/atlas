import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '@shared/infrastructure/supabase.service';
import { type DocumentStatus } from '@atlas/shared';
import {
  IDocumentRepository,
  type ChatDocumentEntity,
  type DocumentChunkInsert,
} from '@document/domain/document.entity';
import { DocumentPersistenceMapper } from './document-persistence.mapper';

/**
 * Supabase Document Repository - Infrastructure implementation for document data access
 * Implements IDocumentRepository using Supabase client with service role key
 */
@Injectable()
export class SupabaseDocumentRepository implements IDocumentRepository {
  private readonly logger = new Logger(SupabaseDocumentRepository.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly mapper: DocumentPersistenceMapper
  ) {}

  async create(params: {
    chatId: string;
    advisorId: string;
    fileName: string;
    fileSize: number;
    storagePath: string;
  }): Promise<ChatDocumentEntity> {
    const { data, error } = await this.supabase.db
      .from('chat_documents')
      .insert({
        chat_id: params.chatId,
        advisor_id: params.advisorId,
        file_name: params.fileName,
        file_size: params.fileSize,
        storage_path: params.storagePath,
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

    const { error } = await this.supabase.db
      .from('chat_documents')
      .update(updateData)
      .eq('id', documentId);

    if (error) {
      this.logger.error(`Failed to update document status ${documentId}:`, error);
      throw new Error(`Failed to update document status: ${error.message}`);
    }
  }

  async findByChatId(chatId: string, advisorId: string): Promise<ChatDocumentEntity[]> {
    const { data, error } = await this.supabase.db
      .from('chat_documents')
      .select('*')
      .eq('chat_id', chatId)
      .eq('advisor_id', advisorId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Failed to fetch documents for chat ${chatId}:`, error);
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    return (data ?? []).map((row) => this.mapper.toDomain(row));
  }

  async findById(documentId: string, advisorId: string): Promise<ChatDocumentEntity | null> {
    const { data, error } = await this.supabase.db
      .from('chat_documents')
      .select('*')
      .eq('id', documentId)
      .eq('advisor_id', advisorId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      this.logger.error(`Failed to fetch document ${documentId}:`, error);
      throw new Error(`Failed to fetch document: ${error.message}`);
    }

    return this.mapper.toDomain(data);
  }

  async delete(documentId: string, advisorId: string): Promise<boolean> {
    const { error } = await this.supabase.db
      .from('chat_documents')
      .delete()
      .eq('id', documentId)
      .eq('advisor_id', advisorId);

    if (error) {
      this.logger.error(`Failed to delete document ${documentId}:`, error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }

    return true;
  }

  async insertChunks(chunks: DocumentChunkInsert[]): Promise<void> {
    const rows = chunks.map((chunk) => ({
      document_id: chunk.documentId,
      chat_id: chunk.chatId,
      advisor_id: chunk.advisorId,
      content: chunk.content,
      page_number: chunk.pageNumber ?? null,
      chunk_index: chunk.chunkIndex,
      embedding: chunk.embedding,
    }));

    const { error } = await this.supabase.db.from('chat_document_chunks').insert(rows);

    if (error) {
      this.logger.error('Failed to insert document chunks:', error);
      throw new Error(`Failed to insert document chunks: ${error.message}`);
    }
  }
}
