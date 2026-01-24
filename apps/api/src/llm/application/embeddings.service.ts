import { Injectable, Logger } from '@nestjs/common';
import { IEmbeddingsProvider } from '@llm/domain/embeddings-provider.interface';

/**
 * Embeddings Service - Application layer for embedding operations
 * Contains business logic for embedding generation
 * Depends on IEmbeddingsProvider interface, not concrete implementations
 */
@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);

  constructor(private readonly embeddingsProvider: IEmbeddingsProvider) {}

  /**
   * Generate embedding vector for a text string with business logic
   * @param text - The text to embed
   * @returns Array of floats representing the embedding
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      this.logger.warn('Attempted to generate embedding for empty text');
      throw new Error('Cannot generate embedding for empty text');
    }

    this.logger.debug(`Generating embedding for text (${text.length} chars)`);

    try {
      return await this.embeddingsProvider.generateEmbedding(text);
    } catch (error) {
      this.logger.error('Embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   * @param texts - Array of texts to embed
   * @returns Array of embedding vectors
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) {
      this.logger.warn('Attempted to generate embeddings for empty array');
      return [];
    }

    this.logger.debug(`Generating embeddings for ${texts.length} texts`);

    const embeddings: number[][] = [];
    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }
}
