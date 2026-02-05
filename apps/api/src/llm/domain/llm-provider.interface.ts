import { MessageRole } from '@atlas/shared';
import { ToolCall } from './tool.types';

/**
 * Domain types for LLM operations
 * These types are used throughout the application to maintain consistency
 * and decouple from specific LLM provider implementations (LangChain, Anthropic, etc.)
 */

/**
 * Represents a message in a conversation
 */
export interface LlmMessage {
  role: MessageRole;
  content: string;
}

/**
 * Represents a streaming chunk from the LLM
 * Can be text content, or a completion signal with full response
 */
export type LlmStreamChunk =
  | { type: 'text'; content: string }
  | { type: 'done'; response: LlmResponse };

/**
 * Represents a complete LLM response
 * Contains text content and optionally tool calls
 */
export interface LlmResponse {
  /** Text content from the LLM */
  text: string;
  /** Tool calls requested by the LLM (if any) */
  toolCalls: ToolCall[];
  /** Why the response ended */
  stopReason: 'stop' | 'tool_use' | 'max_tokens';
  /** Provider-specific metadata */
  metadata?: unknown;
}
