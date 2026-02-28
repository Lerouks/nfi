-- ============================================================
-- NFI REPORT — Table newsletters
-- Gestion des inscriptions newsletter avec segmentation par tier
-- ============================================================

CREATE TABLE IF NOT EXISTS public.newsletters (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT        NOT NULL UNIQUE,
  plan_tier      TEXT        NOT NULL DEFAULT 'free'
                 CHECK (plan_tier IN ('free', 'standard', 'premium')),
  is_active      BOOLEAN     NOT NULL DEFAULT true,
  subscribed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS newsletters_email_idx    ON public.newsletters (email);
CREATE INDEX IF NOT EXISTS newsletters_tier_idx     ON public.newsletters (plan_tier) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS newsletters_active_idx   ON public.newsletters (is_active);

ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut s'inscrire (upsert public)
CREATE POLICY "newsletters_insert_public"
  ON public.newsletters FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Mise à jour par email (pour désabonnement ou changement de tier)
CREATE POLICY "newsletters_update_public"
  ON public.newsletters FOR UPDATE
  TO anon, authenticated
  USING (true);

-- Lecture non exposée au public (admin seulement via service role)
-- (pas de SELECT policy pour anon/authenticated)
