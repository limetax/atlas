import { Injectable, Logger } from '@nestjs/common';
import { pipeline } from '@xenova/transformers';

/**
 * Embeddings Service - Infrastructure layer for vector embeddings
 * Uses Supabase/gte-small model via Transformers.js
 *
 * This runs locally - no external API calls, GDPR compliant
 * Model: 384 dimensions, ~30MB download on first use
 */
@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private embeddingPipeline: Awaited<ReturnType<typeof pipeline>> | null = null;

  /**
   * Initialize the embedding pipeline (lazy loading)
   * First call downloads the model (~30MB), subsequent calls use cached version
   */
  private async getEmbeddingPipeline() {
    if (!this.embeddingPipeline) {
      this.logger.log('🔄 Loading embedding model (Supabase/gte-small)...');
      this.embeddingPipeline = await pipeline('feature-extraction', 'Supabase/gte-small');
      this.logger.log('✅ Embedding model loaded');
    }
    return this.embeddingPipeline;
  }

  /**
   * Generate embedding vector for a text string
   * @param text - The text to embed
   * @returns Array of 384 floats representing the embedding
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const pipe = await this.getEmbeddingPipeline();

    // Type assertion needed due to Transformers.js complex union types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const output = await (pipe as any)(text, {
      pooling: 'mean',
      normalize: true,
    });

    // Convert Float32Array to regular array
    return Array.from(output.data as Float32Array);
  }

  /**
   * Generate embeddings for multiple texts (batch processing)
   * @param texts - Array of texts to embed
   * @returns Array of embedding vectors
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * Embedding dimensions for gte-small model
   */
  get dimensions(): number {
    return 384;
  }
}
