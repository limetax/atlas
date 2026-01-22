import { LLMMessage } from "@/types";
import { getAnthropicClient } from "@/lib/infrastructure/anthropic.client";

/**
 * LLM Adapter Interface
 *
 * This abstraction allows us to easily swap LLM providers
 * (e.g., switch from Anthropic to OpenAI, or use multiple providers)
 */
export interface ILLMAdapter {
  /**
   * Stream a chat completion
   * @param messages - Conversation history
   * @param systemPrompt - System instructions
   * @returns AsyncGenerator yielding text chunks
   */
  streamChat(
    messages: LLMMessage[],
    systemPrompt: string
  ): AsyncGenerator<string, void, unknown>;

  /**
   * Get a single completion (non-streaming)
   * @param messages - Conversation history
   * @param systemPrompt - System instructions
   * @returns Complete response text
   */
  getCompletion(messages: LLMMessage[], systemPrompt: string): Promise<string>;
}

/**
 * Anthropic Claude Adapter
 * Implements the LLM adapter interface using Claude
 */
export class AnthropicAdapter implements ILLMAdapter {
  async *streamChat(
    messages: LLMMessage[],
    systemPrompt: string
  ): AsyncGenerator<string, void, unknown> {
    const client = getAnthropicClient();

    // Filter out system messages and convert to Anthropic format
    const anthropicMessages = messages
      .filter((msg) => msg.role !== "system")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    // Stream from Anthropic
    yield* client.streamMessage(anthropicMessages, systemPrompt);
  }

  async getCompletion(
    messages: LLMMessage[],
    systemPrompt: string
  ): Promise<string> {
    const client = getAnthropicClient();

    // Filter out system messages and convert to Anthropic format
    const anthropicMessages = messages
      .filter((msg) => msg.role !== "system")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    return await client.getMessage(anthropicMessages, systemPrompt);
  }
}

/**
 * Factory function to get the LLM adapter
 * In the future, this could select different adapters based on config
 */
export function getLLMAdapter(): ILLMAdapter {
  // For now, we only support Anthropic
  // In the future, you could add:
  // - OpenAIAdapter
  // - LocalLLMAdapter (e.g., Ollama)
  // - AzureOpenAIAdapter
  // etc.

  return new AnthropicAdapter();
}

/**
 * Example: OpenAI Adapter (not implemented, just showing the pattern)
 *
 * export class OpenAIAdapter implements ILLMAdapter {
 *   async *streamChat(messages: LLMMessage[], systemPrompt: string) {
 *     // Implementation using OpenAI SDK
 *   }
 *
 *   async getCompletion(messages: LLMMessage[], systemPrompt: string) {
 *     // Implementation using OpenAI SDK
 *   }
 * }
 */
