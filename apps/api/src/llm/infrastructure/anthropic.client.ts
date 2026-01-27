import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ILlmProvider, LlmMessage } from '@llm/domain/llm-provider.interface';

/**
 * Anthropic Client - Infrastructure implementation for Claude API
 * Implements ILlmProvider interface using Anthropic's SDK
 * Supports MCP (Model Context Protocol) for tool access
 * No try-catch - errors bubble up to application layer
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
   * Stream a chat completion from Claude
   * Errors are thrown and handled by caller
   */
  async *streamMessage(
    messages: LlmMessage[],
    systemPrompt: string
  ): AsyncGenerator<string, void, unknown> {
    const stream = await this.client.messages.stream({
      model: this.MODEL,
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }

  /**
   * Get a single completion (non-streaming)
   */
  async getMessage(messages: LlmMessage[], systemPrompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.MODEL,
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages,
    });

    const textContent = response.content.find((block) => block.type === 'text');

    if (textContent && textContent.type === 'text') {
      return textContent.text;
    }

    return '';
  }
}
