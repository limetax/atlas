import { AssistantModule } from '@/assistant/assistant.module';
import { DatevModule } from '@/datev/datev.module';
import { DocumentModule } from '@/document/document.module';
import { AuthModule } from '@auth/auth.module';
import { ChatService } from '@chat/application/chat.service';
import { ChatController } from '@chat/chat.controller';
import { ChatRouter } from '@chat/chat.router';
import { ChatRepository } from '@chat/domain/chat.repository';
import { ChatPersistenceMapper } from '@chat/infrastructure/chat-persistence.mapper';
import { SupabaseChatRepository } from '@chat/infrastructure/supabase-chat.repository';
import { LlmModule } from '@llm/llm.module';
import { Module } from '@nestjs/common';
import { RAGModule } from '@rag/rag.module';

/**
 * Chat Module - Provides conversational AI functionality
 * Orchestrates LLM and RAG services
 * Provides tRPC router for chat CRUD and SSE controller for streaming
 */
@Module({
  imports: [LlmModule, RAGModule, AssistantModule, DatevModule, DocumentModule, AuthModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatRouter,
    ChatPersistenceMapper,
    SupabaseChatRepository,
    {
      provide: ChatRepository,
      useClass: SupabaseChatRepository,
    },
  ],
  exports: [ChatService, ChatRepository],
})
export class ChatModule {}
