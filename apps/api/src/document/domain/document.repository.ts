import { type DocumentStatus } from '@atlas/shared';
import type { ChatDocumentEntity, DocumentChunkInsert } from './document.entity';

/**
 * Document Repository - Domain contract for document data access
 *
 * Abstract class (not interface) so it can be used directly as injection token.
 * No I-prefix following modern TypeScript conventions.
 */
export abstract class DocumentRepository {
  abstract create(params: {
    chatId: string;
    advisorId: string;
    fileName: string;
    fileSize: number;
    storagePath: string;
  }): Promise<ChatDocumentEntity>;

  abstract updateStatus(
    documentId: string,
    status: DocumentStatus,
    errorMessage?: string,
    chunkCount?: number
  ): Promise<void>;

  abstract findByChatId(chatId: string, advisorId: string): Promise<ChatDocumentEntity[]>;

  abstract findById(documentId: string, advisorId: string): Promise<ChatDocumentEntity | null>;

  abstract delete(documentId: string, advisorId: string): Promise<boolean>;

  abstract insertChunks(chunks: DocumentChunkInsert[]): Promise<void>;
}
