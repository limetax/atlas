-- ============================================
-- Document Management Migration
-- Version: 010
-- Description: Promotes documents from chat-scoped to advisory-scoped entities.
--   Renames chat_documents → documents, chat_document_chunks → document_chunks.
--   Creates chat_documents join table for chat-document linking.
--   New Supabase Storage bucket "documents" with advisory-scoped paths.
-- ============================================

BEGIN;

-- ============================================
-- Step 1: Drop old RLS policies (reference old table names / columns)
-- ============================================

-- chat_documents policies
DROP POLICY IF EXISTS "Advisors can view own chat documents" ON public.chat_documents;
DROP POLICY IF EXISTS "Advisors can insert own chat documents" ON public.chat_documents;
DROP POLICY IF EXISTS "Advisors can delete own chat documents" ON public.chat_documents;
DROP POLICY IF EXISTS "Service role full access to chat_documents" ON public.chat_documents;

-- chat_document_chunks policies
DROP POLICY IF EXISTS "Advisors can view own chat document chunks" ON public.chat_document_chunks;
DROP POLICY IF EXISTS "Advisors can insert own chat document chunks" ON public.chat_document_chunks;
DROP POLICY IF EXISTS "Service role full access to chat_document_chunks" ON public.chat_document_chunks;

-- Revoke old grants
REVOKE SELECT, INSERT, DELETE ON public.chat_documents FROM authenticated;
REVOKE SELECT, INSERT ON public.chat_document_chunks FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.match_chat_document_chunks FROM authenticated;

-- ============================================
-- Step 2: Drop old function
-- ============================================
DROP FUNCTION IF EXISTS public.match_chat_document_chunks;

-- ============================================
-- Step 3: Drop old indexes (before table rename to avoid naming conflicts)
-- ============================================
DROP INDEX IF EXISTS public.idx_chat_documents_chat_id;
DROP INDEX IF EXISTS public.idx_chat_documents_advisor_id;
DROP INDEX IF EXISTS public.idx_chat_document_chunks_document_id;
DROP INDEX IF EXISTS public.idx_chat_document_chunks_chat_id;
DROP INDEX IF EXISTS public.idx_chat_document_chunks_advisor_id;
-- Keep the HNSW embedding index — it will follow the table rename

-- ============================================
-- Step 4: Rename tables
-- ============================================
ALTER TABLE public.chat_documents RENAME TO documents;
ALTER TABLE public.chat_document_chunks RENAME TO document_chunks;

-- ============================================
-- Step 5: Rename columns on documents
-- ============================================
ALTER TABLE public.documents RENAME COLUMN file_name TO name;
ALTER TABLE public.documents RENAME COLUMN file_size TO size_bytes;
ALTER TABLE public.documents RENAME COLUMN advisor_id TO uploaded_by;

-- Change size_bytes from INTEGER to BIGINT
ALTER TABLE public.documents ALTER COLUMN size_bytes TYPE BIGINT;

-- ============================================
-- Step 6: Add new columns to documents
-- ============================================

-- advisory_id: temporary default, populated in Step 7
ALTER TABLE public.documents
  ADD COLUMN advisory_id UUID;

ALTER TABLE public.documents
  ADD COLUMN client_id UUID;

ALTER TABLE public.documents
  ADD COLUMN mime_type TEXT NOT NULL DEFAULT 'application/pdf';

ALTER TABLE public.documents
  ADD COLUMN source TEXT NOT NULL DEFAULT 'limetaxos';

ALTER TABLE public.documents
  ADD COLUMN datev_document_id TEXT;

-- Add CHECK constraint for source
ALTER TABLE public.documents
  ADD CONSTRAINT documents_source_check
  CHECK (source IN ('limetaxos', 'datev'));

-- ============================================
-- Step 7: Populate advisory_id from advisor's advisory
-- ============================================
UPDATE public.documents d
SET advisory_id = a.advisory_id
FROM public.advisors a
WHERE d.uploaded_by = a.id;

-- Now make advisory_id NOT NULL
ALTER TABLE public.documents ALTER COLUMN advisory_id SET NOT NULL;

-- ============================================
-- Step 8: Add foreign key constraints for new columns
-- ============================================
ALTER TABLE public.documents
  ADD CONSTRAINT documents_advisory_id_fkey
  FOREIGN KEY (advisory_id) REFERENCES public.advisories(id);

ALTER TABLE public.documents
  ADD CONSTRAINT documents_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES public.datev_clients(id);

-- The uploaded_by FK already exists (was advisor_id → auth.users(id) ON DELETE CASCADE)

-- ============================================
-- Step 9: Create chat_documents join table
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(chat_id, document_id)
);

COMMENT ON TABLE public.chat_documents IS 'Join table linking documents to chat sessions for RAG context';

-- Populate join table from existing chat_id on documents
INSERT INTO public.chat_documents (chat_id, document_id)
SELECT chat_id, id FROM public.documents WHERE chat_id IS NOT NULL;

-- ============================================
-- Step 10: Drop chat_id from documents (now in join table)
-- ============================================

-- Drop the FK constraint first (named by postgres during original CREATE TABLE)
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS chat_documents_chat_id_fkey;
ALTER TABLE public.documents DROP COLUMN chat_id;

-- ============================================
-- Step 11: Migrate document_chunks — replace chat_id + advisor_id with advisory_id
-- ============================================
ALTER TABLE public.document_chunks ADD COLUMN advisory_id UUID;

UPDATE public.document_chunks dc
SET advisory_id = d.advisory_id
FROM public.documents d
WHERE dc.document_id = d.id;

ALTER TABLE public.document_chunks ALTER COLUMN advisory_id SET NOT NULL;

-- Drop old denormalized columns
ALTER TABLE public.document_chunks DROP COLUMN chat_id;
ALTER TABLE public.document_chunks DROP COLUMN advisor_id;

-- ============================================
-- Step 12: Create new indexes
-- ============================================

-- documents
CREATE INDEX idx_documents_advisory_id ON public.documents(advisory_id);
CREATE INDEX idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX idx_documents_client_id ON public.documents(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_documents_created_at ON public.documents(created_at DESC);

-- document_chunks
CREATE INDEX idx_document_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX idx_document_chunks_advisory_id ON public.document_chunks(advisory_id);

-- chat_documents join table
CREATE INDEX idx_chat_documents_chat_id ON public.chat_documents(chat_id);
CREATE INDEX idx_chat_documents_document_id ON public.chat_documents(document_id);

-- ============================================
-- Step 13: Update table comments
-- ============================================
COMMENT ON TABLE public.documents IS 'Advisory-scoped document library — source of truth for all uploaded files';
COMMENT ON COLUMN public.documents.advisory_id IS 'The advisory (Kanzlei) this document belongs to';
COMMENT ON COLUMN public.documents.client_id IS 'Optional client association — null means advisory-wide';
COMMENT ON COLUMN public.documents.uploaded_by IS 'The advisor (auth.users.id) who uploaded this document';
COMMENT ON COLUMN public.documents.storage_path IS 'Path in Supabase Storage bucket';
COMMENT ON COLUMN public.documents.source IS 'Document origin: limetaxos (uploaded) or datev (DMS integration)';
COMMENT ON COLUMN public.documents.datev_document_id IS 'Reserved for DATEV DMS integration (TEC-117)';
COMMENT ON COLUMN public.documents.mime_type IS 'MIME type of the document (application/pdf, image/jpeg, etc.)';
COMMENT ON COLUMN public.documents.status IS 'Processing status: processing, ready, or error';
COMMENT ON COLUMN public.documents.chunk_count IS 'Number of text chunks extracted from the document';

COMMENT ON TABLE public.document_chunks IS 'Text chunks from documents with vector embeddings for semantic RAG search';
COMMENT ON COLUMN public.document_chunks.advisory_id IS 'Advisory scope for RLS — denormalized from documents table';
COMMENT ON COLUMN public.document_chunks.embedding IS 'Vector embedding from Supabase/gte-small model (384 dims)';

-- ============================================
-- Step 14: New RPC function — match_document_chunks
-- Searches by document IDs instead of chat ID
-- ============================================
CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding vector(384),
  p_document_ids UUID[],
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  page_number INTEGER,
  chunk_index INTEGER,
  document_name TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    document_chunks.page_number,
    document_chunks.chunk_index,
    documents.name AS document_name,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks
  INNER JOIN public.documents
    ON documents.id = document_chunks.document_id
  WHERE document_chunks.document_id = ANY(p_document_ids)
    AND 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON FUNCTION public.match_document_chunks IS 'Semantic search for document chunks scoped to specific document IDs using cosine similarity';

-- ============================================
-- Step 15: RLS policies — documents (advisory-scoped)
-- ============================================
-- RLS is already enabled from the rename (was enabled on chat_documents)

CREATE POLICY "Advisors can view documents in own advisory"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    advisory_id IN (
      SELECT advisory_id FROM public.advisors WHERE id = auth.uid()
    )
  );

CREATE POLICY "Advisors can insert documents in own advisory"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (
    advisory_id IN (
      SELECT advisory_id FROM public.advisors WHERE id = auth.uid()
    )
  );

CREATE POLICY "Advisors can update documents in own advisory"
  ON public.documents FOR UPDATE
  TO authenticated
  USING (
    advisory_id IN (
      SELECT advisory_id FROM public.advisors WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    advisory_id IN (
      SELECT advisory_id FROM public.advisors WHERE id = auth.uid()
    )
  );

CREATE POLICY "Advisors can delete own documents"
  ON public.documents FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Service role full access to documents"
  ON public.documents FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Step 16: RLS policies — document_chunks (advisory-scoped)
-- ============================================
-- RLS is already enabled from the rename

CREATE POLICY "Advisors can view document chunks in own advisory"
  ON public.document_chunks FOR SELECT
  TO authenticated
  USING (
    advisory_id IN (
      SELECT advisory_id FROM public.advisors WHERE id = auth.uid()
    )
  );

CREATE POLICY "Advisors can insert document chunks in own advisory"
  ON public.document_chunks FOR INSERT
  TO authenticated
  WITH CHECK (
    advisory_id IN (
      SELECT advisory_id FROM public.advisors WHERE id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to document_chunks"
  ON public.document_chunks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Step 17: RLS policies — chat_documents join table
-- ============================================
ALTER TABLE public.chat_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advisors can view own chat document links"
  ON public.chat_documents FOR SELECT
  TO authenticated
  USING (
    chat_id IN (
      SELECT id FROM public.chats WHERE advisor_id = auth.uid()
    )
  );

CREATE POLICY "Advisors can insert chat document links"
  ON public.chat_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    chat_id IN (
      SELECT id FROM public.chats WHERE advisor_id = auth.uid()
    )
  );

CREATE POLICY "Advisors can delete chat document links"
  ON public.chat_documents FOR DELETE
  TO authenticated
  USING (
    chat_id IN (
      SELECT id FROM public.chats WHERE advisor_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to chat_documents"
  ON public.chat_documents FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Step 18: Grant permissions
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT SELECT, INSERT ON public.document_chunks TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.chat_documents TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_document_chunks TO authenticated;

-- ============================================
-- Step 19: New Supabase Storage bucket — documents
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: only the service role (backend API) can access documents storage.
-- All client access is proxied through the API, which validates advisory membership.
-- Explicit service_role policy is required because Supabase's storage API does not
-- reliably honour BYPASSRLS for service_role — a matching policy is needed.
CREATE POLICY "Allow service role access to documents bucket"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');

COMMIT;
