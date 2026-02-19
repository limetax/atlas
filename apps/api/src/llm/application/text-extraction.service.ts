import { Injectable, Logger } from '@nestjs/common';
import { AnthropicProvider } from '@llm/infrastructure/anthropic.provider';

/**
 * Text Extraction Service - Application layer service for document text extraction
 *
 * Delegates to AnthropicProvider for Claude-based text extraction with OCR.
 * This replaces the former ITextExtractor domain contract since text extraction
 * is a capability of the Anthropic model, not a standalone adapter boundary.
 */
@Injectable()
export class TextExtractionService {
  private readonly logger = new Logger(TextExtractionService.name);

  constructor(private readonly anthropicProvider: AnthropicProvider) {}

  /**
   * Extract text from a document file using Claude
   * @param file - The file to extract text from
   * @returns Promise resolving to extracted text content
   * @throws Error if extraction fails
   */
  async extractText(file: Express.Multer.File): Promise<string> {
    this.logger.debug(`Extracting text from ${file.originalname} (${file.mimetype})`);
    return this.anthropicProvider.extractText(file);
  }
}
