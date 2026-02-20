import { AuthModule } from '@auth/auth.module';
import { DocumentService } from '@document/application/document.service';
import { DocumentController } from '@document/document.controller';
import { DocumentRouter } from '@document/document.router';
import { DocumentRepository } from '@document/domain/document.entity';
import { DocumentPersistenceMapper } from '@document/infrastructure/document-persistence.mapper';
import { SupabaseDocumentRepository } from '@document/infrastructure/supabase-document.repository';
import { LlmModule } from '@llm/llm.module';
import { Module } from '@nestjs/common';
import { InfrastructureModule } from '@shared/infrastructure/infrastructure.module';

/**
 * Document Module - Provides advisory-scoped document management
 * Handles upload, parsing, chunking, embedding, storage, and chat linking
 */
@Module({
  imports: [InfrastructureModule, LlmModule, AuthModule],
  controllers: [DocumentController],
  providers: [
    DocumentService,
    DocumentRouter,
    DocumentPersistenceMapper,
    {
      provide: DocumentRepository,
      useClass: SupabaseDocumentRepository,
    },
  ],
  exports: [DocumentService],
})
export class DocumentModule {}
