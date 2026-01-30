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
  relationships: {
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
  corpTax: {
    fetched: number;
    synced: number;
    errors: number;
  };
  tradeTax: {
    fetched: number;
    synced: number;
    errors: number;
  };
  analytics: {
    totalSynced: number;
    totalErrors: number;
  };
  hr: {
    totalEmployees: number;
    totalTransactions: number;
  };
  services: {
    totalServices: number;
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

// ============================================
// Phase 1.2: Additional Klardaten Types
// ============================================

/**
 * DATEV Relationship - Connections between addressees
 * Source: Klardaten /api/master-data/relationships (RelationshipDto)
 */
export interface DatevRelationship {
  // Required
  relationship_id: string;
  source_addressee_id: string;
  target_addressee_id: string;
  relationship_type: string;
  updated_at: string;

  // Optional
  relationship_name?: string;
  relationship_abbreviation?: string;
  target_addressee_type?: string;
  target_addressee_name?: string;
  source_addressee_type?: string;
  source_addressee_name?: string;
  relationship_from?: string;
  relationship_until?: string;
  note?: string;
  explanation?: string;

  // Shareholder-specific (only if relationship_type = 'S00058')
  holding_period?: string;
  shareholder_type?:
    | 'KOMMAND'
    | 'KOMPLEM'
    | 'OHGGES'
    | 'MITOH'
    | 'MITMH'
    | 'GESOH'
    | 'GESMH'
    | 'TREUH'
    | 'TREUTEI'
    | 'TREUHMH'
    | 'GESPENS';
  profit_share?: number;
  participation_amount?: number;
  capital?: number;
  liquidation_proceeds?: number;
  subscriber_number?: number;
  is_silent_partner?: boolean;
  participant_number?: number;
  earnings_share_fraction?: string;
  is_indirect_partner?: boolean;
  nominal_share?: number;
  nominal_share_fraction?: string;
}

export type RelationshipType =
  | 'S00001' // Natural Person (Mandant Natürliche Person)
  | 'S00003' // Company (Mandant Unternehmen)
  | 'S00006' // Invoice Recipient (Rechnungsempfänger)
  | 'S00007' // Account Holder for Invoicing
  | 'S00008' // Recipient for Client Correspondence
  | 'S00019' // Wife/Partner (Ehefrau/Lebenspartner)
  | 'S00021' // Life Partner
  | 'S01005' // Child (Kind)
  | 'S01008' // Business Owner (Betriebsinhaber)
  | 'S00058' // Shareholder (Gesellschafter)
  | 'S01006' // Permanent Establishment (Betriebsstätte)
  | 'S00051' // Legal Representative of Company (Geschäftsführer)
  | 'S00054' // Legal Representative of Person
  | 'S00059' // Authorized Recipient
  | 'S01009' // Proxy (Vertretungsbevollmächtigter)
  | 'S01010'; // Asset Manager

/**
 * DATEV Corporate Tax Return
 * Source: Klardaten /api/tax/corp-tax (CorpTaxDto)
 */
export interface DatevCorpTax {
  id: number;
  client_number?: number;
  order_term?: number;
  year: number;
  description?: string;
  type?: number;
  rzpool?: string;
  deleted?: number;
  status?: number;
  saved?: number;
  migrated_to_pro?: boolean;
  elster_telenumber?: string;
  tnr_provided?: string;
  datev_arrival?: string;
  transmission_date?: string;
  transmission_status?: string;
  tax_office_arrival?: string;
}

/**
 * DATEV Trade Tax Return
 * Source: Klardaten /api/tax/trade-tax (TradeTaxDto - same structure as CorpTaxDto)
 */
export interface DatevTradeTax {
  id: number;
  client_number?: number;
  order_term?: number;
  year: number;
  description?: string;
  type?: number;
  rzpool?: string;
  deleted?: number;
  status?: number;
  saved?: number;
  migrated_to_pro?: boolean;
  elster_telenumber?: string;
  tnr_provided?: string;
  datev_arrival?: string;
  transmission_date?: string;
  transmission_status?: string;
  tax_office_arrival?: string;
}

/**
 * DATEV Analytics - Order Values
 * Source: Klardaten /api/analytics/tax-advisory/order-values
 */
export interface DatevAnalyticsOrderValues {
  client_id: string;
  client_name: string;
  year: number;
  month: number;
  order_value: number;
  order_count: number;
}

/**
 * DATEV Analytics - Processing Status
 * Source: Klardaten /api/analytics/tax-advisory/processing-status
 */
export interface DatevAnalyticsProcessingStatus {
  client_id: string;
  client_name: string;
  year: number;
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  completion_rate?: number;
}

/**
 * DATEV Analytics - Expenses
 * Source: Klardaten /api/analytics/tax-advisory/expenses
 */
export interface DatevAnalyticsExpenses {
  client_id: string;
  client_name: string;
  year: number;
  expense_category?: string;
  total_amount: number;
}

/**
 * DATEV Analytics - Fees
 * Source: Klardaten /api/analytics/tax-advisory/fees
 */
export interface DatevAnalyticsFees {
  client_id: string;
  client_name: string;
  year: number;
  fee_type?: string;
  total_amount: number;
}

/**
 * DATEV HR/LODAS Employee
 * Source: Klardaten /api/hr-lodas/clients/{clientNumber}/employees
 */
export interface DatevHrEmployee {
  client_id: string;
  client_number: number;
  client_name: string;
  employee_number: number;
  employee_id: string;
  full_name: string;

  // Personal info
  birth_date?: string;
  gender?: string;
  nationality?: string;

  // Employment info
  employment_start?: string;
  employment_end?: string;
  position?: string;
  department?: string;
  salary_group?: string;

  // Contact
  email?: string;
  phone?: string;
  address_street?: string;
  address_city?: string;
  address_zip_code?: string;

  // Status
  is_active?: boolean;
}

/**
 * DATEV HR/LODAS Payroll Transaction
 * Source: Klardaten /api/hr-lodas/clients/{clientNumber}/transaction-data/standard
 */
export interface DatevHrTransaction {
  client_id: string;
  client_number: number;
  employee_number: number;
  transaction_date: string;
  transaction_type: string;
  wage_type?: number;
  amount: number;
  description?: string;
}

/**
 * DATEV Client Service
 * Source: Klardaten /api/master-data/clients/{clientId}/services
 */
export interface DatevClientService {
  client_id: string;
  service_code: string;
  service_name: string;
  is_active?: boolean;
  activated_date?: string;
}
