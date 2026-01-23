import { Module } from '@nestjs/common';
import { RAGService } from './rag.service';

/**
 * RAG Module - Provides semantic search functionality
 */
@Module({
  providers: [RAGService],
  exports: [RAGService],
})
export class RAGModule {}
