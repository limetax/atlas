/**
 * DATEV Domain Types
 *
 * TypeScript interfaces for DATEV entities fetched via Klardaten Gateway.
 * These types represent the domain model for clients (Mandanten) and orders (Aufträge).
 */

// ============================================
// Client (Mandant) Types
// ============================================

/**
 * Client type enum matching DATEV's Mandantentyp
 * 1 = Natural Person, 2 = Individual Enterprise, 3 = Legal Person
 */
export type DatevClientType = 1 | 2 | 3;

/**
 * Client status enum
 * "0" = Inactive, "1" = Active
 */
export type DatevClientStatus = '0' | '1';

/**
 * DATEV Client (Mandant) - Enhanced with Phase 1.1 Klardaten fields
 * Maps to MasterDataClientDto from Klardaten OpenAPI
 */
export interface DatevClient {
  // Core (REQUIRED)
  client_id: string;
  client_number: number;
  client_name: string;
  client_status: DatevClientStatus;
  status: 'aktiv' | 'inaktiv';
  updated_at: string;
  is_online: number;

  // Optional
  differing_name?: string;
  client_type?: DatevClientType;
  client_from?: string;
  client_until?: string;
  alias_name?: string;

  // FK references (Phase 1.1)
  natural_person_id?: string;
  legal_person_id?: string;
  organization_id?: string;
  establishment_id?: string;
  area_id?: string;

  // Organizational hierarchy
  establishment_number?: number;
  establishment_name?: string;
  organization_number?: number;
  organization_name?: string;
  functional_area_name?: string;

  // Contact
  main_email?: string;
  main_phone?: string;
  main_fax?: string;
  correspondence_street?: string;
  correspondence_city?: string;
  correspondence_zip_code?: string;

  // Tax
  tax_number_vat?: string;
  identification_number?: string;
  company_form?: string;
  industry_description?: string;

  // Denormalized (populated during sync)
  managing_director_name?: string;
  managing_director_email?: string;
  managing_director_phone?: string;
  managing_director_title?: string;
}

// ============================================
// Order (Auftrag) Types
// ============================================

/**
 * Order completion status from DATEV
 */
export type DatevOrderCompletionStatus =
  | 'started'
  | 'created/planned'
  | 'interrupted'
  | 'done'
  | 'work completed'
  | 'work partially completed';

/**
 * Order billing status from DATEV
 */
export type DatevOrderBillingStatus =
  | 'invoiced'
  | 'partially invoiced'
  | 'advance payment partially invoiced'
  | 'advance invoiced'
  | 'open';

/**
 * DATEV Order (Auftrag) - Order data from order-management API
 * Maps to order definition from DATEV Order Management OpenAPI
 */
export interface DatevOrder {
  /** Unique identifier of the order object */
  id: number;
  /** Unique technical key of the order - ID Auftrag */
  order_id: number;
  /** Year in which the order was created - Anlagejahr */
  creation_year: number;
  /** Sequential order number within a year - Auftragsnummer */
  order_number: number;
  /** Name of the order - Gesamtauftrag Bezeichnung */
  order_name: string;
  /** Short name for the order type - Auftragsart Kurzbezeichnung */
  ordertype: string;
  /** Order type group - Auftragsartengruppe */
  ordertype_group?: string;
  /** Year of the tax declaration/service - Veranlagungsjahr */
  assessment_year: number;
  /** Business year - Wirtschaftsjahr */
  fiscal_year: number;
  /** Flag for internal order */
  isinternal?: boolean;
  /** Client ID (UUID) - ID Mandant */
  client_id: string;
  /** Processing status of the order */
  completion_status: DatevOrderCompletionStatus;
  /** Date of completion status change */
  date_completion_status?: string;
  /** Billing status of the order */
  billing_status: DatevOrderBillingStatus;
  /** Date of billing status change */
  date_billing_status?: string;
  /** Organization ID (UUID) */
  organization_id: string;
  /** Establishment/branch ID (UUID) */
  establishment_id: string;
  /** Functional area ID (UUID) */
  functional_area_id: string;
  /** Cost center short name */
  cost_center?: string;
  /** Cost center full name */
  cost_center_name?: string;
  /** Employee 1 ID (UUID) - responsible */
  order_responsible1_id: string;
  /** Employee 2 ID (UUID) */
  order_responsible2_id?: string;
  /** Partner ID (UUID) */
  order_partner_id?: string;
}

// ============================================
// Extended Types for RAG Storage
// ============================================

/**
 * Client data enriched for RAG storage
 * Includes computed fields for embedding generation
 */
export interface DatevClientForRAG extends DatevClient {
  /** Pre-computed text for embedding generation */
  embedding_text: string;
}

/**
 * Order data enriched for RAG storage
 * Includes denormalized client_name for semantic search
 */
export interface DatevOrderForRAG extends DatevOrder {
  /** Denormalized client name for RAG context */
  client_name: string;
  /** Pre-computed text for embedding generation */
  embedding_text: string;
}

// ============================================
// API Response Types
// ============================================

/**
 * Klardaten authentication response
 */
export interface KlardatenAuthResponse {
  access_token: string;
  access_token_expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
}

/**
 * Paginated response wrapper from Klardaten/DATEV APIs
 */
export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  page_size?: number;
}

// ============================================
// Sync Result Types
// ============================================

/**
 * Result of a DATEV sync operation (Phase 1.1)
 */
export interface DatevSyncResult {
  success: boolean;
  addressees: {
    fetched: number;
    synced: number;
    errors: number;
  };
  clients: {
    fetched: number;
    synced: number;
    errors: number;
  };
  postings: {
    fetched: number;
    synced: number;
    errors: number;
  };
  susa: {
    fetched: number;
    synced: number;
    errors: number;
  };
  documents: {
    fetched: number;
    synced: number;
    errors: number;
  };
  duration_ms: number;
  error?: string;
}

// ============================================
// Database Match Types
// ============================================

/**
 * Client match result from vector search
 */
export interface DatevClientMatch {
  id: string;
  client_id: string;
  client_number: number;
  client_name: string;
  client_type: DatevClientType;
  company_form: string | null;
  industry_description: string | null;
  main_email: string | null;
  correspondence_city: string | null;
  similarity: number;
}

/**
 * Order match result from vector search
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
  completion_status: DatevOrderCompletionStatus;
  billing_status: DatevOrderBillingStatus;
  similarity: number;
}

// ============================================
// Phase 1.1: Additional Klardaten Types
// ============================================

export interface DatevAddressee {
  addressee_id: string;
  addressee_type: number;
  full_name: string;
  updated_at: string;
  addressee_status?: string;
  status?: string;
  birth_date?: string;
  age?: number;
  alias_name?: string;
  main_email?: string;
  main_phone?: string;
  main_fax?: string;
  correspondence_street?: string;
  correspondence_city?: string;
  correspondence_zip_code?: string;
  tax_number_vat?: string;
  identification_number?: string;
  vat_id?: string;
  company_entity_type?: string;
  company_object?: string;
  foundation_date?: string;
  industry_description?: string;
  noble_title?: string;
  academic_title?: string;
  salutation?: string;
  gender?: string;
  is_client?: number;
  is_legal_representative_of_person?: number;
  is_legal_representative_of_company?: number;
  is_shareholder?: number;
  is_business_owner?: number;
}

export interface DatevPosting {
  client_id: string;
  client_name: string;
  date: string;
  account_number: number;
  contra_account_number: number;
  posting_description: string;
  tax_rate: number;
  document_field_1: string;
  document_field_2: string;
  amount: number;
  debit_credit_indicator: 'S' | 'H';
  currency_code: string;
  exchange_rate: number;
  record_type: string;
  accounting_transaction_key: number;
  general_reversal: number;
  document_link: string;
  fiscal_year: number;
  account_name?: string;
}

export interface DatevSusa {
  client_id: string;
  client_name: string;
  fiscal_year: number;
  month?: number;
  account_number: number;
  label: string;
  debit_total: number;
  credit_total: number;
  current_month_debit: number;
  current_month_credit: number;
  debit_credit_code: 'S' | 'H';
  balance: number;
  transaction_count: number;
  current_month_transaction_count?: number;
}

export interface DatevDocument {
  document_id: string;
  document_number?: number;
  description?: string;
  extension?: string;
  case_number?: string;
  client_id: string;
  client_number: number;
  folder_id?: number;
  folder_name?: string;
  year?: number;
  month?: number;
  keywords?: string;
  import_date_time?: string;
  create_date_time?: string;
  change_date_time?: string;
  file_name?: string;
  file_size_bytes?: number;
  priority?: string;
  archived?: boolean;
  read_only?: number;
  s3_bucket?: string;
  s3_key?: string;
  s3_url?: string;
}
