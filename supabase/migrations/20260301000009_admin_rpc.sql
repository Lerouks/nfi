-- ============================================================
-- NFI REPORT — Fonctions RPC admin (SECURITY DEFINER)
-- Ces fonctions bypassent le RLS et tournent avec les droits
-- du propriétaire de la base — utilisables avec la clé anon.
-- ============================================================

-- ─── 1. Mise à jour d'un abonnement ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_update_subscription(
  p_user_id   TEXT,
  p_tier      TEXT,
  p_status    TEXT,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
     SET subscription_tier       = p_tier,
         subscription_status     = p_status,
         subscription_expires_at = p_expires_at,
         updated_at              = NOW()
   WHERE id = p_user_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_subscription(TEXT, TEXT, TEXT, TIMESTAMPTZ) TO anon, authenticated;

-- ─── 2. Mise à jour d'une demande de paiement ────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_update_payment_request(
  p_id         UUID,
  p_status     TEXT,
  p_admin_note TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.payment_requests
     SET status     = p_status,
         admin_note = p_admin_note,
         updated_at = NOW()
   WHERE id = p_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_payment_request(UUID, TEXT, TEXT) TO anon, authenticated;

-- ─── 3. Récupérer tous les profils (admin) ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_get_all_profiles()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT * FROM public.profiles
     ORDER BY created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_all_profiles() TO anon, authenticated;

-- ─── 4. Recherche de profils par email (admin) ───────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_search_profiles(p_email TEXT)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT * FROM public.profiles
     WHERE email ILIKE '%' || p_email || '%'
     ORDER BY created_at DESC
     LIMIT 50;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_search_profiles(TEXT) TO anon, authenticated;
