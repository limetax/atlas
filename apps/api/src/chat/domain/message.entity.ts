import { LlmMessageRole } from '@atlas/shared';

/**
 * Message Entity - Domain representation of a chat message
 *
 * This represents our business concept of a message,
 * independent of how it's transmitted or stored
 */
export interface Message {
  role: LlmMessageRole;
  content: string;
}

/**
 * Chat Stream Chunk - Domain representation of streaming response chunks
 */
export type ChatStreamChunk =
  | { type: 'text'; content: string }
  | { type: 'citations'; citations: Citation[] }
  | { type: 'tool_call'; toolCall: { name: string; status: 'started' | 'completed' } }
  | { type: 'chat_created'; chatId: string }
  | { type: 'done' }
  | { type: 'error'; error: string };

/**
 * Citation - Reference to a source document
 */
export interface Citation {
  id: string;
  source: string;
  title: string;
  content: string;
}
