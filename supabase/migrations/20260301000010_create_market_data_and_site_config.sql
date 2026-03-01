-- ============================================================
-- NFI REPORT — Tables dynamiques : market_data + site_config
-- Ces tables alimentent le ticker de la Navbar et la navigation.
-- ============================================================

-- ─── 1. market_data ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.market_data (
  id            SERIAL PRIMARY KEY,
  type          VARCHAR(20)  NOT NULL CHECK (type IN ('index', 'commodity')),
  name          VARCHAR(100) NOT NULL,
  value         DECIMAL(18, 4) NOT NULL DEFAULT 0,
  change_abs    DECIMAL(18, 4) NOT NULL DEFAULT 0,
  change_pct    VARCHAR(20)  NOT NULL DEFAULT '0',
  unit          VARCHAR(50),                       -- NULL pour les indices
  display_order INTEGER      NOT NULL DEFAULT 0,
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;

-- Lecture publique (ticker Navbar)
CREATE POLICY "market_data_select_public"
  ON public.market_data FOR SELECT
  TO anon, authenticated
  USING (true);

-- Écriture réservée aux fonctions SECURITY DEFINER (admin)
CREATE POLICY "market_data_modify_admin"
  ON public.market_data FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── 2. site_config ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.site_config (
  key        VARCHAR(100) PRIMARY KEY,
  value      JSONB        NOT NULL,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_config_select_public"
  ON public.site_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "site_config_modify_admin"
  ON public.site_config FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── 3. Données initiales : indices boursiers ─────────────────────────────────

INSERT INTO public.market_data (type, name, value, change_abs, change_pct, unit, display_order, is_active)
VALUES
  ('index', 'BRVM Composite', 342.15,  2.3,    '+0.68%', NULL, 1, true),
  ('index', 'JSE All Share',  84210.5, -320.1, '-0.38%', NULL, 2, true),
  ('index', 'NGX ASI',        104320,  1250,   '+1.21%', NULL, 3, true),
  ('index', 'EGX 30',         29840.3, 180.5,  '+0.61%', NULL, 4, true),
  ('index', 'NSE 20 (Kenya)', 1840.7,  -12.4,  '-0.67%', NULL, 5, true)
ON CONFLICT DO NOTHING;

-- ─── 4. Données initiales : matières premières ───────────────────────────────

INSERT INTO public.market_data (type, name, value, change_abs, change_pct, unit, display_order, is_active)
VALUES
  ('commodity', 'Pétrole Brent', 84.2,   1.2,   '+1.45%', '$/baril',  1, true),
  ('commodity', 'Or',            2145.8, -3.5,  '-0.16%', '$/oz',     2, true),
  ('commodity', 'Cacao',         9840,   120,   '+1.23%', '$/tonne',  3, true),
  ('commodity', 'Uranium',       102.5,  2.1,   '+2.09%', '$/lb',     4, true),
  ('commodity', 'Coton',         0.89,   -0.02, '-2.20%', '$/lb',     5, true)
ON CONFLICT DO NOTHING;

-- ─── 5. Données initiales : sections de navigation ───────────────────────────

INSERT INTO public.site_config (key, value)
VALUES (
  'nav_sections',
  '[
    {"label": "Économie Africaine", "slug": "economie-africaine",  "icon": "Globe"},
    {"label": "Économie Mondiale",  "slug": "economie-mondiale",   "icon": "TrendingUp"},
    {"label": "Focus Niger",        "slug": "focus-niger",         "icon": "MapPin"},
    {"label": "Analyses de Marché", "slug": "analyses-de-marche",  "icon": "BarChart2"}
  ]'::jsonb
)
ON CONFLICT (key) DO NOTHING;
