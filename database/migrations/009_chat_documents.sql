-- ============================================
-- limetaxIQ Chat Documents Migration
-- Version: 009
-- Description: Creates chat_documents and chat_document_chunks tables for per-chat file uploads
-- Embedding Model: Supabase/gte-small (384 dimensions)
-- ============================================

-- ============================================
-- Table: chat_documents
-- Stores file metadata and processing status for uploaded chat documents
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
  error_message TEXT,
  chunk_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.chat_documents IS 'Uploaded documents attached to chat sessions with processing status';
COMMENT ON COLUMN public.chat_documents.storage_path IS 'Path in Supabase Storage bucket chat-documents';
COMMENT ON COLUMN public.chat_documents.status IS 'Processing status: processing, ready, or error';
COMMENT ON COLUMN public.chat_documents.chunk_count IS 'Number of text chunks extracted from the document';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_documents_chat_id
  ON public.chat_documents(chat_id);

CREATE INDEX IF NOT EXISTS idx_chat_documents_advisor_id
  ON public.chat_documents(advisor_id);

-- ============================================
-- Table: chat_document_chunks
-- Stores parsed text chunks with pgvector embeddings for semantic search
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.chat_documents(id) ON DELETE CASCADE,
  chat_id UUID NOT NULL,              -- Denormalized for efficient search filtering
  advisor_id UUID NOT NULL,           -- Denormalized for RLS
  content TEXT NOT NULL,
  page_number INTEGER,
  chunk_index INTEGER NOT NULL,
  embedding vector(384),              -- gte-small embedding (384 dimensions)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.chat_document_chunks IS 'Text chunks from chat documents with vector embeddings for semantic RAG search';
COMMENT ON COLUMN public.chat_document_chunks.chat_id IS 'Denormalized from chat_documents for efficient similarity search filtering';
COMMENT ON COLUMN public.chat_document_chunks.advisor_id IS 'Denormalized from chat_documents for RLS without joins';
COMMENT ON COLUMN public.chat_document_chunks.embedding IS 'Vector embedding from Supabase/gte-small model (384 dims)';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_document_chunks_embedding
  ON public.chat_document_chunks
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_chat_document_chunks_document_id
  ON public.chat_document_chunks(document_id);

CREATE INDEX IF NOT EXISTS idx_chat_document_chunks_chat_id
  ON public.chat_document_chunks(chat_id);

CREATE INDEX IF NOT EXISTS idx_chat_document_chunks_advisor_id
  ON public.chat_document_chunks(advisor_id);

-- ============================================
-- Function: match_chat_document_chunks
-- Performs semantic similarity search on chat document chunks scoped to a chat
-- ============================================
CREATE OR REPLACE FUNCTION public.match_chat_document_chunks(
  query_embedding vector(384),
  p_chat_id UUID,
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  page_number INTEGER,
  chunk_index INTEGER,
  file_name TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    chat_document_chunks.id,
    chat_document_chunks.document_id,
    chat_document_chunks.content,
    chat_document_chunks.page_number,
    chat_document_chunks.chunk_index,
    chat_documents.file_name,
    1 - (chat_document_chunks.embedding <=> query_embedding) AS similarity
  FROM public.chat_document_chunks
  INNER JOIN public.chat_documents
    ON chat_documents.id = chat_document_chunks.document_id
  WHERE chat_document_chunks.chat_id = p_chat_id
    AND 1 - (chat_document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY chat_document_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;

COMMENT ON FUNCTION public.match_chat_document_chunks IS 'Semantic search for chat document chunks scoped to a specific chat using cosine similarity';

-- ============================================
-- RLS Policies: chat_documents
-- ============================================
ALTER TABLE public.chat_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advisors can view own chat documents"
  ON public.chat_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = advisor_id);

CREATE POLICY "Advisors can insert own chat documents"
  ON public.chat_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = advisor_id);

CREATE POLICY "Advisors can delete own chat documents"
  ON public.chat_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = advisor_id);

CREATE POLICY "Service role full access to chat_documents"
  ON public.chat_documents FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- RLS Policies: chat_document_chunks
-- ============================================
ALTER TABLE public.chat_document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Advisors can view own chat document chunks"
  ON public.chat_document_chunks FOR SELECT
  TO authenticated
  USING (auth.uid() = advisor_id);

CREATE POLICY "Advisors can insert own chat document chunks"
  ON public.chat_document_chunks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = advisor_id);

CREATE POLICY "Service role full access to chat_document_chunks"
  ON public.chat_document_chunks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Grant Permissions
-- ============================================
GRANT SELECT, INSERT, DELETE ON public.chat_documents TO authenticated;
GRANT SELECT, INSERT ON public.chat_document_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_chat_document_chunks TO authenticated;

-- ============================================
-- Supabase Storage: chat-documents bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-documents',
  'chat-documents',
  false,
  10485760,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: advisors can upload files to their own folder ({advisor_id}/...)
CREATE POLICY "Advisors can upload chat documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: advisors can read their own files
CREATE POLICY "Advisors can read own chat documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: advisors can delete their own files
CREATE POLICY "Advisors can delete own chat documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
