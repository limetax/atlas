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
 * DATEV Client (Mandant) - Core client data from master-data API
 * Maps to MasterDataClientDto from Klardaten OpenAPI
 */
export interface DatevClient {
  /** Unique client ID (UUID) - MandantenId */
  client_id: string;
  /** Client number - Mandantennummer */
  client_number: number;
  /** Client name - Mandantenname */
  client_name: string;
  /** Alternate client name - MandantennameAbw */
  differing_name?: string;
  /** Client type: 1=Natural Person, 2=Individual Enterprise, 3=Legal Person */
  client_type: DatevClientType;
  /** Client status: "0"=Inactive, "1"=Active */
  client_status: DatevClientStatus;
  /** Status text: "aktiv" or "inaktiv" */
  status: 'aktiv' | 'inaktiv';
  /** Client relationship start date */
  client_from?: string;
  /** Client relationship end date */
  client_until?: string;
  /** Company form (e.g., "GmbH", "AG") */
  company_form?: string;
  /** Industry description */
  industry_description?: string;
  /** Main email address */
  main_email?: string;
  /** Main phone number */
  main_phone?: string;
  /** Correspondence street address */
  correspondence_street?: string;
  /** Correspondence city */
  correspondence_city?: string;
  /** Correspondence ZIP code */
  correspondence_zip_code?: string;
  /** Tax number for VAT office */
  tax_number_vat?: string;
  /** Last update timestamp */
  updated_at?: string;
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
 * Result of a DATEV sync operation
 */
export interface DatevSyncResult {
  success: boolean;
  clients: {
    fetched: number;
    synced: number;
    errors: number;
  };
  orders: {
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
