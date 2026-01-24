import { Module } from '@nestjs/common';
import { SupabaseVectorAdapter } from '@rag/infrastructure/supabase-vector.adapter';
import { RAGService } from '@rag/application/rag.service';
import { InfrastructureModule } from '@shared/infrastructure/infrastructure.module';
import { LlmModule } from '@llm/llm.module';
import { IVectorStore } from '@rag/domain/vector-store.interface';

/**
 * RAG Module - Provides Retrieval-Augmented Generation services
 *
 * Uses provider pattern to inject interfaces:
 * - IVectorStore → SupabaseVectorAdapter
 */
@Module({
  imports: [InfrastructureModule, LlmModule],
  providers: [
    // Infrastructure implementation
    SupabaseVectorAdapter,
    // Domain abstract class provider (proper NestJS DI)
    {
      provide: IVectorStore,
      useClass: SupabaseVectorAdapter,
    },
    // Application service
    RAGService,
  ],
  exports: [IVectorStore, RAGService],
})
export class RAGModule {}
