import { MessageRole } from '@atlas/shared';
import { ToolCall } from './tool.types';

/**
 * Domain types for LLM operations
 * These types are used throughout the application to maintain consistency
 * and decouple from specific LLM provider implementations (LangChain, Anthropic, etc.)
 */

/**
 * Content block types for Anthropic's multimodal messages
 * Supports text, documents (PDFs), and images
 */
export type ContentBlock =
  | { type: 'text'; text: string }
  | {
      type: 'document';
      source: { type: 'base64'; media_type: string; data: string };
    }
  | {
      type: 'image';
      source: { type: 'base64'; media_type: string; data: string };
    };

/**
 * Represents a message in a conversation
 * Content can be a string or an array of content blocks for multimodal messages
 */
export interface LlmMessage {
  role: MessageRole;
  content: string | ContentBlock[];
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
