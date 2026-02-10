-- ============================================
-- limetaxIQ Chat Persistence Migration
-- Version: 008
-- Description: Creates chats and chat_messages tables for server-side chat storage
-- ============================================

-- ============================================
-- Table: chats
-- Stores chat sessions linked to advisors
-- ============================================
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Neuer Chat',
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.chats IS 'Chat sessions belonging to advisors';
COMMENT ON COLUMN public.chats.advisor_id IS 'References auth.users.id — the advisor who owns this chat';
COMMENT ON COLUMN public.chats.context IS 'Chat context: research sources, integration type, mandant selection';

-- Indexes
CREATE INDEX idx_chats_advisor_id ON public.chats(advisor_id);
CREATE INDEX idx_chats_advisor_updated ON public.chats(advisor_id, updated_at DESC);

-- ============================================
-- Table: chat_messages
-- Stores individual messages within a chat
-- ============================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.chat_messages IS 'Messages within a chat session';
COMMENT ON COLUMN public.chat_messages.role IS 'Message author: user or assistant';
COMMENT ON COLUMN public.chat_messages.metadata IS 'Message metadata: tool_calls used by assistant';

-- Indexes
CREATE INDEX idx_chat_messages_chat_id ON public.chat_messages(chat_id);
CREATE INDEX idx_chat_messages_chat_created ON public.chat_messages(chat_id, created_at ASC);

-- ============================================
-- Trigger: Auto-update updated_at on chats when a message is inserted
-- ============================================
CREATE OR REPLACE FUNCTION public.update_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chats SET updated_at = NOW() WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_chat_message_inserted
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE PROCEDURE public.update_chat_updated_at();

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Advisors can only access their own chats
CREATE POLICY "Advisors can view own chats"
  ON public.chats FOR SELECT
  TO authenticated
  USING (auth.uid() = advisor_id);

CREATE POLICY "Advisors can insert own chats"
  ON public.chats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = advisor_id);

CREATE POLICY "Advisors can update own chats"
  ON public.chats FOR UPDATE
  TO authenticated
  USING (auth.uid() = advisor_id);

CREATE POLICY "Advisors can delete own chats"
  ON public.chats FOR DELETE
  TO authenticated
  USING (auth.uid() = advisor_id);

-- Messages: advisors can only access messages in their own chats
CREATE POLICY "Advisors can view messages in own chats"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    chat_id IN (SELECT id FROM public.chats WHERE advisor_id = auth.uid())
  );

CREATE POLICY "Advisors can insert messages in own chats"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    chat_id IN (SELECT id FROM public.chats WHERE advisor_id = auth.uid())
  );

-- Service role can do everything (for backend with service role key)
CREATE POLICY "Service role full access to chats"
  ON public.chats FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to chat_messages"
  ON public.chat_messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chats TO authenticated;
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
