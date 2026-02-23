import { ChatAnthropic } from '@langchain/anthropic';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage } from '@langchain/core/messages';
import { LlmProviderAdapter } from '@llm/domain/llm-provider.adapter';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Anthropic LLM Adapter - Infrastructure implementation of LlmProviderAdapter
 *
 * Encapsulates all Anthropic-specific configuration and API usage.
 * To switch to a different provider (OpenAI, Bedrock, etc.), implement
 * LlmProviderAdapter with the new vendor's LangChain class — no application
 * layer changes required.
 */
@Injectable()
export class AnthropicLlmAdapter extends LlmProviderAdapter {
  private readonly logger = new Logger(AnthropicLlmAdapter.name);

  createModel(): BaseChatModel {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    return new ChatAnthropic({
      apiKey,
      model: 'claude-sonnet-4-5-20250929',
      temperature: 0.3,
      maxTokens: 16000,
    });
  }

  async extractText(file: Express.Multer.File): Promise<string> {
    const base64Data = Buffer.from(file.buffer).toString('base64');
    const model = this.createModel();

    this.logger.debug(`Extracting text from ${file.originalname} (${file.mimetype})`);

    const response = await model.invoke([
      new HumanMessage({
        content: [
          {
            type: file.mimetype.startsWith('image/') ? 'image' : 'document',
            source: {
              type: 'base64',
              media_type: file.mimetype,
              data: base64Data,
            },
          },
          {
            type: 'text',
            text: 'Extract all text from this document. Return only the raw text content without any analysis, summary, or commentary. Preserve the original formatting and structure as much as possible.',
          },
        ],
      }),
    ]);

    const extractedText =
      typeof response.content === 'string'
        ? response.content
        : response.content
            .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
            .map((block) => block.text)
            .join('\n');

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the document');
    }

    this.logger.debug(
      `Successfully extracted ${extractedText.length} characters from ${file.originalname}`
    );

    return extractedText;
  }
}
