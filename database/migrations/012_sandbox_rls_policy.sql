-- Add service_role RLS policy for sandbox storage bucket.
-- Migration 011 created the bucket but did not add an RLS policy.
-- Explicit policy required: Supabase Storage API does not reliably honour
-- BYPASSRLS for service_role on storage.objects tables (see migration 010).
CREATE POLICY "Allow service role access to sandbox bucket"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'sandbox')
  WITH CHECK (bucket_id = 'sandbox');
