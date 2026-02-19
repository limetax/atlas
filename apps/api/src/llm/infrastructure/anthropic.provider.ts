import { Injectable, Logger } from '@nestjs/common';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage } from '@langchain/core/messages';
/**
 * Anthropic Provider - Infrastructure layer
 * Creates and configures ChatAnthropic instances
 * Provides document text extraction via Claude API
 * This is where vendor-specific configuration lives
 */
@Injectable()
export class AnthropicProvider {
  private readonly logger = new Logger(AnthropicProvider.name);

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

    // Extract text from response
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
