-- ============================================================
-- NFI REPORT — Table comments
-- Commentaires des utilisateurs sur les articles
-- ============================================================

CREATE TABLE IF NOT EXISTS public.comments (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  article_slug   TEXT        NOT NULL,
  user_id        TEXT        NOT NULL,   -- Clerk user ID (ex: user_xxxx)
  author_name    TEXT        NOT NULL,
  author_avatar  TEXT,
  content        TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  likes          INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour accélérer les requêtes par article
CREATE INDEX IF NOT EXISTS comments_article_slug_idx
  ON public.comments (article_slug, created_at DESC);

-- Activer RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les commentaires
CREATE POLICY "comments_select_public"
  ON public.comments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Tout utilisateur (même anonyme via Clerk) peut insérer un commentaire
-- La vérification d'identité est gérée côté app via Clerk
CREATE POLICY "comments_insert_any"
  ON public.comments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Un utilisateur ne peut modifier que ses propres commentaires
CREATE POLICY "comments_update_own"
  ON public.comments
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

-- Un utilisateur ne peut supprimer que ses propres commentaires
CREATE POLICY "comments_delete_own"
  ON public.comments
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()::text));

-- ─── RPC : incrémenter les likes d'un commentaire ─────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_comment_likes(comment_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.comments
  SET likes = likes + 1
  WHERE id = comment_id;
$$;

-- Autoriser les anonymes à liker
GRANT EXECUTE ON FUNCTION public.increment_comment_likes(UUID) TO anon, authenticated;
