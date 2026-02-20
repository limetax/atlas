import { type DocumentSource, type DocumentStatus } from '@atlas/shared';

export type DocumentEntity = {
  id: string;
  advisoryId: string;
  clientId: string | null;
  uploadedBy: string;
  name: string;
  sizeBytes: number;
  storagePath: string;
  mimeType: string;
  source: DocumentSource;
  datevDocumentId: string | null;
  status: DocumentStatus;
  errorMessage?: string;
  chunkCount: number;
  createdAt: string;
};

export type DocumentChunkInsert = {
  documentId: string;
  advisoryId: string;
  content: string;
  pageNumber?: number;
  chunkIndex: number;
  embedding: number[];
};

/**
 * Document Repository - Domain contract for document data access
 *
 * Abstract class (not interface) so it can be used directly as NestJS injection token.
 * Follows Hexagonal Architecture naming: {Domain}Repository
 */
export abstract class DocumentRepository {
  // --- Document CRUD ---

  abstract create(params: {
    advisoryId: string;
    uploadedBy: string;
    name: string;
    sizeBytes: number;
    storagePath: string;
    mimeType: string;
    source?: DocumentSource;
    clientId?: string;
  }): Promise<DocumentEntity>;

  abstract updateStatus(
    documentId: string,
    status: DocumentStatus,
    errorMessage?: string,
    chunkCount?: number
  ): Promise<void>;

  abstract findByAdvisoryId(advisoryId: string): Promise<DocumentEntity[]>;

  abstract findById(documentId: string): Promise<DocumentEntity | null>;

  abstract delete(documentId: string): Promise<boolean>;

  // --- Chunk operations ---

  abstract insertChunks(chunks: DocumentChunkInsert[]): Promise<void>;

  // --- Chat-document join operations ---

  abstract linkToChat(chatId: string, documentId: string): Promise<void>;

  abstract unlinkFromChat(chatId: string, documentId: string): Promise<void>;

  abstract findDocumentIdsByChatId(chatId: string): Promise<string[]>;

  abstract findByChatId(chatId: string): Promise<DocumentEntity[]>;
}
