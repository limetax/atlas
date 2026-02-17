/**
 * Text extraction service interface (Domain layer)
 * Abstracts the implementation details of text extraction from documents
 */
export interface ITextExtractor {
  /**
   * Extract text from a document file
   * @param file - The file to extract text from
   * @returns Promise resolving to extracted text content
   * @throws Error if extraction fails
   */
  extractText(file: Express.Multer.File): Promise<string>;
}

/**
 * Injection token for text extractor service
 */
export const ITextExtractor = Symbol('ITextExtractor');
