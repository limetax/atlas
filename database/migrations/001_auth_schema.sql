-- ============================================
-- limetaxIQ Auth Schema Migration
-- Version: 001
-- Description: Creates advisories and advisors tables for multi-tenant auth
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: advisories (Kanzleien)
-- Tax advisory firms that users belong to
-- ============================================
CREATE TABLE IF NOT EXISTS public.advisories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE public.advisories IS 'Tax advisory firms (Kanzleien) - each advisor belongs to one advisory';
COMMENT ON COLUMN public.advisories.slug IS 'URL-friendly unique identifier for the advisory';

-- ============================================
-- Table: advisors (Steuerberater/Mitarbeiter)
-- Staff members linked to auth.users
-- ============================================
CREATE TABLE IF NOT EXISTS public.advisors (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  advisory_id UUID REFERENCES public.advisories(id),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON TABLE public.advisors IS 'Advisor profiles linked to Supabase auth.users';
COMMENT ON COLUMN public.advisors.id IS 'References auth.users.id - same UUID';
COMMENT ON COLUMN public.advisors.role IS 'User role within the advisory: user or admin';

-- Create index for faster lookups by advisory
CREATE INDEX IF NOT EXISTS idx_advisors_advisory_id ON public.advisors(advisory_id);

-- ============================================
-- Trigger: Auto-create advisor profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.advisors (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on advisors table
ALTER TABLE public.advisors ENABLE ROW LEVEL SECURITY;

-- Enable RLS on advisories table
ALTER TABLE public.advisories ENABLE ROW LEVEL SECURITY;

-- Policy: Advisors can view their own profile
CREATE POLICY "Advisors can view own profile"
  ON public.advisors
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Advisors can update their own profile
CREATE POLICY "Advisors can update own profile"
  ON public.advisors
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Advisors can view their own advisory
CREATE POLICY "Advisors can view own advisory"
  ON public.advisories
  FOR SELECT
  USING (
    id IN (
      SELECT advisory_id 
      FROM public.advisors 
      WHERE id = auth.uid()
    )
  );

-- ============================================
-- Future: Clients table (commented out)
-- Uncomment when implementing client portal
-- ============================================

-- CREATE TABLE IF NOT EXISTS public.clients (
--   id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
--   email TEXT,
--   full_name TEXT,
--   advisory_id UUID REFERENCES public.advisories(id),
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- COMMENT ON TABLE public.clients IS 'Client profiles (Mandanten) linked to Supabase auth.users';

-- ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Clients can view own profile"
--   ON public.clients
--   FOR SELECT
--   USING (auth.uid() = id);

-- CREATE POLICY "Advisors can view clients in their advisory"
--   ON public.clients
--   FOR SELECT
--   USING (
--     advisory_id IN (
--       SELECT advisory_id 
--       FROM public.advisors 
--       WHERE id = auth.uid()
--     )
--   );

-- ============================================
-- Seed data for testing (optional)
-- Run this manually in Supabase SQL Editor
-- ============================================

-- INSERT INTO public.advisories (name, slug) VALUES
--   ('limetax Demo Kanzlei', 'limetax-demo');

-- Note: To create a test user:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" and create with email/password
-- 3. The trigger will auto-create the advisor profile
-- 4. Then update the advisor to assign to an advisory:
--    UPDATE public.advisors 
--    SET advisory_id = (SELECT id FROM public.advisories WHERE slug = 'limetax-demo')
--    WHERE email = 'test@limetax.de';
