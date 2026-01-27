import { Injectable, Logger } from '@nestjs/common';
import { ILlmProvider, LlmMessage } from '@llm/domain/llm-provider.interface';

/**
 * LLM Service - Application layer for language model operations
 * Contains business logic for LLM interactions
 * Depends on ILlmProvider interface, not concrete implementations
 * No try-catch - errors bubble up to calling layer
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly llmProvider: ILlmProvider) {}

  /**
   * Stream a chat completion
   * @param messages - Array of messages in the conversation
   * @param systemPrompt - System prompt to guide the model
   * @returns AsyncGenerator yielding text chunks
   */
  async *streamCompletion(
    messages: LlmMessage[],
    systemPrompt: string
  ): AsyncGenerator<string, void, unknown> {
    this.logger.debug(`Streaming completion for ${messages.length} messages`);

    yield* this.llmProvider.streamMessage(messages, systemPrompt);
  }

  /**
   * Get a single completion
   * @param messages - Array of messages in the conversation
   * @param systemPrompt - System prompt to guide the model
   * @returns Complete response text
   */
  async getCompletion(messages: LlmMessage[], systemPrompt: string): Promise<string> {
    this.logger.debug(`Getting completion for ${messages.length} messages`);

    return await this.llmProvider.getMessage(messages, systemPrompt);
  }
}
