import { Injectable } from '@nestjs/common';
import { type DocumentRow, DOCUMENT_SOURCES, type DocumentSource } from '@atlas/shared';
import { type DocumentEntity } from '@document/domain/document.entity';

const isDocumentSource = (value: string): value is DocumentSource =>
  DOCUMENT_SOURCES.includes(value as DocumentSource);

/**
 * DocumentPersistenceMapper — Maps between DB rows and domain entities.
 *
 * toDomain: DB Row → Domain Entity
 */
@Injectable()
export class DocumentPersistenceMapper {
  toDomain(row: DocumentRow): DocumentEntity {
    return {
      id: row.id,
      advisoryId: row.advisory_id,
      clientId: row.client_id ?? null,
      uploadedBy: row.uploaded_by,
      name: row.name,
      sizeBytes: row.size_bytes,
      storagePath: row.storage_path,
      mimeType: row.mime_type,
      source: isDocumentSource(row.source) ? row.source : 'limetaxos',
      datevDocumentId: row.datev_document_id ?? null,
      status: row.status,
      errorMessage: row.error_message ?? undefined,
      chunkCount: row.chunk_count,
      createdAt: row.created_at,
    };
  }
}
