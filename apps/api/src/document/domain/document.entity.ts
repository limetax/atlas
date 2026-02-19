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
