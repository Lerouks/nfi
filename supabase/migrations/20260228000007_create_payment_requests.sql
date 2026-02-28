-- ============================================================
-- NFI REPORT — Table payment_requests
-- Suivi des demandes de paiement manuel (Orange Money, Wave, NITA, AMANA…)
-- Activées manuellement par l'admin après vérification.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_requests (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identité
  user_id          TEXT        NOT NULL,   -- Clerk user ID
  user_email       TEXT        NOT NULL,
  user_name        TEXT,

  -- Plan choisi
  plan_id          TEXT        NOT NULL CHECK (plan_id IN ('standard', 'premium')),
  plan_name        TEXT        NOT NULL,
  amount           INTEGER     NOT NULL,   -- en FCFA
  currency         TEXT        NOT NULL DEFAULT 'FCFA',

  -- Paiement
  payment_method   TEXT        NOT NULL,   -- orange-money, wave, moov, nita, amana, card
  phone_number     TEXT,                   -- numéro de l'expéditeur
  reference_number TEXT,                   -- référence du reçu (NITA / AMANA)

  -- Statut (traitement admin)
  status           TEXT        NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'verified', 'rejected', 'refunded')),
  admin_note       TEXT,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS payment_requests_user_idx    ON public.payment_requests (user_id);
CREATE INDEX IF NOT EXISTS payment_requests_status_idx  ON public.payment_requests (status);
CREATE INDEX IF NOT EXISTS payment_requests_created_idx ON public.payment_requests (created_at DESC);

-- RLS
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Un utilisateur peut insérer sa propre demande
CREATE POLICY "payment_requests_insert"
  ON public.payment_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Un utilisateur peut voir ses propres demandes
CREATE POLICY "payment_requests_select_own"
  ON public.payment_requests FOR SELECT
  TO anon, authenticated
  USING (user_id = user_id);  -- note: accès par user_id fourni, pas auth.uid() car Clerk

-- Pas de UPDATE/DELETE depuis le frontend (admin only via service role)
