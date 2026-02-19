import { Module } from '@nestjs/common';
import { DocumentService } from '@document/application/document.service';
import { DocumentRouter } from '@document/document.router';
import { DocumentPersistenceMapper } from '@document/infrastructure/document-persistence.mapper';
import { SupabaseDocumentRepository } from '@document/infrastructure/supabase-document.repository';
import { DocumentRepository } from '@document/domain/document.repository';
import { InfrastructureModule } from '@shared/infrastructure/infrastructure.module';
import { LlmModule } from '@llm/llm.module';

/**
 * Document Module - Provides PDF document processing for chat
 * Handles upload, parsing, chunking, embedding, and storage
 */
@Module({
  imports: [InfrastructureModule, LlmModule],
  providers: [
    DocumentService,
    DocumentRouter,
    DocumentPersistenceMapper,
    SupabaseDocumentRepository,
    {
      provide: DocumentRepository,
      useClass: SupabaseDocumentRepository,
    },
  ],
  exports: [DocumentService],
})
export class DocumentModule {}
