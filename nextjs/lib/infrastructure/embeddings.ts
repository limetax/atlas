/**
 * Embeddings Service - Infrastructure layer for vector embeddings
 * Uses Supabase/gte-small model via Transformers.js
 *
 * This runs locally - no external API calls, GDPR compliant
 * Model: 384 dimensions, ~30MB download on first use
 */

// Dynamic import to avoid issues with SSR
let pipeline: typeof import("@xenova/transformers").pipeline | null = null;
let embeddingPipeline: Awaited<
  ReturnType<typeof import("@xenova/transformers").pipeline>
> | null = null;

/**
 * Initialize the embedding pipeline (lazy loading)
 * First call downloads the model (~30MB), subsequent calls use cached version
 */
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    // Dynamic import for Transformers.js
    const transformers = await import("@xenova/transformers");
    pipeline = transformers.pipeline;

    console.log("🔄 Loading embedding model (Supabase/gte-small)...");
    embeddingPipeline = await pipeline(
      "feature-extraction",
      "Supabase/gte-small"
    );
    console.log("✅ Embedding model loaded");
  }
  return embeddingPipeline;
}

/**
 * Generate embedding vector for a text string
 * @param text - The text to embed
 * @returns Array of 384 floats representing the embedding
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const pipe = await getEmbeddingPipeline();

  // Type assertion needed due to Transformers.js complex union types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output = await (pipe as any)(text, {
    pooling: "mean",
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
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const embeddings: number[][] = [];

  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);
  }

  return embeddings;
}

/**
 * Embedding dimensions for gte-small model
 */
export const EMBEDDING_DIMENSIONS = 384;
