import { Injectable, Logger } from '@nestjs/common';
import { LlmMessage } from '@llm/domain/llm-provider.interface';
import { ChatContext } from '@atlas/shared';
import { ToolResolutionService } from './tool-resolution.service';
import { AnthropicProvider } from '@llm/infrastructure/anthropic.provider';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseMessage, HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages';

/**
 * Tool Orchestration Service - LangChain-based implementation
 * Uses ChatAnthropic, bindTools(), and LangChain message types
 */
@Injectable()
export class ToolOrchestrationService {
  private readonly logger = new Logger(ToolOrchestrationService.name);
  private readonly model: ChatAnthropic;

  constructor(
    private readonly anthropicProvider: AnthropicProvider,
    private readonly toolResolution: ToolResolutionService
  ) {
    this.model = this.anthropicProvider.createModel();
  }

  async *streamCompletionWithTools(
    messages: LlmMessage[],
    systemPrompt: string,
    context?: ChatContext
  ): AsyncGenerator<string, void, unknown> {
    const tools = await this.toolResolution.resolveTools(context);

    const allMessages = [
      new HumanMessage(systemPrompt),
      ...messages.map((m) =>
        m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
      ),
    ];

    // No tools = simple streaming
    if (!tools.length) {
      const stream = await this.model.stream(allMessages);
      for await (const chunk of stream) {
        if (typeof chunk.content === 'string') yield chunk.content;
      }
      return;
    }

    // Bind tools to model (LangChain feature) - tools already in correct format
    const modelWithTools = this.model.bindTools(tools);

    // Tool calling loop with LangChain BaseMessage
    const conversation: BaseMessage[] = [...allMessages];

    for (let i = 0; i < 5; i++) {
      const response = await modelWithTools.invoke(conversation);

      // Yield text content
      const content = typeof response.content === 'string' ? response.content : '';
      if (content && content.trim()) yield content;

      // No tool calls? Done
      if (!response.tool_calls?.length) break;

      // Add AI response to conversation
      if (content.trim() || response.tool_calls.length > 0) {
        conversation.push(response);
      }

      // Execute tools via domain providers
      for (const call of response.tool_calls) {
        try {
          const provider = this.toolResolution.getProviderForTool(call.name);
          const result = await provider.executeTool({
            id: call.id || `tool_${Date.now()}`,
            name: call.name,
            input: call.args,
          });

          conversation.push(
            new ToolMessage({
              content: result.content.map((c) => c.text).join('\n'),
              tool_call_id: call.id || `tool_${Date.now()}`,
            })
          );
        } catch (error) {
          this.logger.error(`Tool ${call.name} failed:`, error);
          conversation.push(
            new ToolMessage({
              content: `Fehler: ${error instanceof Error ? error.message : String(error)}`,
              tool_call_id: call.id || `tool_${Date.now()}`,
            })
          );
        }
      }

      yield '\n\n';
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
