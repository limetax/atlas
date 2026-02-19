import {
  ChatContext,
  ChatContextSchema,
  ChatInsert,
  ChatMessageInsert,
  ChatMessageMetadata,
  ChatMessageMetadataSchema,
  ChatMessageRow,
  ChatRow,
  Json,
  MessageRole,
} from '@atlas/shared';
import { Chat, ChatMessage } from '@chat/domain/chat.entity';
import { Injectable } from '@nestjs/common';

/**
 * Converts a domain value to a Supabase-compatible Json value.
 * JSON round-trip guarantees the result is a valid Json type at runtime.
 */
function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value));
}

/**
 * ChatPersistenceMapper — Maps between DB rows and domain entities.
 *
 * toDomain:       DB Row → Zod-parsed → Domain Entity (runtime-validated)
 * toPersistence:  Domain Entity → DB Insert shape
 */
@Injectable()
export class ChatPersistenceMapper {
  chatToDomain(row: ChatRow): Chat {
    const context = ChatContextSchema.catch({}).parse(row.context ?? {});

    return {
      id: row.id,
      advisorId: row.advisor_id,
      title: row.title,
      context,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  chatToPersistence(advisorId: string, title: string, context?: ChatContext): ChatInsert {
    return {
      advisor_id: advisorId,
      title,
      context: toJson(context ?? {}),
    };
  }

  messageToDomain(row: ChatMessageRow): ChatMessage {
    const metadata = ChatMessageMetadataSchema.catch({}).parse(row.metadata ?? {});

    return {
      id: row.id,
      chatId: row.chat_id,
      role: row.role,
      content: row.content,
      metadata,
      createdAt: row.created_at,
    };
  }

  messageToPersistence(
    chatId: string,
    role: MessageRole,
    content: string,
    metadata?: ChatMessageMetadata
  ): ChatMessageInsert {
    return {
      chat_id: chatId,
      role,
      content,
      metadata: toJson(metadata ?? {}),
    };
  }
}
