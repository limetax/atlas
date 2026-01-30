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
  DatevCorpTaxMatch,
  DatevTradeTaxMatch,
  DatevAnalyticsOrderValuesMatch,
  DatevHrEmployeeMatch,
  AddresseeSearchFilters,
  PostingSearchFilters,
  SusaSearchFilters,
  DocumentSearchFilters,
  CorpTaxSearchFilters,
  TradeTaxSearchFilters,
  AnalyticsSearchFilters,
  HrEmployeeSearchFilters,
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

  // ============================================
  // Phase 1.2: Additional Search Methods
  // ============================================

  /**
   * Search for similar corporate tax returns using vector similarity
   * Phase 1.2: Corp tax search with status filtering
   */
  async searchDatevCorpTax(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number,
    filters?: CorpTaxSearchFilters
  ): Promise<DatevCorpTaxMatch[]> {
    try {
      const { data, error } = await this.supabase.db.rpc('match_datev_corp_tax', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_client_id: filters?.client_id || null,
        filter_year: filters?.year || null,
        filter_status: filters?.status || null,
      });

      if (error) {
        this.logger.error('DATEV corp tax search error:', error);
        return [];
      }

      return (data as DatevCorpTaxMatch[]) || [];
    } catch (err) {
      this.logger.error('DATEV corp tax search failed:', err);
      return [];
    }
  }

  /**
   * Search for similar trade tax returns using vector similarity
   * Phase 1.2: Trade tax search with status filtering
   */
  async searchDatevTradeTax(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number,
    filters?: TradeTaxSearchFilters
  ): Promise<DatevTradeTaxMatch[]> {
    try {
      const { data, error } = await this.supabase.db.rpc('match_datev_trade_tax', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_client_id: filters?.client_id || null,
        filter_year: filters?.year || null,
        filter_status: filters?.status || null,
      });

      if (error) {
        this.logger.error('DATEV trade tax search error:', error);
        return [];
      }

      return (data as DatevTradeTaxMatch[]) || [];
    } catch (err) {
      this.logger.error('DATEV trade tax search failed:', err);
      return [];
    }
  }

  /**
   * Search for similar analytics order values using vector similarity
   * Phase 1.2: Analytics search for business intelligence
   */
  async searchDatevAnalyticsOrderValues(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number,
    filters?: AnalyticsSearchFilters
  ): Promise<DatevAnalyticsOrderValuesMatch[]> {
    try {
      const { data, error } = await this.supabase.db.rpc('match_datev_analytics_order_values', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_client_id: filters?.client_id || null,
        filter_year: filters?.year || null,
      });

      if (error) {
        this.logger.error('DATEV analytics order values search error:', error);
        return [];
      }

      return (data as DatevAnalyticsOrderValuesMatch[]) || [];
    } catch (err) {
      this.logger.error('DATEV analytics order values search failed:', err);
      return [];
    }
  }

  /**
   * Search for similar HR employees using vector similarity
   * Phase 1.2: Employee search with department and status filtering
   */
  async searchDatevHrEmployees(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number,
    filters?: HrEmployeeSearchFilters
  ): Promise<DatevHrEmployeeMatch[]> {
    try {
      const { data, error } = await this.supabase.db.rpc('match_datev_hr_employees', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_client_id: filters?.client_id || null,
        filter_department: filters?.department || null,
        filter_is_active: filters?.is_active ?? null,
      });

      if (error) {
        this.logger.error('DATEV HR employees search error:', error);
        return [];
      }

      return (data as DatevHrEmployeeMatch[]) || [];
    } catch (err) {
      this.logger.error('DATEV HR employees search failed:', err);
      return [];
    }
  }
}
