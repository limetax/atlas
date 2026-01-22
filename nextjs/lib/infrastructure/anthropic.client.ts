import Anthropic from "@anthropic-ai/sdk";

/**
 * Anthropic Client - Infrastructure layer for Claude API
 * Handles direct communication with Anthropic's API
 */
export class AnthropicClient {
  private client: Anthropic;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Anthropic API key is required");
    }

    this.client = new Anthropic({
      apiKey,
    });
  }

  /**
   * Stream a chat completion from Claude
   * @param messages - Array of messages in the conversation
   * @param systemPrompt - System prompt to guide the model
   * @returns AsyncGenerator yielding text chunks
   */
  async *streamMessage(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    systemPrompt: string
  ): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await this.client.messages.stream({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        temperature: 0.7,
        system: systemPrompt,
        messages,
      });

      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          yield chunk.delta.text;
        }
      }
    } catch (error) {
      console.error("Anthropic streaming error:", error);
      throw new Error("Failed to stream message from Claude");
    }
  }

  /**
   * Get a single completion (non-streaming)
   * Useful for embeddings or quick responses
   */
  async getMessage(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    systemPrompt: string
  ): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        temperature: 0.7,
        system: systemPrompt,
        messages,
      });

      const textContent = response.content.find(
        (block) => block.type === "text"
      );
      return textContent && textContent.type === "text" ? textContent.text : "";
    } catch (error) {
      console.error("Anthropic error:", error);
      throw new Error("Failed to get message from Claude");
    }
  }
}

// Singleton instance
let anthropicClientInstance: AnthropicClient | null = null;

export function getAnthropicClient(): AnthropicClient {
  if (!anthropicClientInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }
    anthropicClientInstance = new AnthropicClient(apiKey);
  }
  return anthropicClientInstance;
}
