/**
 * Embeddings Adapter - Domain contract for embedding generation
 *
 * Abstract class (not interface) so it can be used as injection token.
 * No I-prefix following modern TypeScript conventions.
 */
export abstract class EmbeddingsAdapter {
  /**
   * Generate an embedding vector for the given text
   * @param text - Text to generate embedding for
   * @returns Embedding vector as number array
   */
  abstract generateEmbedding(text: string): Promise<number[]>;
}
