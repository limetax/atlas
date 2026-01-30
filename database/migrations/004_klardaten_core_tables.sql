-- ============================================
-- limetaxIQ DATEV/Klardaten Core Tables Migration
-- Version: 004
-- Description: Drops existing DATEV tables and recreates with exact Klardaten API field mappings
-- Date Filter: 2025-01-01+ data only
-- Embedding Model: Supabase/gte-small (384 dimensions)
-- ============================================

-- Note: pgvector extension should already be enabled from migration 002

-- ============================================
-- DROP EXISTING DATEV TABLES
-- ============================================

DROP TABLE IF EXISTS public.datev_orders CASCADE;
DROP TABLE IF EXISTS public.datev_clients CASCADE;

-- Drop old match functions
DROP FUNCTION IF EXISTS public.match_datev_clients CASCADE;
DROP FUNCTION IF EXISTS public.match_datev_orders CASCADE;

-- ============================================
-- Table: datev_addressees
-- Source: Klardaten /api/master-data/addressees
-- Purpose: Person/entity details for client enrichment
-- ============================================

CREATE TABLE IF NOT EXISTS public.datev_addressees (
  -- Internal
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Core fields from MasterDataAddresseeDto (REQUIRED)
  addressee_id TEXT NOT NULL UNIQUE,
  addressee_type INTEGER NOT NULL,  -- 1: Natural Person, 2: Legal Person
  full_name TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  
  -- Status
  addressee_status TEXT,
  status TEXT,
  
  -- Personal info (for natural persons)
  birth_date TIMESTAMPTZ,
  age INTEGER,
  date_of_death TIMESTAMPTZ,
  noble_title TEXT,
  academic_title TEXT,
  salutation TEXT,
  gender TEXT,
  alias_name TEXT,
  
  -- Contact information
  main_email TEXT,
  main_phone TEXT,
  main_phone_normalized TEXT,
  main_fax TEXT,
  correspondence_street TEXT,
  correspondence_po_box TEXT,
  correspondence_zip_code TEXT,
  correspondence_city TEXT,
  correspondence_nation TEXT,
  
  -- Tax information
  tax_number_business_home TEXT,
  tax_office_description_business_home TEXT,
  tax_number_payroll TEXT,
  tax_office_description_payroll TEXT,
  tax_number_vat TEXT,
  tax_office_description_vat TEXT,
  tax_number_business TEXT,
  tax_office_description_business TEXT,
  tax_number_home TEXT,
  tax_office_description_home TEXT,
  identification_number TEXT,
  vat_id TEXT,
  business_identification_number TEXT,
  
  -- Company info (for legal persons)
  company_entity_type TEXT,
  company_object TEXT,
  foundation_date TIMESTAMPTZ,
  dissolution_date TIMESTAMPTZ,
  industry_description TEXT,
  industry_key TEXT,
  foundation_age INTEGER,
  
  -- Relationship flags (from API)
  is_client INTEGER,
  is_spousal_contact INTEGER,
  is_permanent_establishment INTEGER,
  is_employee INTEGER,
  is_invoice_recipient INTEGER,
  is_account_holder_for_invoicing INTEGER,
  is_client_correspondence_recipient INTEGER,
  is_spouse INTEGER,
  is_legal_representative_of_person INTEGER,
  is_legal_representative_of_company INTEGER,
  is_shareholder INTEGER,
  is_child INTEGER,
  is_business_owner INTEGER,
  is_power_of_attorney INTEGER,
  is_unlinked INTEGER,
  is_beneficial_owner INTEGER,
  
  -- Additional
  additional_relationships TEXT,
  identity_verified_on TIMESTAMPTZ,
  tenant_id TEXT,
  individual_fields JSONB,
  
  -- Vector search
  embedding_text TEXT NOT NULL,
  embedding vector(384),
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.datev_addressees IS 'DATEV addressee (person/entity) data from Klardaten API for client enrichment';
COMMENT ON COLUMN public.datev_addressees.addressee_type IS '1: Natural Person, 2: Legal Person';
COMMENT ON COLUMN public.datev_addressees.metadata IS 'JSONB metadata for filtering: addressee_type, legal_form, is_active';

CREATE INDEX idx_datev_addressees_id ON public.datev_addressees(addressee_id);
CREATE INDEX idx_datev_addressees_type ON public.datev_addressees(addressee_type);
CREATE INDEX idx_datev_addressees_embedding ON public.datev_addressees USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_datev_addressees_name_gin ON public.datev_addressees USING gin (to_tsvector('german', full_name));

-- ============================================
-- Table: datev_clients
-- Source: Klardaten /api/master-data/clients
-- Purpose: Enhanced client data with addressee denormalization
-- ============================================

CREATE TABLE IF NOT EXISTS public.datev_clients (
  -- Internal
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Core identifiers from MasterDataClientDto (REQUIRED)
  client_id TEXT NOT NULL UNIQUE,
  client_number INTEGER NOT NULL,
  client_name TEXT NOT NULL,
  client_status TEXT NOT NULL,  -- '0' inactive, '1' active
  status TEXT NOT NULL,          -- 'aktiv', 'inaktiv'
  updated_at TIMESTAMPTZ NOT NULL,
  is_online INTEGER NOT NULL,
  
  -- Client dates
  client_from TIMESTAMPTZ,
  client_until TIMESTAMPTZ,
  
  -- Client type and attributes
  client_type INTEGER,           -- 1: Natural Person, 2: Individual Enterprise, 3: Legal Person
  differing_name TEXT,
  alias_name TEXT,
  is_law_firm INTEGER,
  
  -- Foreign key references (for enrichment and filtering)
  natural_person_id TEXT,
  legal_person_id TEXT,
  organization_id TEXT,
  establishment_id TEXT,
  area_id TEXT,
  
  -- Organizational hierarchy
  establishment_number INTEGER,
  establishment_name TEXT,
  establishment_short_name TEXT,
  organization_number INTEGER,
  organization_name TEXT,           -- Note: API has typo "orgainzation_name"
  functional_area_short_name TEXT,
  functional_area_name TEXT,
  
  -- Contact information
  main_email TEXT,
  main_phone TEXT,
  main_phone_norm TEXT,
  main_fax TEXT,
  correspondence_street TEXT,
  correspondence_po_box TEXT,
  correspondence_zip_code TEXT,
  correspondence_city TEXT,
  correspondence_nation TEXT,
  
  -- Tax information
  tax_number_business_residential TEXT,
  business_residential_finance_description TEXT,
  tax_number_payroll TEXT,
  payroll_tax_description TEXT,
  tax_number_vat TEXT,
  vat_office_description TEXT,
  tax_number_operational TEXT,
  operational_finance_description TEXT,
  tax_number_residential TEXT,
  residential_finance_description TEXT,
  identification_number TEXT,
  
  -- Company information
  company_form TEXT,
  company_object TEXT,
  industry_description TEXT,
  industry_key TEXT,
  foundation_date TIMESTAMPTZ,
  foundation_age INTEGER,
  
  -- Personal information (for natural persons)
  birth_date TIMESTAMPTZ,
  birth_day TIMESTAMPTZ,
  birth_day_filter TIMESTAMPTZ,
  death_date TIMESTAMPTZ,
  age INTEGER,
  noble_title TEXT,
  academic_title TEXT,
  salutation TEXT,
  
  -- Declaration and compliance
  submitted_annual_declaration INTEGER,
  declaration_submission_until TIMESTAMPTZ,
  information_characteristics TEXT,
  
  -- Risk assessment
  identification_verified_on TIMESTAMPTZ,
  identification_status TEXT,          -- 'vollständig', 'unvollständig'
  identification_status_code TEXT,     -- '1': Incomplete, '3': Complete
  identification_comment TEXT,
  risk_assessment TEXT,                -- 'gering', 'mittel', 'hoch'
  risk_assessment_code TEXT,           -- '1': Low, '2': Medium, '3': High
  risk_assessment_date TIMESTAMPTZ,
  risk_assessment_comment TEXT,
  transparency_register_date TIMESTAMPTZ,
  transparency_register TEXT,          -- 'stimmig', 'nicht erforderlich', 'Unstimigkeiten gemeldet'
  transparency_register_code TEXT,     -- '1': Not Required, '2': Consistent, '3': Inconsistencies
  transparency_register_comment TEXT,
  
  -- Client grouping
  client_group_id_sdv INTEGER,
  client_group_short TEXT,
  client_group TEXT,
  client_group_billing_id_sdv INTEGER,
  client_categories TEXT,
  
  -- Predecessor/Successor relationships
  predecessor_client_id TEXT,
  predecessor_client_id_sdv INTEGER,
  predecessor_client_number INTEGER,
  predecessor_client_name TEXT,
  predecessor_client_from TIMESTAMPTZ,
  successor_client_id TEXT,
  successor_client_id_sdv INTEGER,
  successor_client_number INTEGER,
  successor_client_name TEXT,
  successor_client_from TIMESTAMPTZ,
  
  -- Additional attributes
  vdb_status INTEGER,
  sepa_status INTEGER,
  mbnr INTEGER,
  is_synchronized TEXT,
  online_registered INTEGER,
  company_tenant_id TEXT,
  taxpayer_tenant_id TEXT,
  client_id_sdv INTEGER,
  note TEXT,
  individual_fields JSONB,
  
  -- Denormalized addressee info (populated during sync for rich embeddings)
  managing_director_name TEXT,
  managing_director_email TEXT,
  managing_director_phone TEXT,
  managing_director_title TEXT,
  
  -- Vector search
  embedding_text TEXT NOT NULL,
  embedding vector(384),
  metadata JSONB DEFAULT '{}'::jsonb  -- Stores FKs for efficient filtering
);

COMMENT ON TABLE public.datev_clients IS 'DATEV client data from Klardaten API with addressee enrichment for RAG';
COMMENT ON COLUMN public.datev_clients.natural_person_id IS 'FK to datev_addressees for natural person clients';
COMMENT ON COLUMN public.datev_clients.legal_person_id IS 'FK to datev_addressees for legal person clients';
COMMENT ON COLUMN public.datev_clients.managing_director_name IS 'Denormalized from addressee lookup during sync';
COMMENT ON COLUMN public.datev_clients.metadata IS 'JSONB for filtering: natural_person_id, legal_person_id, organization_id, etc.';

-- Indexes
CREATE INDEX idx_datev_clients_number ON public.datev_clients(client_number);
CREATE INDEX idx_datev_clients_status ON public.datev_clients(client_status) WHERE client_status = '1';
CREATE INDEX idx_datev_clients_org ON public.datev_clients(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_datev_clients_embedding ON public.datev_clients USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_datev_clients_name_gin ON public.datev_clients USING gin (to_tsvector('german', client_name));

-- ============================================
-- Table: datev_accounting_postings
-- Source: Klardaten /api/accounting/postings
-- Purpose: Transaction-level accounting data (HIGH VOLUME!)
-- ============================================

CREATE TABLE IF NOT EXISTS public.datev_accounting_postings (
  -- Internal
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Core fields from PostingDto (ALL REQUIRED)
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,              -- Denormalized for semantic search
  date TIMESTAMPTZ NOT NULL,              -- Belegdatum
  account_number INTEGER NOT NULL,        -- Kontonummer
  contra_account_number INTEGER NOT NULL, -- Gegenkontonummer
  posting_description TEXT NOT NULL,      -- Buchungstext
  tax_rate NUMERIC(5,2) NOT NULL,        -- Steuersatz
  document_field_1 TEXT NOT NULL,         -- Belegnummer
  document_field_2 TEXT NOT NULL,         -- Belegnummer2
  amount NUMERIC(15,2) NOT NULL,          -- Umsatz
  debit_credit_indicator TEXT NOT NULL,   -- 'S' (Soll) or 'H' (Haben)
  currency_code TEXT NOT NULL,            -- Währung (typically 'EUR')
  exchange_rate NUMERIC(15,6) NOT NULL,   -- Umrechnungskurs
  record_type TEXT NOT NULL,              -- Herkunftskennzeichen
  accounting_transaction_key INTEGER NOT NULL, -- BuSchluessel
  general_reversal INTEGER NOT NULL,      -- KennzGeneralumkehr (0 or 1)
  document_link TEXT NOT NULL,            -- Beleglink (UUID)
  
  -- Computed fields
  fiscal_year INTEGER NOT NULL,           -- Extracted from date for filtering
  
  -- Optional: Account name for better context (populated if available)
  account_name TEXT,
  
  -- Vector search
  embedding_text TEXT NOT NULL,
  embedding vector(384),
  metadata JSONB DEFAULT '{}'::jsonb  -- { client_id, fiscal_year, account_number, posting_date }
);

COMMENT ON TABLE public.datev_accounting_postings IS 'DATEV accounting postings from Klardaten API - transaction-level data (high volume)';
COMMENT ON COLUMN public.datev_accounting_postings.debit_credit_indicator IS 'S=Soll (Debit), H=Haben (Credit)';
COMMENT ON COLUMN public.datev_accounting_postings.metadata IS 'JSONB for efficient filtering before vector search';

-- Critical indexes for filtering BEFORE vector search
CREATE INDEX idx_postings_client_year ON public.datev_accounting_postings(client_id, fiscal_year);
CREATE INDEX idx_postings_client_date ON public.datev_accounting_postings(client_id, date);
CREATE INDEX idx_postings_account ON public.datev_accounting_postings(account_number);
CREATE INDEX idx_postings_date ON public.datev_accounting_postings(date);
CREATE INDEX idx_postings_fiscal_year ON public.datev_accounting_postings(fiscal_year);
CREATE INDEX idx_postings_embedding ON public.datev_accounting_postings USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_postings_description_gin ON public.datev_accounting_postings USING gin (to_tsvector('german', posting_description));

-- ============================================
-- Table: datev_susa
-- Source: Klardaten /api/accounting/susa
-- Purpose: Trial balance (Summen- und Saldenliste) - aggregated view
-- ============================================

CREATE TABLE IF NOT EXISTS public.datev_susa (
  -- Internal
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Core fields from MonthlySusaDto (ALL REQUIRED)
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,              -- Denormalized
  fiscal_year INTEGER NOT NULL,
  month INTEGER,                          -- NULL for annual SUSA
  account_number INTEGER NOT NULL,
  label TEXT,                             -- Beschriftung (account name)
  debit_total NUMERIC(15,2) NOT NULL,     -- kum. Werte Soll
  credit_total NUMERIC(15,2) NOT NULL,    -- Haben
  current_month_debit NUMERIC(15,2) NOT NULL, -- Soll Monat
  current_month_credit NUMERIC(15,2) NOT NULL, -- Haben Monat
  debit_credit_code TEXT NOT NULL,        -- 'S' or 'H'
  balance NUMERIC(15,2) NOT NULL,         -- Saldo
  transaction_count INTEGER NOT NULL,     -- Anzahl
  current_month_transaction_count INTEGER, -- Anzahl Monat
  
  -- Vector search
  embedding_text TEXT NOT NULL,
  embedding vector(384),
  metadata JSONB DEFAULT '{}'::jsonb,  -- { client_id, fiscal_year, month, account_number }
  
  -- Unique constraint
  UNIQUE(client_id, fiscal_year, month, account_number)
);

COMMENT ON TABLE public.datev_susa IS 'DATEV trial balance (SUSA) from Klardaten API - aggregated account balances';
COMMENT ON COLUMN public.datev_susa.month IS 'Month (1-12) or NULL for annual SUSA';
COMMENT ON COLUMN public.datev_susa.balance IS 'Account balance (positive or negative)';

-- Indexes
CREATE INDEX idx_susa_client_year ON public.datev_susa(client_id, fiscal_year);
CREATE INDEX idx_susa_client_year_month ON public.datev_susa(client_id, fiscal_year, month);
CREATE INDEX idx_susa_account ON public.datev_susa(account_number);
CREATE INDEX idx_susa_balance ON public.datev_susa(balance) WHERE balance < 0; -- Negative balances
CREATE INDEX idx_susa_embedding ON public.datev_susa USING hnsw (embedding vector_cosine_ops);

-- ============================================
-- Table: datev_documents
-- Source: Klardaten /api/master-data/documents
-- Purpose: Document metadata (NO FILE STORAGE - S3 in Phase 1.2)
-- ============================================

CREATE TABLE IF NOT EXISTS public.datev_documents (
  -- Internal
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Core fields from DataChangeDocumentDto (REQUIRED)
  document_id TEXT NOT NULL UNIQUE,
  document_number INTEGER,                 -- Optional - some documents don't have numbers
  description TEXT NOT NULL,
  extension TEXT NOT NULL,                -- 'PDF', 'DOC', 'DOCX', etc.
  case_number TEXT NOT NULL,
  
  -- Client reference (FK)
  client_id TEXT NOT NULL,                -- correspondence_partner_guid
  client_number INTEGER NOT NULL,         -- correspondence_partner_firm_number
  
  -- Document organization
  folder_id INTEGER,
  folder_name TEXT,
  register_id INTEGER,
  register_name TEXT,
  domain_id INTEGER,
  domain_name TEXT,
  year INTEGER,
  month INTEGER,
  keywords TEXT,
  
  -- Dates
  import_date_time TIMESTAMPTZ,
  export_date_time TIMESTAMPTZ,
  create_date_time TIMESTAMPTZ NOT NULL,
  change_date_time TIMESTAMPTZ NOT NULL,
  cost_date TIMESTAMPTZ,
  outbox_date TIMESTAMPTZ,
  inbox_date TIMESTAMPTZ,
  
  -- File info (NO ACTUAL FILE CONTENT!)
  file_name TEXT,
  file_size_bytes BIGINT,
  
  -- Document attributes
  priority TEXT,
  application TEXT,
  archived BOOLEAN,
  read_only INTEGER NOT NULL,
  checked_out INTEGER NOT NULL,
  reference_file INTEGER NOT NULL,
  
  -- Cost info
  amount NUMERIC(15,2),
  cost_number1 INTEGER,
  cost_number2 INTEGER,
  cost_quantity INTEGER,
  more_years INTEGER,
  
  -- Order reference
  order_id INTEGER,
  order_assessment_year INTEGER,
  
  -- User info
  user_id TEXT,
  user_name TEXT,
  user_is_deleted INTEGER,
  
  -- Employee/Class/Secure area
  employee_id INTEGER,
  employee_name TEXT,
  class_id INTEGER,
  class_name TEXT,
  secure_area_id INTEGER,
  secure_area_name TEXT,
  state_id INTEGER,
  state_name TEXT,
  
  -- Future S3 integration (NULL for Phase 1.1)
  s3_bucket TEXT,
  s3_key TEXT,
  s3_url TEXT,
  s3_uploaded_at TIMESTAMPTZ,
  
  -- Vector search
  embedding_text TEXT NOT NULL,
  embedding vector(384),
  metadata JSONB DEFAULT '{}'::jsonb  -- { client_id, document_type, upload_date, year, tags }
);

COMMENT ON TABLE public.datev_documents IS 'DATEV document metadata from Klardaten API (actual files in S3 - Phase 1.2)';
COMMENT ON COLUMN public.datev_documents.s3_key IS 'S3 object key (NULL until S3 integration in Phase 1.2)';
COMMENT ON COLUMN public.datev_documents.extension IS 'File extension: PDF, DOC, DOCX, XLS, etc.';

-- Indexes
CREATE INDEX idx_documents_client ON public.datev_documents(client_id);
CREATE INDEX idx_documents_client_year ON public.datev_documents(client_id, year);
CREATE INDEX idx_documents_year ON public.datev_documents(year);
CREATE INDEX idx_documents_type ON public.datev_documents(extension);
CREATE INDEX idx_documents_import_date ON public.datev_documents(import_date_time);
CREATE INDEX idx_documents_embedding ON public.datev_documents USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_documents_keywords_gin ON public.datev_documents USING gin (to_tsvector('german', keywords)) WHERE keywords IS NOT NULL;

-- ============================================
-- Function: match_datev_addressees
-- Semantic similarity search with metadata filtering
-- ============================================

CREATE OR REPLACE FUNCTION public.match_datev_addressees(
  query_embedding vector(384),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5,
  filter_addressee_type INT DEFAULT NULL,
  filter_is_legal_representative INT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  addressee_id TEXT,
  full_name TEXT,
  addressee_type INTEGER,
  main_email TEXT,
  main_phone TEXT,
  correspondence_city TEXT,
  company_entity_type TEXT,
  is_legal_representative_of_company INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    da.id,
    da.addressee_id,
    da.full_name,
    da.addressee_type,
    da.main_email,
    da.main_phone,
    da.correspondence_city,
    da.company_entity_type,
    da.is_legal_representative_of_company,
    1 - (da.embedding <=> query_embedding) AS similarity
  FROM public.datev_addressees da
  WHERE da.embedding IS NOT NULL
    AND 1 - (da.embedding <=> query_embedding) > match_threshold
    AND (filter_addressee_type IS NULL OR da.addressee_type = filter_addressee_type)
    AND (filter_is_legal_representative IS NULL OR da.is_legal_representative_of_company = filter_is_legal_representative)
  ORDER BY da.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.match_datev_addressees IS 'Semantic search for addressees with optional type and role filtering';

-- ============================================
-- Function: match_datev_clients (Enhanced)
-- Semantic similarity search with metadata filtering
-- ============================================

CREATE OR REPLACE FUNCTION public.match_datev_clients(
  query_embedding vector(384),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5,
  filter_client_status TEXT DEFAULT NULL,
  filter_organization_id TEXT DEFAULT NULL,
  filter_industry TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  client_id TEXT,
  client_number INTEGER,
  client_name TEXT,
  client_type INTEGER,
  client_status TEXT,
  company_form TEXT,
  industry_description TEXT,
  main_email TEXT,
  main_phone TEXT,
  correspondence_city TEXT,
  organization_name TEXT,
  managing_director_name TEXT,
  managing_director_email TEXT,
  managing_director_phone TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.client_id,
    dc.client_number,
    dc.client_name,
    dc.client_type,
    dc.client_status,
    dc.company_form,
    dc.industry_description,
    dc.main_email,
    dc.main_phone,
    dc.correspondence_city,
    dc.organization_name,
    dc.managing_director_name,
    dc.managing_director_email,
    dc.managing_director_phone,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.datev_clients dc
  WHERE dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    AND (filter_client_status IS NULL OR dc.client_status = filter_client_status)
    AND (filter_organization_id IS NULL OR dc.organization_id = filter_organization_id)
    AND (filter_industry IS NULL OR dc.industry_description ILIKE '%' || filter_industry || '%')
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.match_datev_clients IS 'Semantic search for clients with metadata filtering and enriched addressee context';

-- ============================================
-- Function: match_datev_postings
-- Semantic similarity search with extensive metadata filtering
-- ============================================

CREATE OR REPLACE FUNCTION public.match_datev_postings(
  query_embedding vector(384),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 50,
  filter_client_id TEXT DEFAULT NULL,
  filter_fiscal_year INT DEFAULT NULL,
  filter_account_number INT DEFAULT NULL,
  filter_date_from DATE DEFAULT NULL,
  filter_date_to DATE DEFAULT NULL,
  filter_min_amount NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  client_id TEXT,
  client_name TEXT,
  date TIMESTAMPTZ,
  account_number INTEGER,
  account_name TEXT,
  posting_description TEXT,
  amount NUMERIC,
  debit_credit_indicator TEXT,
  document_field_1 TEXT,
  fiscal_year INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dp.id,
    dp.client_id,
    dp.client_name,
    dp.date,
    dp.account_number,
    dp.account_name,
    dp.posting_description,
    dp.amount,
    dp.debit_credit_indicator,
    dp.document_field_1,
    dp.fiscal_year,
    1 - (dp.embedding <=> query_embedding) AS similarity
  FROM public.datev_accounting_postings dp
  WHERE dp.embedding IS NOT NULL
    AND 1 - (dp.embedding <=> query_embedding) > match_threshold
    AND (filter_client_id IS NULL OR dp.client_id = filter_client_id)
    AND (filter_fiscal_year IS NULL OR dp.fiscal_year = filter_fiscal_year)
    AND (filter_account_number IS NULL OR dp.account_number = filter_account_number)
    AND (filter_date_from IS NULL OR dp.date >= filter_date_from)
    AND (filter_date_to IS NULL OR dp.date <= filter_date_to)
    AND (filter_min_amount IS NULL OR dp.amount >= filter_min_amount)
  ORDER BY dp.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.match_datev_postings IS 'Semantic search for accounting postings with date, account, and amount filtering';

-- ============================================
-- Function: match_datev_susa
-- Semantic similarity search for trial balance data
-- ============================================

CREATE OR REPLACE FUNCTION public.match_datev_susa(
  query_embedding vector(384),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 10,
  filter_client_id TEXT DEFAULT NULL,
  filter_fiscal_year INT DEFAULT NULL,
  filter_account_number INT DEFAULT NULL,
  filter_negative_balance BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  client_id TEXT,
  client_name TEXT,
  fiscal_year INTEGER,
  month INTEGER,
  account_number INTEGER,
  label TEXT,
  opening_balance NUMERIC,
  debit_total NUMERIC,
  credit_total NUMERIC,
  closing_balance NUMERIC,
  transaction_count INTEGER,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ds.id,
    ds.client_id,
    ds.client_name,
    ds.fiscal_year,
    ds.month,
    ds.account_number,
    ds.label,
    ds.balance - ds.debit_total + ds.credit_total AS opening_balance, -- Computed
    ds.debit_total,
    ds.credit_total,
    ds.balance AS closing_balance,
    ds.transaction_count,
    1 - (ds.embedding <=> query_embedding) AS similarity
  FROM public.datev_susa ds
  WHERE ds.embedding IS NOT NULL
    AND 1 - (ds.embedding <=> query_embedding) > match_threshold
    AND (filter_client_id IS NULL OR ds.client_id = filter_client_id)
    AND (filter_fiscal_year IS NULL OR ds.fiscal_year = filter_fiscal_year)
    AND (filter_account_number IS NULL OR ds.account_number = filter_account_number)
    AND (filter_negative_balance IS NULL OR (filter_negative_balance = TRUE AND ds.balance < 0) OR (filter_negative_balance = FALSE AND ds.balance >= 0))
  ORDER BY ds.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.match_datev_susa IS 'Semantic search for SUSA trial balance with balance filtering';

-- ============================================
-- Function: match_datev_documents
-- Semantic similarity search for document metadata
-- ============================================

CREATE OR REPLACE FUNCTION public.match_datev_documents(
  query_embedding vector(384),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 10,
  filter_client_id TEXT DEFAULT NULL,
  filter_year INT DEFAULT NULL,
  filter_extension TEXT DEFAULT NULL,
  filter_date_from TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id TEXT,
  document_number INTEGER,
  client_id TEXT,
  description TEXT,
  extension TEXT,
  file_name TEXT,
  keywords TEXT,
  year INTEGER,
  import_date_time TIMESTAMPTZ,
  s3_key TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dd.id,
    dd.document_id,
    dd.document_number,
    dd.client_id,
    dd.description,
    dd.extension,
    dd.file_name,
    dd.keywords,
    dd.year,
    dd.import_date_time,
    dd.s3_key,
    1 - (dd.embedding <=> query_embedding) AS similarity
  FROM public.datev_documents dd
  WHERE dd.embedding IS NOT NULL
    AND 1 - (dd.embedding <=> query_embedding) > match_threshold
    AND (filter_client_id IS NULL OR dd.client_id = filter_client_id)
    AND (filter_year IS NULL OR dd.year = filter_year)
    AND (filter_extension IS NULL OR dd.extension = filter_extension)
    AND (filter_date_from IS NULL OR dd.import_date_time >= filter_date_from)
  ORDER BY dd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.match_datev_documents IS 'Semantic search for document metadata with type and date filtering';

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Addressees
ALTER TABLE public.datev_addressees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read datev_addressees"
  ON public.datev_addressees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage datev_addressees"
  ON public.datev_addressees
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Clients
ALTER TABLE public.datev_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read datev_clients"
  ON public.datev_clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage datev_clients"
  ON public.datev_clients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Postings
ALTER TABLE public.datev_accounting_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read datev_accounting_postings"
  ON public.datev_accounting_postings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage datev_accounting_postings"
  ON public.datev_accounting_postings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- SUSA
ALTER TABLE public.datev_susa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read datev_susa"
  ON public.datev_susa
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage datev_susa"
  ON public.datev_susa
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Documents
ALTER TABLE public.datev_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read datev_documents"
  ON public.datev_documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can manage datev_documents"
  ON public.datev_documents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Grant permissions
-- ============================================

GRANT SELECT ON public.datev_addressees TO authenticated;
GRANT SELECT ON public.datev_clients TO authenticated;
GRANT SELECT ON public.datev_accounting_postings TO authenticated;
GRANT SELECT ON public.datev_susa TO authenticated;
GRANT SELECT ON public.datev_documents TO authenticated;

GRANT ALL ON public.datev_addressees TO service_role;
GRANT ALL ON public.datev_clients TO service_role;
GRANT ALL ON public.datev_accounting_postings TO service_role;
GRANT ALL ON public.datev_susa TO service_role;
GRANT ALL ON public.datev_documents TO service_role;

GRANT EXECUTE ON FUNCTION public.match_datev_addressees TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_datev_clients TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_datev_postings TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_datev_susa TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_datev_documents TO authenticated, service_role;
