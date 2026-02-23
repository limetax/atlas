import type { DmsDocument, DmsStructureItem } from './tax-assessment.entity';

/**
 * DMS Adapter - Domain contract for Document Management System access
 * Abstract class (not interface) so it can be used as NestJS injection token.
 */
export abstract class DmsAdapter {
  abstract getDocuments(filter: string): Promise<DmsDocument[]>;
  abstract getDocumentById(documentId: string): Promise<DmsDocument | null>;
  abstract getStructureItems(documentId: string): Promise<DmsStructureItem[]>;
  abstract getFileContent(documentFileId: number): Promise<Buffer>;
}
