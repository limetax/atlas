-- ============================================
-- limetaxIQ DATEV Data Migration
-- Version: 003
-- Description: Creates tables for DATEV clients and orders with vector embeddings
-- Embedding Model: Supabase/gte-small (384 dimensions)
-- ============================================

-- Note: pgvector extension should already be enabled from migration 002
-- CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- Table: datev_clients
-- Stores DATEV client (Mandant) data with embeddings for RAG
-- ============================================
CREATE TABLE IF NOT EXISTS public.datev_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL UNIQUE,           -- DATEV MandantenId (UUID as string)
  client_number INTEGER NOT NULL,           -- Mandantennummer
  client_name TEXT NOT NULL,                -- Mandantenname
  differing_name TEXT,                      -- MandantennameAbw
  client_type INTEGER NOT NULL,             -- 1=Natural Person, 2=Individual Enterprise, 3=Legal Person
  client_status TEXT NOT NULL,              -- "0"=Inactive, "1"=Active
  company_form TEXT,                        -- e.g., "GmbH", "AG"
  industry_description TEXT,                -- Industry/sector description
  main_email TEXT,                          -- Primary email
  main_phone TEXT,                          -- Primary phone
  correspondence_street TEXT,               -- Street address
  correspondence_city TEXT,                 -- City
  correspondence_zip_code TEXT,             -- ZIP code
  tax_number_vat TEXT,                      -- VAT tax number
  embedding_text TEXT NOT NULL,             -- Text used for embedding generation
  embedding vector(384),                    -- gte-small embedding (384 dimensions)
  synced_at TIMESTAMPTZ DEFAULT NOW(),      -- Last sync timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.datev_clients IS 'DATEV client (Mandant) data with vector embeddings for semantic RAG search';
COMMENT ON COLUMN public.datev_clients.client_id IS 'DATEV MandantenId (UUID)';
COMMENT ON COLUMN public.datev_clients.embedding_text IS 'Pre-computed text used for embedding generation';

-- Create HNSW index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_datev_clients_embedding 
  ON public.datev_clients 
  USING hnsw (embedding vector_cosine_ops);

-- Create index for client_number lookups
CREATE INDEX IF NOT EXISTS idx_datev_clients_number 
  ON public.datev_clients (client_number);

-- Create index for client_name text search
CREATE INDEX IF NOT EXISTS idx_datev_clients_name 
  ON public.datev_clients USING gin (to_tsvector('german', client_name));

-- ============================================
-- Table: datev_orders
-- Stores DATEV order (Auftrag) data with embeddings for RAG
-- Includes denormalized client_name for semantic search
-- ============================================
CREATE TABLE IF NOT EXISTS public.datev_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id INTEGER NOT NULL,                -- DATEV order ID
  creation_year INTEGER NOT NULL,           -- Anlagejahr
  order_number INTEGER NOT NULL,            -- Auftragsnummer
  order_name TEXT NOT NULL,                 -- Gesamtauftrag Bezeichnung
  ordertype TEXT NOT NULL,                  -- Auftragsart Kurzbezeichnung
  ordertype_group TEXT,                     -- Auftragsartengruppe
  assessment_year INTEGER,                  -- Veranlagungsjahr
  fiscal_year INTEGER,                      -- Wirtschaftsjahr
  client_id TEXT NOT NULL,                  -- DATEV MandantenId (FK reference)
  client_name TEXT NOT NULL,                -- Denormalized for RAG context
  completion_status TEXT NOT NULL,          -- Processing status
  billing_status TEXT NOT NULL,             -- Billing status
  date_completion_status TIMESTAMPTZ,       -- Status change date
  date_billing_status TIMESTAMPTZ,          -- Billing status change date
  embedding_text TEXT NOT NULL,             -- Text used for embedding generation
  embedding vector(384),                    -- gte-small embedding (384 dimensions)
  synced_at TIMESTAMPTZ DEFAULT NOW(),      -- Last sync timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creation_year, order_number)       -- Composite unique key
);

-- Add comments for documentation
COMMENT ON TABLE public.datev_orders IS 'DATEV order (Auftrag) data with vector embeddings for semantic RAG search';
COMMENT ON COLUMN public.datev_orders.client_name IS 'Denormalized client name for RAG context - allows semantic search to associate orders with clients';
COMMENT ON COLUMN public.datev_orders.embedding_text IS 'Pre-computed text used for embedding generation';

-- Create HNSW index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_datev_orders_embedding 
  ON public.datev_orders 
  USING hnsw (embedding vector_cosine_ops);

-- Create index for year filtering
CREATE INDEX IF NOT EXISTS idx_datev_orders_year 
  ON public.datev_orders (creation_year);

-- Create index for client_id lookups
CREATE INDEX IF NOT EXISTS idx_datev_orders_client 
  ON public.datev_orders (client_id);

-- Create index for order_name text search
CREATE INDEX IF NOT EXISTS idx_datev_orders_name 
  ON public.datev_orders USING gin (to_tsvector('german', order_name));

-- ============================================
-- Function: match_datev_clients
-- Performs semantic similarity search on DATEV clients
-- ============================================
CREATE OR REPLACE FUNCTION public.match_datev_clients(
  query_embedding vector(384),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  client_id TEXT,
  client_number INTEGER,
  client_name TEXT,
  client_type INTEGER,
  company_form TEXT,
  industry_description TEXT,
  main_email TEXT,
  correspondence_city TEXT,
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
    dc.company_form,
    dc.industry_description,
    dc.main_email,
    dc.correspondence_city,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.datev_clients dc
  WHERE dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.match_datev_clients IS 'Semantic similarity search for DATEV clients using cosine distance';

-- ============================================
-- Function: match_datev_orders
-- Performs semantic similarity search on DATEV orders
-- ============================================
CREATE OR REPLACE FUNCTION public.match_datev_orders(
  query_embedding vector(384),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  order_id INTEGER,
  creation_year INTEGER,
  order_number INTEGER,
  order_name TEXT,
  ordertype TEXT,
  client_id TEXT,
  client_name TEXT,
  completion_status TEXT,
  billing_status TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    do_table.id,
    do_table.order_id,
    do_table.creation_year,
    do_table.order_number,
    do_table.order_name,
    do_table.ordertype,
    do_table.client_id,
    do_table.client_name,
    do_table.completion_status,
    do_table.billing_status,
    1 - (do_table.embedding <=> query_embedding) AS similarity
  FROM public.datev_orders do_table
  WHERE do_table.embedding IS NOT NULL
    AND 1 - (do_table.embedding <=> query_embedding) > match_threshold
  ORDER BY do_table.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.match_datev_orders IS 'Semantic similarity search for DATEV orders using cosine distance';

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on datev_clients
ALTER TABLE public.datev_clients ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all clients
CREATE POLICY "Authenticated users can read datev_clients"
  ON public.datev_clients
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Service role can manage all clients (for sync operations)
CREATE POLICY "Service role can manage datev_clients"
  ON public.datev_clients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on datev_orders
ALTER TABLE public.datev_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all orders
CREATE POLICY "Authenticated users can read datev_orders"
  ON public.datev_orders
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Service role can manage all orders (for sync operations)
CREATE POLICY "Service role can manage datev_orders"
  ON public.datev_orders
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Grant permissions
-- ============================================
GRANT SELECT ON public.datev_clients TO authenticated;
GRANT SELECT ON public.datev_orders TO authenticated;
GRANT ALL ON public.datev_clients TO service_role;
GRANT ALL ON public.datev_orders TO service_role;
GRANT EXECUTE ON FUNCTION public.match_datev_clients TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_datev_orders TO authenticated, service_role;
