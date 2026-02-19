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
