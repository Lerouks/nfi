-- ============================================================
-- NFI REPORT — Table article_views
-- Stocke le nombre de vues réel par article (slug Sanity)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.article_views (
  article_slug TEXT PRIMARY KEY,
  views        INTEGER NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les vues (public)
CREATE POLICY "article_views_select_public"
  ON public.article_views
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ─── RPC : incrémenter les vues (upsert atomic) ───────────────────────────────
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

-- Autoriser les anonymes à appeler cette fonction
GRANT EXECUTE ON FUNCTION public.increment_article_views(TEXT) TO anon, authenticated;
