-- ============================================================
-- NFI REPORT — À coller dans le SQL Editor de Supabase
-- Dashboard : https://supabase.com/dashboard/project/iklwebbglkldowxoikkg/sql/new
-- ============================================================

-- ─── 1. Table article_views ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.article_views (
  article_slug TEXT        PRIMARY KEY,
  views        INTEGER     NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "article_views_select_public" ON public.article_views;
CREATE POLICY "article_views_select_public"
  ON public.article_views FOR SELECT
  TO anon, authenticated
  USING (true);

-- ─── 2. RPC increment_article_views ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.increment_article_views(article_slug TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.article_views (article_slug, views, updated_at)
  VALUES (article_slug, 1, NOW())
  ON CONFLICT (article_slug)
  DO UPDATE SET
    views      = public.article_views.views + 1,
    updated_at = NOW();
$$;

GRANT EXECUTE ON FUNCTION public.increment_article_views(TEXT) TO anon, authenticated;

-- ─── 3. Table comments ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.comments (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  article_slug   TEXT        NOT NULL,
  user_id        TEXT        NOT NULL,
  author_name    TEXT        NOT NULL,
  author_avatar  TEXT,
  content        TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  likes          INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS comments_article_slug_idx
  ON public.comments (article_slug, created_at DESC);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_public"  ON public.comments;
DROP POLICY IF EXISTS "comments_insert_any"     ON public.comments;
DROP POLICY IF EXISTS "comments_update_own"     ON public.comments;
DROP POLICY IF EXISTS "comments_delete_own"     ON public.comments;

CREATE POLICY "comments_select_public"
  ON public.comments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "comments_insert_any"
  ON public.comments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "comments_update_own"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "comments_delete_own"
  ON public.comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- ─── 4. RPC increment_comment_likes ──────────────────────────────────────────

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

GRANT EXECUTE ON FUNCTION public.increment_comment_likes(UUID) TO anon, authenticated;
