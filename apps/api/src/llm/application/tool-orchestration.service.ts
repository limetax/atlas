import { Injectable, Logger } from '@nestjs/common';
import { ILlmProvider, LlmMessage, LlmResponse } from '@llm/domain/llm-provider.interface';
import { ChatContext } from '@atlas/shared';
import { Tool, ToolCall } from '@llm/domain/tool.types';
import { ToolResolutionService } from './tool-resolution.service';

/**
 * Maximum number of tool calling rounds to prevent infinite loops
 */
const MAX_TOOL_ROUNDS = 5;

/**
 * Tool Orchestration Service - Application layer service for coordinating multi-turn tool calling
 *
 * This service extracts the multi-turn tool calling logic that was previously
 * duplicated in infrastructure providers. It coordinates between the LLM provider
 * and tool providers to enable iterative tool calling.
 *
 * Flow:
 * 1. Resolve tools based on context
 * 2. Send request to LLM with available tools
 * 3. Stream text chunks from LLM
 * 4. If LLM requests tools, execute them
 * 5. Add tool results to conversation
 * 6. Repeat until LLM finishes or max rounds reached
 *
 * This logic is provider-agnostic and can work with any ILlmProvider implementation.
 */
@Injectable()
export class ToolOrchestrationService {
  private readonly logger = new Logger(ToolOrchestrationService.name);

  constructor(
    private readonly llmProvider: ILlmProvider,
    private readonly toolResolution: ToolResolutionService
  ) {}

  /**
   * Stream a completion with automatic multi-turn tool calling
   *
   * @param messages - Initial conversation messages
   * @param systemPrompt - System prompt for the LLM
   * @param context - Optional chat context for tool resolution
   * @returns AsyncGenerator yielding text chunks
   */
  async *streamCompletionWithTools(
    messages: LlmMessage[],
    systemPrompt: string,
    context?: ChatContext
  ): AsyncGenerator<string, void, unknown> {
    // Resolve which tools should be available based on context
    const tools = await this.toolResolution.resolveTools(context);

    if (tools.length === 0) {
      // No tools needed, use legacy streaming
      this.logger.debug('No tools resolved, using standard streaming');
      yield* this.llmProvider.streamMessage(messages, systemPrompt, context);
      return;
    }

    this.logger.debug(`Starting tool-enabled streaming with ${tools.length} tools`);

    // Track conversation state across rounds
    const conversationMessages: LlmMessage[] = [...messages];
    let currentRound = 0;

    while (currentRound < MAX_TOOL_ROUNDS) {
      currentRound++;
      this.logger.debug(`Tool calling round ${currentRound}/${MAX_TOOL_ROUNDS}`);

      // Stream the LLM response and capture the complete response
      // This is thread-safe: each request gets its own generator with no shared state
      let response: LlmResponse | null = null;

      for await (const chunk of this.llmProvider.streamWithTools(
        conversationMessages,
        systemPrompt,
        tools
      )) {
        if (chunk.type === 'text') {
          // Stream text to user
          yield chunk.content;
        } else if (chunk.type === 'done') {
          // Capture complete response with tool calls (no shared state, thread-safe)
          response = chunk.response;
        }
      }

      if (!response) {
        this.logger.warn('No response returned from stream');
        break;
      }

      // If no tool calls, we're done
      if (response.stopReason !== 'tool_use' || response.toolCalls.length === 0) {
        this.logger.debug(`Conversation completed: ${response.stopReason}`);
        break;
      }

      this.logger.debug(
        `Executing ${response.toolCalls.length} tool calls in round ${currentRound}`
      );

      // Execute all tool calls in parallel for better performance
      const toolExecutionPromises = response.toolCalls.map(async (toolCall) => {
        this.logger.debug(`Executing tool: ${toolCall.name}`, {
          input: toolCall.input,
        });

        // Get the provider for this tool
        const toolProvider = this.toolResolution.getProviderForTool(toolCall.name);

        // Execute the tool
        const result = await toolProvider.executeTool(toolCall);

        if (result.isError) {
          this.logger.warn(`Tool ${toolCall.name} returned error`, {
            content: result.content.map((c) => c.text).join('\n'),
          });
        }

        return result;
      });

      const toolResults = await Promise.all(toolExecutionPromises);

      // Add assistant message with text response to conversation
      // Only add if there's actual text content (Anthropic requires non-empty content)
      if (response.text && response.text.trim().length > 0) {
        const assistantMessage: LlmMessage = {
          role: 'assistant',
          content: response.text,
        };
        conversationMessages.push(assistantMessage);
      }

      // Add tool results as user message
      const toolResultText = toolResults
        .map((result) => result.content.map((c) => c.text).join('\n'))
        .join('\n\n');

      const toolResultMessage: LlmMessage = {
        role: 'user',
        content: toolResultText,
      };
      conversationMessages.push(toolResultMessage);

      // Add visual separator for next round
      yield '\n\n';

      // Continue loop - LLM will process tool results in next round
    }

    if (currentRound >= MAX_TOOL_ROUNDS) {
      this.logger.warn(`Reached maximum tool rounds (${MAX_TOOL_ROUNDS})`);
    }
  }

  /**
   * Get a single completion with automatic multi-turn tool calling (non-streaming)
   *
   * @param messages - Initial conversation messages
   * @param systemPrompt - System prompt for the LLM
   * @param context - Optional chat context for tool resolution
   * @returns Promise resolving to complete response text
   */
  async getCompletionWithTools(
    messages: LlmMessage[],
    systemPrompt: string,
    context?: ChatContext
  ): Promise<string> {
    // Collect all chunks from streaming
    const chunks: string[] = [];
    for await (const chunk of this.streamCompletionWithTools(messages, systemPrompt, context)) {
      chunks.push(chunk);
    }
    return chunks.join('');
  }
}
