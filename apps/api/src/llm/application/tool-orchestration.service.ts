import { Injectable, Logger } from '@nestjs/common';
import { LlmMessage } from '@llm/domain/llm-provider.interface';
import { ChatContext } from '@atlas/shared';
import { ToolResolutionService } from './tool-resolution.service';
import { LlmProviderAdapter } from '@llm/domain/llm-provider.adapter';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { BaseMessage, HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages';

/**
 * Event emitted when a tool call starts or completes
 */
export type ToolCallEvent = {
  type: 'tool_call';
  name: string;
  status: 'started' | 'completed';
};

/**
 * Maximum tool-calling iterations before forcing a final response.
 * Limit to 3 iterations: typically search (1) → fetch details (2) → synthesize (3).
 * Prevents runaway loops while allowing reasonable multi-step operations.
 * Based on debug session showing 5 iterations caused 87s hangs with redundant tool calls.
 */
const MAX_TOOL_ITERATIONS = 3;

/**
 * Extract text from LangChain message content.
 * Content can be a string or an array of content blocks (text, tool_use, etc.)
 */
function extractTextContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
    .map((block) => block.text)
    .join('');
}

/**
 * Tool Orchestration Service - Application layer for multi-turn tool calling
 * Uses LangChain BaseChatModel (provider-agnostic), bindTools(), and LangChain message types
 */
@Injectable()
export class ToolOrchestrationService {
  private readonly logger = new Logger(ToolOrchestrationService.name);
  private readonly model: BaseChatModel;

  constructor(
    private readonly llmProvider: LlmProviderAdapter,
    private readonly toolResolution: ToolResolutionService
  ) {
    this.model = this.llmProvider.createModel();
  }

  async *streamCompletionWithTools(
    messages: LlmMessage[],
    systemPrompt: string,
    context?: ChatContext
  ): AsyncGenerator<string | ToolCallEvent, void, unknown> {
    const tools = await this.toolResolution.resolveTools(context);

    const allMessages = [
      new HumanMessage(systemPrompt),
      ...messages.map((m) => {
        if (m.role === 'user') {
          // HumanMessage accepts both string and ContentBlock[]
          return new HumanMessage(m.content);
        }
        // AIMessage only accepts string (assistant doesn't send content blocks)
        return new AIMessage(
          typeof m.content === 'string' ? m.content : extractTextContent(m.content)
        );
      }),
    ];

    // No tools = simple streaming
    if (!tools.length) {
      const stream = await this.model.stream(allMessages);
      for await (const chunk of stream) {
        const text = extractTextContent(chunk.content);
        if (text) yield text;
      }
      return;
    }

    // Bind tools to model (LangChain feature) - tools already in correct format
    if (!this.model.bindTools) {
      throw new Error('LLM provider does not support tool binding');
    }
    const modelWithTools = this.model.bindTools(tools);

    // Tool calling loop with LangChain BaseMessage
    const conversation: BaseMessage[] = [...allMessages];

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      if (i === MAX_TOOL_ITERATIONS - 1) {
        this.logger.warn(`Entering final tool iteration (${i}/${MAX_TOOL_ITERATIONS})`);
      }

      const response = await modelWithTools.invoke(conversation);
      const content = extractTextContent(response.content);

      // No tool calls? This is the final answer — yield text and break
      if (!response.tool_calls?.length) {
        if (content && content.trim()) yield content;
        break;
      }

      // Intermediate iteration: suppress "thinking" text (e.g. "Ich suche für Sie...")
      // Frontend uses hardcoded tool labels instead

      // Add AI response to conversation
      if (content.trim() || response.tool_calls.length > 0) {
        conversation.push(response);
      }

      // Yield all tool 'started' events immediately so frontend shows loading spinners
      for (const call of response.tool_calls) {
        yield { type: 'tool_call' as const, name: call.name, status: 'started' as const };
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

          const resultText = result.content
            .filter(
              (c): c is { type: 'text'; text: string } => 'text' in c && typeof c.text === 'string'
            )
            .map((c) => c.text)
            .join('\n');
          conversation.push(
            new ToolMessage({
              content: resultText,
              tool_call_id: call.id || `tool_${Date.now()}`,
            })
          );
        } catch (error) {
          this.logger.error(
            `Tool ${call.name} failed`,
            error instanceof Error ? error.stack : String(error)
          );
          conversation.push(
            new ToolMessage({
              content: `Fehler: ${error instanceof Error ? error.message : String(error)}`,
              tool_call_id: call.id || `tool_${Date.now()}`,
            })
          );
        }

        yield { type: 'tool_call' as const, name: call.name, status: 'completed' as const };
      }
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
    // Collect text chunks from streaming (filter out tool call events)
    const chunks: string[] = [];
    for await (const chunk of this.streamCompletionWithTools(messages, systemPrompt, context)) {
      if (typeof chunk === 'string') {
        chunks.push(chunk);
      }
    }
    return chunks.join('');
  }
}
