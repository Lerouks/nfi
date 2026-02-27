-- ============================================================
-- NFI REPORT — Table contact_messages
-- Stocke les messages envoyés via le formulaire de contact
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  subject    TEXT        NOT NULL,
  message    TEXT        NOT NULL CHECK (char_length(message) BETWEEN 1 AND 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut envoyer un message (formulaire public)
CREATE POLICY "contact_messages_insert"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Aucune policy SELECT pour anon/authenticated :
-- les messages ne sont lisibles que via le dashboard Supabase (service role)
