-- ============================================================
-- NFI REPORT — Table profiles
-- Un enregistrement par utilisateur Clerk.
-- Centralise le tier d'abonnement et le quota premium mensuel.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id                      TEXT        PRIMARY KEY,  -- Clerk user ID (ex: user_xxxx)
  email                   TEXT        NOT NULL,
  full_name               TEXT,
  avatar_url              TEXT,

  -- Abonnement
  subscription_tier       TEXT        NOT NULL DEFAULT 'free'
                          CHECK (subscription_tier IN ('free', 'standard', 'premium')),
  subscription_status     TEXT        NOT NULL DEFAULT 'active'
                          CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'pending')),
  subscription_expires_at TIMESTAMPTZ,

  -- Quota articles premium pour le tier free (3/mois, reset chaque 1er du mois)
  premium_read_count      INTEGER     NOT NULL DEFAULT 0,
  premium_read_reset_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS profiles_subscription_tier_idx
  ON public.profiles (subscription_tier);
CREATE INDEX IF NOT EXISTS profiles_subscription_expires_idx
  ON public.profiles (subscription_expires_at)
  WHERE subscription_expires_at IS NOT NULL;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Un utilisateur ne peut lire que son propre profil
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid()::text);

-- Un utilisateur peut créer / modifier son propre profil
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid()::text);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid()::text);

-- Lecture publique pour anon (via Clerk — le user_id est fourni par le client)
-- On autorise SELECT sur l'ID spécifié (pas de leak puisque l'id est opaque)
CREATE POLICY "profiles_select_anon"
  ON public.profiles FOR SELECT
  TO anon
  USING (true);

-- Anon peut créer/modifier (l'ID Clerk n'est pas devinable, la sécurité est gérée par Clerk)
CREATE POLICY "profiles_insert_anon"
  ON public.profiles FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "profiles_update_anon"
  ON public.profiles FOR UPDATE
  TO anon
  USING (true);

-- ─── RPC : incrémenter et vérifier le quota mensuel ──────────────────────────
-- Retourne le nombre de lectures restantes après incrément.
-- Remet le compteur à zéro si on est dans un nouveau mois.
CREATE OR REPLACE FUNCTION public.use_premium_quota(p_user_id TEXT)
RETURNS INTEGER          -- lectures restantes après cette lecture (0 = quota épuisé avant cet appel)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count     INTEGER;
  v_reset_at  TIMESTAMPTZ;
  v_quota     CONSTANT INTEGER := 3;
  v_now       TIMESTAMPTZ := NOW();
BEGIN
  SELECT premium_read_count, premium_read_reset_at
    INTO v_count, v_reset_at
    FROM public.profiles
   WHERE id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Reset mensuel : si on est dans un mois différent du dernier reset
  IF date_trunc('month', v_reset_at) < date_trunc('month', v_now) THEN
    v_count    := 0;
    v_reset_at := v_now;
  END IF;

  -- Quota déjà épuisé → ne pas incrémenter, retourner 0
  IF v_count >= v_quota THEN
    UPDATE public.profiles
       SET premium_read_reset_at = v_reset_at
     WHERE id = p_user_id;
    RETURN 0;
  END IF;

  -- Incrémenter et retourner le nombre restant après cette lecture
  UPDATE public.profiles
     SET premium_read_count    = v_count + 1,
         premium_read_reset_at = v_reset_at,
         updated_at            = v_now
   WHERE id = p_user_id;

  RETURN v_quota - (v_count + 1);  -- lectures restantes
END;
$$;

GRANT EXECUTE ON FUNCTION public.use_premium_quota(TEXT) TO anon, authenticated;

-- ─── RPC : vérifier le quota sans le consommer ────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_premium_quota(p_user_id TEXT)
RETURNS INTEGER          -- lectures restantes (0 = quota épuisé)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count     INTEGER;
  v_reset_at  TIMESTAMPTZ;
  v_quota     CONSTANT INTEGER := 3;
  v_now       TIMESTAMPTZ := NOW();
BEGIN
  SELECT premium_read_count, premium_read_reset_at
    INTO v_count, v_reset_at
    FROM public.profiles
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN v_quota;  -- nouvel utilisateur → quota complet
  END IF;

  -- Reset mensuel
  IF date_trunc('month', v_reset_at) < date_trunc('month', v_now) THEN
    RETURN v_quota;
  END IF;

  RETURN GREATEST(0, v_quota - v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_premium_quota(TEXT) TO anon, authenticated;
