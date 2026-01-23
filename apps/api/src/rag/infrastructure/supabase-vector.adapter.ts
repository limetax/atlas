import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '@shared/infrastructure/supabase.service';
import {
  IVectorStore,
  TaxDocumentMatch,
  DatevClientMatch,
  DatevOrderMatch,
} from '@rag/domain/vector-store.interface';

/**
 * Supabase Vector Adapter - Infrastructure implementation for vector search
 * Implements IVectorStore interface using Supabase pgvector
 */
@Injectable()
export class SupabaseVectorAdapter implements IVectorStore {
  private readonly logger = new Logger(SupabaseVectorAdapter.name);

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Search for similar tax documents using vector similarity
   * @param queryEmbedding - Query embedding vector
   * @param matchThreshold - Minimum similarity threshold (0-1)
   * @param matchCount - Maximum number of results to return
   * @returns Array of matching tax documents with similarity scores
   */
  async searchTaxDocuments(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number
  ): Promise<TaxDocumentMatch[]> {
    try {
      const { data, error } = await this.supabase.db.rpc('match_tax_documents', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
      });

      if (error) {
        this.logger.error('Tax document search error:', error);
        return [];
      }

      return (data as TaxDocumentMatch[]) || [];
    } catch (err) {
      this.logger.error('Tax document search failed:', err);
      return [];
    }
  }

  /**
   * Search for similar DATEV clients using vector similarity
   * @param queryEmbedding - Query embedding vector
   * @param matchThreshold - Minimum similarity threshold (0-1)
   * @param matchCount - Maximum number of results to return
   * @returns Array of matching DATEV clients with similarity scores
   */
  async searchDatevClients(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number
  ): Promise<DatevClientMatch[]> {
    try {
      const { data, error } = await this.supabase.db.rpc('match_datev_clients', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
      });

      if (error) {
        this.logger.error('DATEV client search error:', error);
        return [];
      }

      return (data as DatevClientMatch[]) || [];
    } catch (err) {
      this.logger.error('DATEV client search failed:', err);
      return [];
    }
  }

  /**
   * Search for similar DATEV orders using vector similarity
   * @param queryEmbedding - Query embedding vector
   * @param matchThreshold - Minimum similarity threshold (0-1)
   * @param matchCount - Maximum number of results to return
   * @returns Array of matching DATEV orders with similarity scores
   */
  async searchDatevOrders(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number
  ): Promise<DatevOrderMatch[]> {
    try {
      const { data, error } = await this.supabase.db.rpc('match_datev_orders', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
      });

      if (error) {
        this.logger.error('DATEV order search error:', error);
        return [];
      }

      return (data as DatevOrderMatch[]) || [];
    } catch (err) {
      this.logger.error('DATEV order search failed:', err);
      return [];
    }
  }
}
