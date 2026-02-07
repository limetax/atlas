import { Injectable, Logger } from '@nestjs/common';
import { LlmMessage } from '@llm/domain/llm-provider.interface';
import { ChatContext } from '@atlas/shared';
import { ToolResolutionService } from './tool-resolution.service';
import { AnthropicProvider } from '@llm/infrastructure/anthropic.provider';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseMessage, HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages';

/**
 * Event emitted when a tool call starts or completes
 */
export type ToolCallEvent = {
  type: 'tool_call';
  name: string;
  status: 'started' | 'completed';
};

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
  ): AsyncGenerator<string | ToolCallEvent, void, unknown> {
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
        const text = extractTextContent(chunk.content);
        if (text) yield text;
      }
      return;
    }

    // Bind tools to model (LangChain feature) - tools already in correct format
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

          const resultText = result.content.map((c) => c.text).join('\n');
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
