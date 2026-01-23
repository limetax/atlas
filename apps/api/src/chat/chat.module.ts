import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { RAGModule } from '../rag/rag.module';

/**
 * Chat Module - Provides chat functionality
 */
@Module({
  imports: [RAGModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
