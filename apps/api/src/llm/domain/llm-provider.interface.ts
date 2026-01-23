/**
 * LLM Provider - Domain contract for language model providers
 *
 * Abstract class (not interface) so it can be used as injection token
 * This defines what we expect from any LLM provider,
 * regardless of the underlying implementation (Anthropic, OpenAI, etc.)
 */
export abstract class ILlmProvider {
  /**
   * Stream a chat completion from the LLM
   * @param messages - Array of messages in the conversation
   * @param systemPrompt - System prompt to guide the model
   * @returns AsyncGenerator yielding text chunks
   */
  abstract streamMessage(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt: string
  ): AsyncGenerator<string, void, unknown>;

  /**
   * Get a single completion (non-streaming)
   * @param messages - Array of messages in the conversation
   * @param systemPrompt - System prompt to guide the model
   * @returns Complete response text
   */
  abstract getMessage(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt: string
  ): Promise<string>;
}
