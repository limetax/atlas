import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '@shared/infrastructure/supabase.service';
import {
  IVectorStore,
  TaxDocumentMatch,
  DatevClientMatch,
  DatevOrderMatch,
  DatevAddresseeMatch,
  DatevPostingMatch,
  DatevSusaMatch,
  DatevDocumentMatch,
  AddresseeSearchFilters,
  PostingSearchFilters,
  SusaSearchFilters,
  DocumentSearchFilters,
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

  /**
   * Search for similar DATEV addressees using vector similarity
   * Phase 1.1: Addressee search with optional type filtering
   */
  async searchDatevAddressees(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number,
    filters?: AddresseeSearchFilters
  ): Promise<DatevAddresseeMatch[]> {
    try {
      const { data, error } = await this.supabase.db.rpc('match_datev_addressees', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_addressee_type: filters?.addressee_type || null,
        filter_is_legal_representative: filters?.is_legal_representative || null,
      });

      if (error) {
        this.logger.error('DATEV addressee search error:', error);
        return [];
      }

      return (data as DatevAddresseeMatch[]) || [];
    } catch (err) {
      this.logger.error('DATEV addressee search failed:', err);
      return [];
    }
  }

  /**
   * Search for similar accounting postings using vector similarity
   * Phase 1.1: Posting search with extensive metadata filtering
   */
  async searchDatevPostings(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number,
    filters?: PostingSearchFilters
  ): Promise<DatevPostingMatch[]> {
    try {
      const { data, error } = await this.supabase.db.rpc('match_datev_postings', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_client_id: filters?.client_id || null,
        filter_fiscal_year: filters?.fiscal_year || null,
        filter_account_number: filters?.account_number || null,
        filter_date_from: filters?.date_from || null,
        filter_date_to: filters?.date_to || null,
        filter_min_amount: filters?.min_amount || null,
      });

      if (error) {
        this.logger.error('DATEV posting search error:', error);
        return [];
      }

      return (data as DatevPostingMatch[]) || [];
    } catch (err) {
      this.logger.error('DATEV posting search failed:', err);
      return [];
    }
  }

  /**
   * Search for similar SUSA entries using vector similarity
   * Phase 1.1: Trial balance search with account and balance filtering
   */
  async searchDatevSusa(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number,
    filters?: SusaSearchFilters
  ): Promise<DatevSusaMatch[]> {
    try {
      const { data, error } = await this.supabase.db.rpc('match_datev_susa', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_client_id: filters?.client_id || null,
        filter_fiscal_year: filters?.fiscal_year || null,
        filter_account_number: filters?.account_number || null,
        filter_negative_balance: filters?.negative_balance || null,
      });

      if (error) {
        this.logger.error('DATEV SUSA search error:', error);
        return [];
      }

      return (data as DatevSusaMatch[]) || [];
    } catch (err) {
      this.logger.error('DATEV SUSA search failed:', err);
      return [];
    }
  }

  /**
   * Search for similar document metadata using vector similarity
   * Phase 1.1: Document search with type and date filtering
   */
  async searchDatevDocuments(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number,
    filters?: DocumentSearchFilters
  ): Promise<DatevDocumentMatch[]> {
    try {
      const { data, error } = await this.supabase.db.rpc('match_datev_documents', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_client_id: filters?.client_id || null,
        filter_year: filters?.year || null,
        filter_extension: filters?.extension || null,
        filter_date_from: filters?.date_from || null,
      });

      if (error) {
        this.logger.error('DATEV document search error:', error);
        return [];
      }

      return (data as DatevDocumentMatch[]) || [];
    } catch (err) {
      this.logger.error('DATEV document search failed:', err);
      return [];
    }
  }
}
