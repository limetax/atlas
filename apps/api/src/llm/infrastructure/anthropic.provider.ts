import { Injectable } from '@nestjs/common';
import { ChatAnthropic } from '@langchain/anthropic';

/**
 * Anthropic Provider - Infrastructure layer
 * Creates and configures ChatAnthropic instances
 * This is where vendor-specific configuration lives
 */
@Injectable()
export class AnthropicProvider {
  createModel(): ChatAnthropic {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    return new ChatAnthropic({
      apiKey,
      model: 'claude-sonnet-4-20250514',
      temperature: 0.3,
      maxTokens: 4096,
    });
  }
}
