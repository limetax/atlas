/**
 * Embeddings Provider - Domain contract for embedding generation
 *
 * Abstract class (not interface) so it can be used as injection token
 * This defines what we expect from any embeddings provider,
 * regardless of the underlying implementation (Voyage AI, OpenAI, etc.)
 */
export abstract class IEmbeddingsProvider {
  /**
   * Generate an embedding vector for the given text
   * @param text - Text to generate embedding for
   * @returns Embedding vector as number array
   */
  abstract generateEmbedding(text: string): Promise<number[]>;
}
