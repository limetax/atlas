import { Module } from '@nestjs/common';
import { ChatService } from '@chat/application/chat.service';
import { ChatController } from '@chat/chat.controller';
import { LlmModule } from '@llm/llm.module';
import { RAGModule } from '@rag/rag.module';

/**
 * Chat Module - Provides conversational AI functionality
 * Orchestrates LLM and RAG services
 */
@Module({
  imports: [LlmModule, RAGModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
