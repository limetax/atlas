import { Injectable, Logger } from '@nestjs/common';
import { LlmProviderAdapter } from '@llm/domain/llm-provider.adapter';

/**
 * Text Extraction Service - Application layer service for document text extraction
 *
 * Delegates to the LlmProviderAdapter for model-based text extraction with OCR.
 * The concrete implementation (Anthropic, OpenAI, etc.) is resolved via DI.
 */
@Injectable()
export class TextExtractionService {
  private readonly logger = new Logger(TextExtractionService.name);

  constructor(private readonly llmProvider: LlmProviderAdapter) {}

  async extractText(file: Express.Multer.File): Promise<string> {
    this.logger.debug(`Extracting text from ${file.originalname} (${file.mimetype})`);
    return this.llmProvider.extractText(file);
  }
}
