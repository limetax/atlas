import { type DocumentStatus } from '@atlas/shared';

export type ChatDocumentEntity = {
  id: string;
  chatId: string;
  advisorId: string;
  fileName: string;
  fileSize: number;
  storagePath: string;
  status: DocumentStatus;
  errorMessage?: string;
  chunkCount: number;
  createdAt: string;
};

export type DocumentChunkInsert = {
  documentId: string;
  chatId: string;
  advisorId: string;
  content: string;
  pageNumber?: number;
  chunkIndex: number;
  embedding: number[];
};

/**
 * Document Repository - Domain contract for document data access
 *
 * Abstract class (not interface) so it can be used directly as injection token
 */
export abstract class IDocumentRepository {
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
