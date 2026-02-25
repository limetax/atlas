-- Create sandbox storage bucket for demo fixtures
INSERT INTO storage.buckets (id, name, public)
VALUES ('sandbox', 'sandbox', false)
ON CONFLICT (id) DO NOTHING;
