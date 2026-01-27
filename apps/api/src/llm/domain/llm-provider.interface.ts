import { ChatContext } from '@atlas/shared';

/**
 * Domain interfaces for LLM operations
 */
export interface LlmMessage {
  role: 'user' | 'assistant';
  content: string;
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
   * Stream a chat completion from the LLM
   * @param messages - Array of messages in the conversation
   * @param systemPrompt - System prompt to guide the model
   * @param context - Optional chat context for tool selection and filtering
   * @returns AsyncGenerator yielding text chunks
   */
  abstract streamMessage(
    messages: LlmMessage[],
    systemPrompt: string,
    context?: ChatContext
  ): AsyncGenerator<string, void, unknown>;

  /**
   * Get a single completion (non-streaming)
   * @param messages - Array of messages in the conversation
   * @param systemPrompt - System prompt to guide the model
   * @param context - Optional chat context for tool selection and filtering
   * @returns Complete response text
   */
  abstract getMessage(
    messages: LlmMessage[],
    systemPrompt: string,
    context?: ChatContext
  ): Promise<string>;
}
