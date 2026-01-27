import { ChatContext } from '@atlas/shared';
import { Tool, ToolCall } from './tool.types';

/**
 * Domain interfaces for LLM operations
 */
export interface LlmMessage {
  role: 'user' | 'assistant';
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

/**
 * LLM Provider - Domain contract for language model providers
 *
 * Abstract class (not interface) so it can be used as injection token
 * This defines what we expect from any LLM provider,
 * regardless of the underlying implementation (Anthropic, OpenAI, Langdock, etc.)
 */
export abstract class ILlmProvider {
  /**
   * Stream a chat completion from the LLM (legacy method for backward compatibility)
   * @param messages - Array of messages in the conversation
   * @param systemPrompt - System prompt to guide the model
   * @param context - Optional chat context for tool selection and filtering
   * @returns AsyncGenerator yielding text chunks
   * @deprecated Use streamWithTools for tool-aware streaming
   */
  abstract streamMessage(
    messages: LlmMessage[],
    systemPrompt: string,
    context?: ChatContext
  ): AsyncGenerator<string, void, unknown>;

  /**
   * Get a single completion (non-streaming, legacy method for backward compatibility)
   * @param messages - Array of messages in the conversation
   * @param systemPrompt - System prompt to guide the model
   * @param context - Optional chat context for tool selection and filtering
   * @returns Complete response text
   * @deprecated Use getResponseWithTools for tool-aware responses
   */
  abstract getMessage(
    messages: LlmMessage[],
    systemPrompt: string,
    context?: ChatContext
  ): Promise<string>;

  /**
   * Stream a chat completion with tool support
   * Returns both text chunks and signals about tool calls
   *
   * @param messages - Array of messages in the conversation
   * @param systemPrompt - System prompt to guide the model
   * @param tools - Available tools the LLM can call
   * @returns AsyncGenerator yielding text chunks and done signals
   */
  abstract streamWithTools(
    messages: LlmMessage[],
    systemPrompt: string,
    tools: Tool[]
  ): AsyncGenerator<LlmStreamChunk, void, unknown>;

  /**
   * Get a complete response with tool support
   * Returns full response including any tool calls
   *
   * @param messages - Array of messages in the conversation
   * @param systemPrompt - System prompt to guide the model
   * @param tools - Available tools the LLM can call
   * @returns Promise resolving to complete response with text and tool calls
   */
  abstract getResponseWithTools(
    messages: LlmMessage[],
    systemPrompt: string,
    tools: Tool[]
  ): Promise<LlmResponse>;
}
