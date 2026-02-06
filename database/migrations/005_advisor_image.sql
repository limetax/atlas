-- Migration: Add image_url to advisors table
-- Description: Allows advisors to have a profile image stored in Supabase Storage

ALTER TABLE advisors ADD COLUMN image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN advisors.image_url IS 'URL to advisor profile image stored in Supabase Storage';
