import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import {
  ILlmProvider,
  LlmMessage,
  LlmStreamChunk,
  LlmResponse,
} from '@llm/domain/llm-provider.interface';
import { ChatContext } from '@atlas/shared';
import { Tool, ToolCall } from '@llm/domain/tool.types';

/**
 * Anthropic Client - Infrastructure implementation for Claude API
 * Implements ILlmProvider interface using Anthropic's SDK
 *
 * This is a pure infrastructure adapter that:
 * - Handles Anthropic-specific API calls
 * - Converts between domain types and Anthropic types
 * - Streams responses and detects tool calls
 * - Does NOT contain business logic or orchestration
 *
 * Multi-turn tool calling is handled by ToolOrchestrationService (application layer)
 * Tool resolution is handled by ToolResolutionService (application layer)
 */
@Injectable()
export class AnthropicClient implements ILlmProvider, OnModuleInit {
  private readonly logger = new Logger(AnthropicClient.name);
  private client!: Anthropic;
  private readonly MODEL = 'claude-sonnet-4-20250514';

  onModuleInit(): void {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY environment variable');
    }

    this.client = new Anthropic({ apiKey });
    this.logger.log('✅ Anthropic client initialized');
  }

  /**
   * Stream a chat completion (legacy method for backward compatibility)
   * @deprecated Use streamWithTools via ToolOrchestrationService
   */
  async *streamMessage(
    messages: LlmMessage[],
    systemPrompt: string,
    _context?: ChatContext
  ): AsyncGenerator<string, void, unknown> {
    // Simple streaming without tools (backward compatibility)
    const anthropicMessages = this.convertToAnthropicMessages(messages);

    const stream = await this.client.messages.stream({
      model: this.MODEL,
      max_tokens: 4096,
      temperature: 0.3,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }

  /**
   * Get a single completion (legacy method for backward compatibility)
   * @deprecated Use getResponseWithTools via ToolOrchestrationService
   */
  async getMessage(
    messages: LlmMessage[],
    systemPrompt: string,
    _context?: ChatContext
  ): Promise<string> {
    const anthropicMessages = this.convertToAnthropicMessages(messages);

    const response = await this.client.messages.create({
      model: this.MODEL,
      max_tokens: 4096,
      temperature: 0.3,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    const textContent = response.content.find((block) => block.type === 'text');

    if (textContent && textContent.type === 'text') {
      return textContent.text;
    }

    return '';
  }

  /**
   * Stream a chat completion with tool support (new method)
   * Yields text chunks, then a done signal with the complete response
   * The complete response includes tool calls for multi-turn coordination
   *
   * Note: This is stateless and thread-safe - no shared state across requests
   */
  async *streamWithTools(
    messages: LlmMessage[],
    systemPrompt: string,
    tools: Tool[]
  ): AsyncGenerator<LlmStreamChunk, void, unknown> {
    const anthropicMessages = this.convertToAnthropicMessages(messages);
    const anthropicTools = this.convertToAnthropicTools(tools);

    const stream = await this.client.messages.stream({
      model: this.MODEL,
      max_tokens: 4096,
      temperature: 0.3,
      system: systemPrompt,
      messages: anthropicMessages,
      tools: anthropicTools,
    });

    // Stream text chunks
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield { type: 'text', content: chunk.delta.text };
      }
    }

    // Get the final message with tool calls
    const message = await stream.finalMessage();

    // Extract text content
    const textBlocks = message.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );
    const text = textBlocks.map((block) => block.text).join('\n');

    // Extract tool calls
    const toolUseBlocks = message.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    const toolCalls: ToolCall[] = toolUseBlocks.map((block) => ({
      id: block.id,
      name: block.name,
      input: block.input,
    }));

    this.logger.debug(`Stream completed with ${toolCalls.length} tool calls`);

    // Build complete response
    const response: LlmResponse = {
      text,
      toolCalls,
      stopReason: this.convertStopReason(message.stop_reason),
      metadata: message,
    };

    // Yield done signal WITH the complete response (including tool calls)
    // This ensures no shared state and thread-safety
    yield { type: 'done', response };
  }

  /**
   * Get a complete response with tool support (new method)
   * Returns full response including text and any tool calls
   * Makes a single non-streaming API call
   *
   * Note: This is stateless and thread-safe - use this for non-streaming scenarios
   */
  async getResponseWithTools(
    messages: LlmMessage[],
    systemPrompt: string,
    tools: Tool[]
  ): Promise<LlmResponse> {
    const anthropicMessages = this.convertToAnthropicMessages(messages);
    const anthropicTools = this.convertToAnthropicTools(tools);

    const response = await this.client.messages.create({
      model: this.MODEL,
      max_tokens: 4096,
      temperature: 0.3,
      system: systemPrompt,
      messages: anthropicMessages,
      tools: anthropicTools,
    });

    // Extract text content
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );
    const text = textBlocks.map((block) => block.text).join('\n');

    // Extract tool calls
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    const toolCalls: ToolCall[] = toolUseBlocks.map((block) => ({
      id: block.id,
      name: block.name,
      input: block.input,
    }));

    this.logger.debug(`Extracted ${toolCalls.length} tool calls from response`);

    return {
      text,
      toolCalls,
      stopReason: this.convertStopReason(response.stop_reason),
      metadata: response,
    };
  }

  /**
   * Convert domain messages to Anthropic message format
   */
  private convertToAnthropicMessages(messages: LlmMessage[]): Anthropic.MessageParam[] {
    return messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
  }

  /**
   * Convert domain tools to Anthropic tool format
   */
  private convertToAnthropicTools(tools: Tool[]): Anthropic.Tool[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));
  }

  /**
   * Convert Anthropic stop reason to domain stop reason
   */
  private convertStopReason(reason: string | null): 'stop' | 'tool_use' | 'max_tokens' {
    if (reason === 'tool_use') return 'tool_use';
    if (reason === 'max_tokens') return 'max_tokens';
    return 'stop';
  }
}
