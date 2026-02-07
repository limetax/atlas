-- ============================================
-- limetaxIQ Law Publisher Documents Migration
-- Version: 007
-- Description: Creates law_publisher_documents table with vector embeddings for legal content
-- Embedding Model: Supabase/gte-small (384 dimensions)
-- Content Types: Case law, legal commentaries, legal articles
-- ============================================

-- pgvector extension already enabled in migration 002

-- ============================================
-- Table: law_publisher_documents
-- Stores legal publisher content with embeddings for RAG
-- ============================================
CREATE TABLE IF NOT EXISTS public.law_publisher_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core identification
  title TEXT NOT NULL,
  citation TEXT,                    -- e.g., "BFH IV R 10/20", "Kommentar § 15 EStG"

  -- Document classification
  document_type TEXT NOT NULL,      -- 'case_law', 'commentary', 'article'

  -- Content
  content TEXT NOT NULL,            -- Full text or relevant excerpt
  summary TEXT,                     -- Optional summary for long documents

  -- Publisher metadata
  publisher TEXT,                   -- e.g., "Beck", "Haufe", "NWB"
  source TEXT,                      -- Specific publication name

  -- Legal reference metadata
  law_reference TEXT,               -- Referenced law (e.g., "§ 15 EStG", "§ 8c KStG")

  -- Case law specific fields (NULL for other types)
  court TEXT,                       -- e.g., "BFH", "BVerfG", "FG München"
  case_number TEXT,                 -- e.g., "IV R 10/20"
  decision_date DATE,               -- Date of court decision

  -- Publication metadata
  publication_date DATE,            -- When article/commentary was published
  author TEXT,                      -- Author(s) of commentary/article

  -- Tags for categorization
  tags TEXT[],                      -- e.g., ['Körperschaftsteuer', 'Verlustabzug']

  -- Vector embedding
  embedding vector(384),            -- gte-small embedding (384 dimensions)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.law_publisher_documents IS 'Legal publisher content (case law, commentaries, articles) with vector embeddings for RAG';
COMMENT ON COLUMN public.law_publisher_documents.document_type IS 'Type: case_law, commentary, or article';
COMMENT ON COLUMN public.law_publisher_documents.citation IS 'Formal citation reference';
COMMENT ON COLUMN public.law_publisher_documents.court IS 'Court name for case law (NULL for commentaries/articles)';
COMMENT ON COLUMN public.law_publisher_documents.law_reference IS 'Referenced tax law paragraph(s)';
COMMENT ON COLUMN public.law_publisher_documents.embedding IS 'Vector embedding from Supabase/gte-small model (384 dims)';

-- Create index for fast similarity search (HNSW for performance)
CREATE INDEX IF NOT EXISTS idx_law_publisher_documents_embedding
  ON public.law_publisher_documents
  USING hnsw (embedding vector_cosine_ops);

-- Create indexes for filtering and searching
CREATE INDEX IF NOT EXISTS idx_law_publisher_documents_document_type
  ON public.law_publisher_documents(document_type);

CREATE INDEX IF NOT EXISTS idx_law_publisher_documents_publisher
  ON public.law_publisher_documents(publisher);

CREATE INDEX IF NOT EXISTS idx_law_publisher_documents_court
  ON public.law_publisher_documents(court)
  WHERE court IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_law_publisher_documents_law_reference
  ON public.law_publisher_documents(law_reference);

CREATE INDEX IF NOT EXISTS idx_law_publisher_documents_decision_date
  ON public.law_publisher_documents(decision_date)
  WHERE decision_date IS NOT NULL;

-- GIN index for tag array searches
CREATE INDEX IF NOT EXISTS idx_law_publisher_documents_tags
  ON public.law_publisher_documents USING gin(tags);

-- ============================================
-- Function: match_law_publisher_documents
-- Performs semantic similarity search on legal publisher content
-- ============================================
CREATE OR REPLACE FUNCTION public.match_law_publisher_documents(
  query_embedding vector(384),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  citation TEXT,
  document_type TEXT,
  content TEXT,
  summary TEXT,
  publisher TEXT,
  source TEXT,
  law_reference TEXT,
  court TEXT,
  case_number TEXT,
  decision_date DATE,
  publication_date DATE,
  author TEXT,
  tags TEXT[],
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    law_publisher_documents.id,
    law_publisher_documents.title,
    law_publisher_documents.citation,
    law_publisher_documents.document_type,
    law_publisher_documents.content,
    law_publisher_documents.summary,
    law_publisher_documents.publisher,
    law_publisher_documents.source,
    law_publisher_documents.law_reference,
    law_publisher_documents.court,
    law_publisher_documents.case_number,
    law_publisher_documents.decision_date,
    law_publisher_documents.publication_date,
    law_publisher_documents.author,
    law_publisher_documents.tags,
    1 - (law_publisher_documents.embedding <=> query_embedding) AS similarity
  FROM public.law_publisher_documents
  WHERE 1 - (law_publisher_documents.embedding <=> query_embedding) > match_threshold
  ORDER BY law_publisher_documents.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON FUNCTION public.match_law_publisher_documents IS 'Semantic search for legal publisher documents using cosine similarity';

-- ============================================
-- RLS Policies (law publisher documents are public read)
-- ============================================
ALTER TABLE public.law_publisher_documents ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read law publisher documents
CREATE POLICY "Law publisher documents are readable by authenticated users"
  ON public.law_publisher_documents
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to insert/update (for data ingestion)
CREATE POLICY "Service role can manage law publisher documents"
  ON public.law_publisher_documents
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT ON public.law_publisher_documents TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_law_publisher_documents TO authenticated;
