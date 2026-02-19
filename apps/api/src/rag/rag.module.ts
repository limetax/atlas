import { Module } from '@nestjs/common';
import { SupabaseVectorStoreAdapter } from '@rag/infrastructure/supabase-vector-store.adapter';
import { RAGService } from '@rag/application/rag.service';
import { InfrastructureModule } from '@shared/infrastructure/infrastructure.module';
import { LlmModule } from '@llm/llm.module';
import { VectorStoreAdapter } from '@rag/domain/vector-store.adapter';

/**
 * RAG Module - Provides Retrieval-Augmented Generation services
 *
 * Uses provider pattern to inject abstract classes:
 * - VectorStoreAdapter → SupabaseVectorStoreAdapter
 */
@Module({
  imports: [InfrastructureModule, LlmModule],
  providers: [
    // Infrastructure implementation
    SupabaseVectorStoreAdapter,
    // Domain abstract class provider (proper NestJS DI)
    {
      provide: VectorStoreAdapter,
      useClass: SupabaseVectorStoreAdapter,
    },
    // Application service
    RAGService,
  ],
  exports: [VectorStoreAdapter, RAGService],
})
export class RAGModule {}
