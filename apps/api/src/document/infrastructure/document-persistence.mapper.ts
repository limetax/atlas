import { Injectable } from '@nestjs/common';
import { type ChatDocumentRow } from '@atlas/shared';
import { type ChatDocumentEntity } from '@document/domain/document.entity';

/**
 * DocumentPersistenceMapper — Maps between DB rows and domain entities.
 *
 * toDomain: DB Row → Domain Entity
 */
@Injectable()
export class DocumentPersistenceMapper {
  toDomain(row: ChatDocumentRow): ChatDocumentEntity {
    return {
      id: row.id,
      chatId: row.chat_id,
      advisorId: row.advisor_id,
      fileName: row.file_name,
      fileSize: row.file_size,
      storagePath: row.storage_path,
      status: row.status,
      errorMessage: row.error_message ?? undefined,
      chunkCount: row.chunk_count,
      createdAt: row.created_at,
    };
  }
}
