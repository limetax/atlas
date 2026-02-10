import { Module } from '@nestjs/common';
import { DocumentService } from '@document/application/document.service';
import { DocumentRouter } from '@document/document.router';
import { DocumentPersistenceMapper } from '@document/infrastructure/document-persistence.mapper';
import { SupabaseDocumentRepository } from '@document/infrastructure/supabase-document.repository';
import { IDocumentRepository } from '@document/domain/document.entity';

/**
 * Document Module - Provides PDF document processing for chat
 * Handles upload, parsing, chunking, embedding, and storage
 */
@Module({
  providers: [
    DocumentService,
    DocumentRouter,
    DocumentPersistenceMapper,
    SupabaseDocumentRepository,
    {
      provide: IDocumentRepository,
      useClass: SupabaseDocumentRepository,
    },
  ],
  exports: [DocumentService],
})
export class DocumentModule {}
