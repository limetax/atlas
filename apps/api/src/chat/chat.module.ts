import { AssistantModule } from '@/assistant/assistant.module';
import { DatevModule } from '@/datev/datev.module';
import { ChatService } from '@chat/application/chat.service';
import { ChatController } from '@chat/chat.controller';
import { LlmModule } from '@llm/llm.module';
import { Module } from '@nestjs/common';
import { RAGModule } from '@rag/rag.module';

/**
 * Chat Module - Provides conversational AI functionality
 * Orchestrates LLM and RAG services
 * Imports AssistantModule for assistant-based chat
 */
@Module({
  imports: [LlmModule, RAGModule, AssistantModule, DatevModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
