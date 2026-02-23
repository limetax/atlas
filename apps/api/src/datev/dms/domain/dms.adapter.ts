import type { DmsDocument, DmsStructureItem } from '@datev/dms/domain/dms.entity';

/**
 * DmsAdapter - Domain contract for DATEV DMS access.
 * Abstract class (required for NestJS DI injection tokens).
 * Implemented by KlardatenDmsAdapter in the infrastructure layer.
 */
export abstract class DmsAdapter {
  abstract getDocuments(filter: string): Promise<DmsDocument[]>;
  abstract getDocumentById(documentId: string): Promise<DmsDocument | null>;
  abstract getStructureItems(documentId: string): Promise<DmsStructureItem[]>;
  abstract getFileContent(documentFileId: number): Promise<Buffer>;
}
