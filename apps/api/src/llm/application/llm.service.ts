import { Injectable, Logger } from '@nestjs/common';
import { ILlmProvider } from '@llm/domain/llm-provider.interface';

/**
 * LLM Service - Application layer for language model operations
 * Contains business logic for LLM interactions
 * Depends on ILlmProvider interface, not concrete implementations
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly llmProvider: ILlmProvider) {}

  /**
   * Stream a chat completion with business logic wrapper
   * @param messages - Array of messages in the conversation
   * @param systemPrompt - System prompt to guide the model
   * @returns AsyncGenerator yielding text chunks
   */
  async *streamCompletion(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt: string
  ): AsyncGenerator<string, void, unknown> {
    this.logger.debug(`Streaming completion for ${messages.length} messages`);

    try {
      yield* this.llmProvider.streamMessage(messages, systemPrompt);
    } catch (error) {
      this.logger.error('LLM streaming failed:', error);
      throw error;
    }
  }

  /**
   * Get a single completion with business logic wrapper
   * @param messages - Array of messages in the conversation
   * @param systemPrompt - System prompt to guide the model
   * @returns Complete response text
   */
  async getCompletion(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt: string
  ): Promise<string> {
    this.logger.debug(`Getting completion for ${messages.length} messages`);

    try {
      return await this.llmProvider.getMessage(messages, systemPrompt);
    } catch (error) {
      this.logger.error('LLM completion failed:', error);
      throw error;
    }
  }
}
