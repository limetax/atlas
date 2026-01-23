/**
 * Vector Store - Domain contract for vector search operations
 *
 * Abstract class (not interface) so it can be used directly as injection token
 * This defines what we expect from any vector store,
 * regardless of the underlying implementation (Supabase pgvector, Pinecone, etc.)
 */
export abstract class IVectorStore {
  /**
   * Search for similar tax documents using vector similarity
   * @param queryEmbedding - Query embedding vector
   * @param matchThreshold - Minimum similarity threshold (0-1)
   * @param matchCount - Maximum number of results to return
   * @returns Array of matching tax documents with similarity scores
   */
  abstract searchTaxDocuments(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number
  ): Promise<TaxDocumentMatch[]>;

  /**
   * Search for similar DATEV clients using vector similarity
   * @param queryEmbedding - Query embedding vector
   * @param matchThreshold - Minimum similarity threshold (0-1)
   * @param matchCount - Maximum number of results to return
   * @returns Array of matching DATEV clients with similarity scores
   */
  abstract searchDatevClients(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number
  ): Promise<DatevClientMatch[]>;

  /**
   * Search for similar DATEV orders using vector similarity
   * @param queryEmbedding - Query embedding vector
   * @param matchThreshold - Minimum similarity threshold (0-1)
   * @param matchCount - Maximum number of results to return
   * @returns Array of matching DATEV orders with similarity scores
   */
  abstract searchDatevOrders(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number
  ): Promise<DatevOrderMatch[]>;
}

/**
 * Tax Document Match - Result from vector search
 */
export interface TaxDocumentMatch {
  id: string;
  citation: string;
  title: string;
  content: string;
  law_type: string;
  similarity: number;
}

/**
 * DATEV Client Match - Result from vector search
 */
export interface DatevClientMatch {
  id: string;
  client_id: string;
  client_number: number;
  client_name: string;
  client_type: number;
  company_form: string | null;
  industry_description: string | null;
  main_email: string | null;
  correspondence_city: string | null;
  similarity: number;
}

/**
 * DATEV Order Match - Result from vector search
 */
export interface DatevOrderMatch {
  id: string;
  order_id: number;
  creation_year: number;
  order_number: number;
  order_name: string;
  ordertype: string;
  client_id: string;
  client_name: string;
  completion_status: string;
  billing_status: string;
  similarity: number;
}
