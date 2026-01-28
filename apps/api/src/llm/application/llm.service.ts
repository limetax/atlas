import { Injectable, Logger } from '@nestjs/common';
import { LlmMessage } from '@llm/domain/llm-provider.interface';
import { ChatContext } from '@atlas/shared';
import { ToolOrchestrationService } from './tool-orchestration.service';

/**
 * LLM Service - Application layer for language model operations
 * Contains business logic for LLM interactions
 * No try-catch - errors bubble up to calling layer
 *
 * Delegates to ToolOrchestrationService for all requests
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(private readonly toolOrchestration: ToolOrchestrationService) {}

  /**
   * Stream a chat completion with optional context for tool selection
   * Delegates to ToolOrchestrationService for tool-enabled requests
   *
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

    // Delegate to orchestration service which handles both tool-enabled and simple requests
    yield* this.toolOrchestration.streamCompletionWithTools(messages, systemPrompt, context);
  }

  /**
   * Get a single completion with optional context for tool selection
   * Delegates to ToolOrchestrationService for tool-enabled requests
   *
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

    // Delegate to orchestration service which handles both tool-enabled and simple requests
    return await this.toolOrchestration.getCompletionWithTools(messages, systemPrompt, context);
  }
}
