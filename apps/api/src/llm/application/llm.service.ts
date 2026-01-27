import { Injectable, Logger } from '@nestjs/common';
import { ILlmProvider, LlmMessage } from '@llm/domain/llm-provider.interface';
import { ChatContext } from '@atlas/shared';

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
   * Stream a chat completion with optional context for tool selection
   * @param messages - Array of messages in the conversation
   * @param systemPrompt - System prompt to guide the model
   * @param context - Optional chat context for tool access (e.g., research sources)
   * @returns AsyncGenerator yielding text chunks
   */
  async *streamCompletion(
    messages: LlmMessage[],
    systemPrompt: string,
    context?: ChatContext
  ): AsyncGenerator<string, void, unknown> {
    this.logger.debug(`Streaming completion for ${messages.length} messages`, {
      context: context
        ? {
            research: context.research,
            integration: context.integration,
            hasMandant: !!context.mandant,
          }
        : undefined,
    });

    yield* this.llmProvider.streamMessage(messages, systemPrompt, context);
  }

  /**
   * Get a single completion with optional context for tool selection
   * @param messages - Array of messages in the conversation
   * @param systemPrompt - System prompt to guide the model
   * @param context - Optional chat context for tool access (e.g., research sources)
   * @returns Complete response text
   */
  async getCompletion(
    messages: LlmMessage[],
    systemPrompt: string,
    context?: ChatContext
  ): Promise<string> {
    this.logger.debug(`Getting completion for ${messages.length} messages`, {
      context: context
        ? {
            research: context.research,
            integration: context.integration,
            hasMandant: !!context.mandant,
          }
        : undefined,
    });

    return await this.llmProvider.getMessage(messages, systemPrompt, context);
  }
}
