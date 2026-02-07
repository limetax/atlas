-- ============================================
-- Migration: Add client_id filter to match_datev_addressees
-- Purpose: Enable client-specific filtering for addressee searches
-- ============================================

-- Drop existing function first (PostgreSQL requires explicit drop when changing parameters)
DROP FUNCTION IF EXISTS public.match_datev_addressees;

-- Update match_datev_addressees function to support client filtering
CREATE OR REPLACE FUNCTION public.match_datev_addressees(
  query_embedding vector(384),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5,
  filter_addressee_type INT DEFAULT NULL,
  filter_is_legal_representative INT DEFAULT NULL,
  filter_client_id TEXT DEFAULT NULL
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
    AND (filter_client_id IS NULL OR da.addressee_id IN (
      SELECT natural_person_id FROM public.datev_clients WHERE client_id = filter_client_id
      UNION
      SELECT legal_person_id FROM public.datev_clients WHERE client_id = filter_client_id
    ))
  ORDER BY da.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.match_datev_addressees IS 'Semantic search for addressees with optional type, role, and client filtering';
