/**
 * Vector Store Adapter - Domain contract for vector search operations
 *
 * Abstract class (not interface) so it can be used directly as injection token.
 * No I-prefix following modern TypeScript conventions.
 */
export abstract class VectorStoreAdapter {
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
   * Get a specific DATEV client by ID without vector search
   * @param clientId - DATEV client UUID
   * @returns Client data if found, null otherwise
   */
  abstract getDatevClientById(clientId: string): Promise<DatevClientMatch | null>;

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

  /**
   * Search for similar DATEV addressees using vector similarity
   * Phase 1.1: Addressee search with optional type filtering
   */
  abstract searchDatevAddressees(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number,
    filters?: AddresseeSearchFilters
  ): Promise<DatevAddresseeMatch[]>;

  /**
   * Search for similar accounting postings using vector similarity
   * Phase 1.1: Posting search with extensive metadata filtering
   */
  abstract searchDatevPostings(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number,
    filters?: PostingSearchFilters
  ): Promise<DatevPostingMatch[]>;

  /**
   * Search for similar SUSA entries using vector similarity
   * Phase 1.1: Trial balance search with account and balance filtering
   */
  abstract searchDatevSusa(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number,
    filters?: SusaSearchFilters
  ): Promise<DatevSusaMatch[]>;

  /**
   * Search for similar document metadata using vector similarity
   * Phase 1.1: Document search with type and date filtering
   */
  abstract searchDatevDocuments(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number,
    filters?: DocumentSearchFilters
  ): Promise<DatevDocumentMatch[]>;

  /**
   * Search for similar corporate tax returns using vector similarity
   * Phase 1.2: Corp tax search with status filtering
   */
  abstract searchDatevCorpTax(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number,
    filters?: CorpTaxSearchFilters
  ): Promise<DatevCorpTaxMatch[]>;

  /**
   * Search for similar trade tax returns using vector similarity
   * Phase 1.2: Trade tax search with status filtering
   */
  abstract searchDatevTradeTax(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number,
    filters?: TradeTaxSearchFilters
  ): Promise<DatevTradeTaxMatch[]>;

  /**
   * Search for similar analytics order values using vector similarity
   * Phase 1.2: Analytics search for business intelligence
   */
  abstract searchDatevAnalyticsOrderValues(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number,
    filters?: AnalyticsSearchFilters
  ): Promise<DatevAnalyticsOrderValuesMatch[]>;

  /**
   * Search for similar HR employees using vector similarity
   * Phase 1.2: Employee search with department and status filtering
   */
  abstract searchDatevHrEmployees(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number,
    filters?: HrEmployeeSearchFilters
  ): Promise<DatevHrEmployeeMatch[]>;

  /**
   * Search for similar law publisher documents using vector similarity
   * Phase TEC-55: Legal content search (case law, commentaries, articles)
   */
  abstract searchLawPublisherDocuments(
    queryEmbedding: number[],
    matchThreshold: number,
    matchCount: number
  ): Promise<LawPublisherDocumentMatch[]>;

  /**
   * Search for similar chunks in uploaded chat documents
   * Scoped to a specific chat for document isolation
   */
  abstract searchChatDocumentChunks(
    queryEmbedding: number[],
    chatId: string,
    matchThreshold: number,
    matchCount: number
  ): Promise<ChatDocumentChunkMatch[]>;
}

// ============================================
// Filter Types for Metadata Filtering
// ============================================

export interface AddresseeSearchFilters {
  addressee_type?: 1 | 2;
  is_legal_representative?: number;
  client_id?: string;
}

export interface PostingSearchFilters {
  client_id?: string;
  fiscal_year?: number;
  account_number?: number;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
}

export interface SusaSearchFilters {
  client_id?: string;
  fiscal_year?: number;
  account_number?: number;
  negative_balance?: boolean;
}

export interface DocumentSearchFilters {
  client_id?: string;
  year?: number;
  extension?: string;
  date_from?: string;
}

// Phase 1.2: Additional Filter Types

export interface CorpTaxSearchFilters {
  client_id?: string;
  year?: number;
  status?: number;
}

export interface TradeTaxSearchFilters {
  client_id?: string;
  year?: number;
  status?: number;
}

export interface AnalyticsSearchFilters {
  client_id?: string;
  year?: number;
}

export interface HrEmployeeSearchFilters {
  client_id?: string;
  department?: string;
  is_active?: boolean;
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
 * DATEV Client Match - Result from vector search (Phase 1.1 enhanced)
 */
export interface DatevClientMatch {
  id: string;
  client_id: string;
  client_number: number;
  client_name: string;
  client_type: number | null;
  client_status: string;
  company_form: string | null;
  industry_description: string | null;
  main_email: string | null;
  main_phone: string | null;
  correspondence_city: string | null;
  organization_name: string | null;
  managing_director_name: string | null;
  managing_director_email: string | null;
  managing_director_phone: string | null;
  similarity: number;
}

/**
 * DATEV Addressee Match - Result from vector search
 */
export interface DatevAddresseeMatch {
  id: string;
  addressee_id: string;
  full_name: string;
  addressee_type: number;
  main_email: string | null;
  main_phone: string | null;
  correspondence_city: string | null;
  company_entity_type: string | null;
  is_legal_representative_of_company: number | null;
  similarity: number;
}

/**
 * DATEV Posting Match - Result from vector search
 */
export interface DatevPostingMatch {
  id: string;
  client_id: string;
  client_name: string;
  date: string;
  account_number: number;
  account_name: string | null;
  posting_description: string;
  amount: number;
  debit_credit_indicator: string;
  document_field_1: string;
  fiscal_year: number;
  similarity: number;
}

/**
 * DATEV SUSA Match - Result from vector search
 */
export interface DatevSusaMatch {
  id: string;
  client_id: string;
  client_name: string;
  fiscal_year: number;
  month: number | null;
  account_number: number;
  label: string;
  opening_balance: number;
  debit_total: number;
  credit_total: number;
  closing_balance: number;
  transaction_count: number;
  similarity: number;
}

/**
 * DATEV Document Match - Result from vector search
 */
export interface DatevDocumentMatch {
  id: string;
  document_id: string;
  document_number: number;
  client_id: string;
  description: string;
  extension: string;
  file_name: string | null;
  keywords: string | null;
  year: number | null;
  import_date_time: string | null;
  s3_key: string | null;
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

// ============================================
// Phase 1.2: Additional Match Types
// ============================================

/**
 * DATEV Corp Tax Match - Result from vector search
 */
export interface DatevCorpTaxMatch {
  id: string;
  corp_tax_id: string;
  client_id: string;
  client_name: string;
  year: number;
  status: number;
  transmission_status: string;
  similarity: number;
}

/**
 * DATEV Trade Tax Match - Result from vector search
 */
export interface DatevTradeTaxMatch {
  id: string;
  trade_tax_id: string;
  client_id: string;
  client_name: string;
  year: number;
  status: number;
  transmission_status: string;
  similarity: number;
}

/**
 * DATEV Analytics Order Values Match - Result from vector search
 */
export interface DatevAnalyticsOrderValuesMatch {
  id: string;
  client_id: string;
  client_name: string;
  year: number;
  month: number;
  order_value: number;
  order_count: number;
  similarity: number;
}

/**
 * DATEV HR Employee Match - Result from vector search
 */
export interface DatevHrEmployeeMatch {
  id: string;
  employee_id: string;
  client_id: string;
  client_name: string;
  full_name: string;
  position: string;
  department: string;
  email: string;
  is_active: boolean;
  similarity: number;
}

/**
 * Law Publisher Document Match - Result from vector search
 * Phase TEC-55: Legal content from publishers
 */
export type LawPublisherDocumentMatch = {
  id: string;
  title: string;
  citation: string | null;
  document_type: 'case_law' | 'commentary' | 'article';
  content: string;
  summary: string | null;
  publisher: string | null;
  source: string | null;
  law_reference: string | null;
  court: string | null;
  case_number: string | null;
  decision_date: string | null;
  publication_date: string | null;
  author: string | null;
  tags: string[] | null;
  similarity: number;
};

/**
 * Chat Document Chunk Match - Result from vector search of uploaded documents
 */
export type ChatDocumentChunkMatch = {
  id: string;
  document_id: string;
  content: string;
  page_number: number | null;
  chunk_index: number;
  file_name: string;
  similarity: number;
};
