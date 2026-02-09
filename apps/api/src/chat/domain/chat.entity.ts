import { ChatContext, ChatMessageMetadata, MessageRole } from '@atlas/shared';

/**
 * Chat Entity - Domain representation of a chat session
 */
export type Chat = {
  id: string;
  advisorId: string;
  title: string;
  context: ChatContext;
  createdAt: string;
  updatedAt: string;
};

/**
 * ChatMessage Entity - Domain representation of a persisted chat message
 */
export type ChatMessage = {
  id: string;
  chatId: string;
  role: MessageRole;
  content: string;
  metadata: ChatMessageMetadata;
  createdAt: string;
};

/**
 * Chat Repository - Domain contract for chat data access
 *
 * Abstract class (not interface) so it can be used directly as injection token
 */
export abstract class IChatRepository {
  /** List all chats for an advisor, ordered by updatedAt DESC */
  abstract findAllByAdvisorId(advisorId: string): Promise<Chat[]>;

  /** Get a single chat by ID (null if not found or not owned) */
  abstract findById(chatId: string, advisorId: string): Promise<Chat | null>;

  /** Create a new chat session */
  abstract create(advisorId: string, title: string, context?: ChatContext): Promise<Chat>;

  /** Update chat title */
  abstract updateTitle(chatId: string, advisorId: string, title: string): Promise<Chat | null>;

  /** Update chat context */
  abstract updateContext(
    chatId: string,
    advisorId: string,
    context: ChatContext
  ): Promise<Chat | null>;

  /** Delete a chat (cascade deletes messages) */
  abstract delete(chatId: string, advisorId: string): Promise<boolean>;

  /** Get all messages for a chat, ordered by createdAt ASC */
  abstract findMessagesByChatId(chatId: string, advisorId: string): Promise<ChatMessage[]>;

  /** Add a message to a chat */
  abstract addMessage(
    chatId: string,
    role: MessageRole,
    content: string,
    metadata?: ChatMessageMetadata
  ): Promise<ChatMessage>;
}
