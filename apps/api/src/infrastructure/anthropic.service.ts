import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Anthropic Service - Infrastructure layer for Claude API
 * Handles direct communication with Anthropic's API
 */
@Injectable()
export class AnthropicService implements OnModuleInit {
  private readonly logger = new Logger(AnthropicService.name);
  private client!: Anthropic;

  onModuleInit() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY environment variable');
    }

    this.client = new Anthropic({ apiKey });
    this.logger.log('✅ Anthropic client initialized');
  }

  /**
   * Stream a chat completion from Claude
   * @param messages - Array of messages in the conversation
   * @param systemPrompt - System prompt to guide the model
   * @returns AsyncGenerator yielding text chunks
   */
  async *streamMessage(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt: string
  ): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await this.client.messages.stream({
        model: 'claude-sonnet-4-20250514',
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
    } catch (error) {
      this.logger.error('Anthropic streaming error:', error);
      throw new Error('Failed to stream message from Claude');
    }
  }

  /**
   * Get a single completion (non-streaming)
   * Useful for embeddings or quick responses
   */
  async getMessage(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt: string
  ): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        temperature: 0.7,
        system: systemPrompt,
        messages,
      });

      const textContent = response.content.find((block) => block.type === 'text');
      return textContent && textContent.type === 'text' ? textContent.text : '';
    } catch (error) {
      this.logger.error('Anthropic error:', error);
      throw new Error('Failed to get message from Claude');
    }
  }
}
