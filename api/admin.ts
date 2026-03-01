/**
 * NFI REPORT — API Admin (Vercel Serverless Function)
 *
 * Route : /api/admin?action=<action>
 *
 * Utilise les variables d'environnement injectées par l'intégration
 * Supabase ↔ Vercel (SUPABASE_SERVICE_ROLE_KEY, POSTGRES_URL_NON_POOLING).
 *
 * Sécurité : l'en-tête x-admin-id doit correspondre à un ID dans VITE_ADMIN_IDS.
 */

import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL        = process.env.SUPABASE_URL         || process.env.VITE_SUPABASE_URL        || "";
const SUPABASE_SERVICE_KEY= process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_DB_PASSWORD= process.env.SUPABASE_DB_PASSWORD || "";

// Derive postgres direct connection from SUPABASE_URL + SUPABASE_DB_PASSWORD when
// the full Vercel-Supabase integration env vars are not available.
const _projectRef = SUPABASE_URL.replace(/^https?:\/\//, "").replace(".supabase.co", "").split(".")[0];
const _derivedUrl = (_projectRef && SUPABASE_DB_PASSWORD)
  ? `postgresql://postgres:${encodeURIComponent(SUPABASE_DB_PASSWORD)}@db.${_projectRef}.supabase.co:5432/postgres`
  : "";

const POSTGRES_URL        = process.env.POSTGRES_URL_NON_POOLING  || process.env.POSTGRES_URL || _derivedUrl;
const ADMIN_IDS           = (process.env.VITE_ADMIN_IDS || "")
  .split(",").map((s) => s.trim()).filter(Boolean);

// ─── Schema SQL (idempotent) ──────────────────────────────────────────────────

const SCHEMA_SQL = `
-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id                      TEXT        PRIMARY KEY,
  email                   TEXT        NOT NULL DEFAULT '',
  full_name               TEXT,
  avatar_url              TEXT,
  subscription_tier       TEXT        NOT NULL DEFAULT 'free'
                          CHECK (subscription_tier IN ('free', 'standard', 'premium')),
  subscription_status     TEXT        NOT NULL DEFAULT 'active'
                          CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'pending')),
  subscription_expires_at TIMESTAMPTZ,
  premium_read_count      INTEGER     NOT NULL DEFAULT 0,
  premium_read_reset_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Add missing columns if table already existed without them
DO $$ BEGIN
  BEGIN ALTER TABLE public.profiles ADD COLUMN subscription_tier       TEXT NOT NULL DEFAULT 'free';   EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN subscription_status     TEXT NOT NULL DEFAULT 'active'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN subscription_expires_at TIMESTAMPTZ;                   EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN premium_read_count      INTEGER NOT NULL DEFAULT 0;    EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN premium_read_reset_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN email                   TEXT NOT NULL DEFAULT '';       EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN full_name               TEXT;                          EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE public.profiles ADD COLUMN avatar_url              TEXT;                          EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- RLS policies for profiles
DO $$ BEGIN
  BEGIN CREATE POLICY "profiles_select_anon" ON public.profiles FOR SELECT TO anon USING (true);               EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "profiles_insert_anon" ON public.profiles FOR INSERT TO anon WITH CHECK (true);          EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "profiles_update_anon" ON public.profiles FOR UPDATE TO anon USING (true);               EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "profiles_select_own"  ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid()::text); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "profiles_insert_own"  ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid()::text); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()::text); EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Payment requests
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL,
  tier        TEXT        NOT NULL CHECK (tier IN ('standard', 'premium')),
  amount      NUMERIC     NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'verified', 'rejected', 'refunded')),
  receipt_url TEXT,
  promo_code  TEXT,
  admin_note  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.payment_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  BEGIN ALTER TABLE public.payment_requests ADD COLUMN promo_code  TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE public.payment_requests ADD COLUMN admin_note  TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE public.payment_requests ADD COLUMN updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

DO $$ BEGIN
  BEGIN CREATE POLICY "payment_requests_insert"     ON public.payment_requests FOR INSERT TO anon, authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "payment_requests_select_own" ON public.payment_requests FOR SELECT TO anon, authenticated USING (true);       EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN CREATE POLICY "payment_requests_update_all" ON public.payment_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS profiles_subscription_tier_idx ON public.profiles (subscription_tier);
CREATE INDEX IF NOT EXISTS payment_requests_user_id_idx   ON public.payment_requests (user_id);
CREATE INDEX IF NOT EXISTS payment_requests_status_idx    ON public.payment_requests (status);

-- ── Market data (ticker dynamique) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.market_data (
  id            SERIAL      PRIMARY KEY,
  type          TEXT        NOT NULL CHECK (type IN ('index', 'commodity')),
  name          TEXT        NOT NULL,
  value         NUMERIC     NOT NULL DEFAULT 0,
  change_abs    NUMERIC     NOT NULL DEFAULT 0,
  change_pct    TEXT        NOT NULL DEFAULT '+0.00%',
  unit          TEXT,
  display_order INTEGER     NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.market_data ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  BEGIN CREATE POLICY "market_data_read" ON public.market_data FOR SELECT TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
-- Données par défaut si table vide
INSERT INTO public.market_data (type, name, value, change_abs, change_pct, unit, display_order)
SELECT * FROM (VALUES
  ('index'::text, 'BRVM Composite',  342.15,   2.3,    '+0.68%', NULL::text, 1),
  ('index',       'JSE All Share',   84210.5,  -320.1, '-0.38%', NULL,       2),
  ('index',       'NGX ASI',         104320.0,  1250.0, '+1.21%', NULL,      3),
  ('index',       'EGX 30',          29840.3,   180.5, '+0.61%', NULL,       4),
  ('index',       'NSE 20 (Kenya)',   1840.7,   -12.4,  '-0.67%', NULL,      5),
  ('commodity',   'Pétrole Brent',    82.4,      0.3,  '+0.37%', '$/bbl',    1),
  ('commodity',   'Or',             2018.5,     -5.2,  '-0.26%', '$/oz',     2),
  ('commodity',   'Cacao',          4250.0,     85.0,  '+2.04%', '$/t',      3),
  ('commodity',   'Uranium',          91.5,      1.5,  '+1.67%', '$/lb',     4),
  ('commodity',   'Coton',             0.85,    -0.01, '-1.16%', '$/lb',     5)
) AS v(type,name,value,change_abs,change_pct,unit,display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.market_data LIMIT 1);

-- ── Site config (sections nav, etc.) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.site_config (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.site_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  BEGIN CREATE POLICY "site_config_read" ON public.site_config FOR SELECT TO anon, authenticated USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
INSERT INTO public.site_config (key, value) VALUES (
  'nav_sections',
  '[{"label":"Économie Africaine","slug":"economie-africaine","icon":"Globe"},{"label":"Économie Mondiale","slug":"economie-mondiale","icon":"TrendingUp"},{"label":"Focus Niger","slug":"focus-niger","icon":"MapPin"},{"label":"Analyses de Marché","slug":"analyses-de-marche","icon":"BarChart2"}]'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- ── Contact messages ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL DEFAULT '',
  email      TEXT        NOT NULL DEFAULT '',
  subject    TEXT        NOT NULL DEFAULT '',
  message    TEXT        NOT NULL DEFAULT '',
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE IF EXISTS public.contact_messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  BEGIN CREATE POLICY "contact_insert" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TABLE public.contact_messages ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;
`;

// ─── Migration (lazy, idempotent) ────────────────────────────────────────────

let schemaReady = false;

async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  if (!POSTGRES_URL) {
    console.warn(
      "[Admin] Schema init skipped — aucune URL postgres disponible. " +
      "Définissez POSTGRES_URL_NON_POOLING ou SUPABASE_DB_PASSWORD dans Vercel."
    );
    return;
  }
  const pg = new Client({ connectionString: POSTGRES_URL, connectionTimeoutMillis: 10000 });
  try {
    await pg.connect();
    await pg.query(SCHEMA_SQL);
    schemaReady = true;
    console.log("[Admin] Schema initialized ✓");
  } catch (err) {
    console.error("[Admin] Schema init error:", err);
  } finally {
    await pg.end().catch(() => {});
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-id");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Auth — vérifier que x-admin-id est un admin connu
  const adminId = (req.headers["x-admin-id"] as string) ?? "";
  if (!adminId || (ADMIN_IDS.length > 0 && !ADMIN_IDS.includes(adminId))) {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({
      error: "SUPABASE_SERVICE_ROLE_KEY manquant — configurer l'intégration Supabase ↔ Vercel",
    });
  }

  // Appliquer le schéma si nécessaire (idempotent)
  await ensureSchema();

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const action = (req.query.action as string) ?? "";

  try {
    // ── GET : liste des profils ──────────────────────────────────────────────
    if (action === "get_profiles") {
      const { data, error } = await sb
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data ?? []);
    }

    // ── GET : recherche de profils par email ─────────────────────────────────
    if (action === "search_profiles") {
      const email = (req.query.email as string) ?? "";
      const { data, error } = await sb
        .from("profiles")
        .select("*")
        .ilike("email", `%${email}%`)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data ?? []);
    }

    // ── POST : mise à jour de l'abonnement ───────────────────────────────────
    if (action === "update_subscription" && req.method === "POST") {
      const { userId: targetUserId, tier, months } = req.body ?? {};
      if (!targetUserId || !tier) return res.status(400).json({ error: "userId et tier requis" });
      const expiresAt =
        tier === "free"
          ? null
          : new Date(Date.now() + (months ?? 1) * 30 * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await sb
        .from("profiles")
        .update({
          subscription_tier:       tier,
          subscription_status:     tier === "free" ? "canceled" : "active",
          subscription_expires_at: expiresAt,
          updated_at:              new Date().toISOString(),
        })
        .eq("id", targetUserId);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    }

    // ── GET : liste des demandes de paiement ─────────────────────────────────
    if (action === "get_payment_requests") {
      const { data, error } = await sb
        .from("payment_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data ?? []);
    }

    // ── POST : mise à jour d'une demande de paiement ─────────────────────────
    if (action === "update_payment_request" && req.method === "POST") {
      const { id, status, adminNote } = req.body ?? {};
      if (!id || !status) return res.status(400).json({ error: "id et status requis" });

      // Quand on valide un paiement → appliquer automatiquement l'abonnement
      if (status === "verified") {
        const { data: payReq } = await sb
          .from("payment_requests")
          .select("user_id, plan_id")
          .eq("id", id)
          .single();

        if (payReq?.user_id && payReq?.plan_id) {
          const planId = payReq.plan_id as string;
          const tier = planId.startsWith("premium") ? "premium" : "standard";
          const months = planId.endsWith("-yearly") ? 12 : 1;
          const expiresAt = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString();
          await sb.from("profiles").update({
            subscription_tier:       tier,
            subscription_status:     "active",
            subscription_expires_at: expiresAt,
            updated_at:              new Date().toISOString(),
          }).eq("id", payReq.user_id);
        }
      }

      const { error } = await sb
        .from("payment_requests")
        .update({
          status,
          admin_note: adminNote ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    }

    // ── GET : tableau de bord CEO ────────────────────────────────────────────
    if (action === "get_dashboard") {
      const [profilesR, commentsR, contactR, paymentsR, allCommentsR] = await Promise.all([
        sb.from("profiles").select("id, email, full_name, avatar_url, subscription_tier, created_at"),
        sb.from("comments").select("*").order("created_at", { ascending: false }).limit(15),
        sb.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(15),
        sb.from("payment_requests").select("id, status, amount, user_name, user_email, plan_name, created_at").order("created_at", { ascending: false }).limit(20),
        sb.from("comments").select("user_id, author_name, author_avatar").limit(1000),
      ]);
      const profiles = profilesR.data ?? [];
      const payments = paymentsR.data ?? [];
      // Utilisateurs les plus actifs (par nb de commentaires)
      const counts: Record<string, { user_id: string; author_name: string; author_avatar: string | null; count: number }> = {};
      for (const c of (allCommentsR.data ?? [])) {
        if (!counts[c.user_id]) counts[c.user_id] = { user_id: c.user_id, author_name: c.author_name, author_avatar: c.author_avatar, count: 0 };
        counts[c.user_id].count++;
      }
      const activeUsers = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 8);
      const verifiedRevenue = payments.filter((p: { status: string; amount: number }) => p.status === "verified").reduce((s: number, p: { amount: number }) => s + (p.amount ?? 0), 0);
      return res.json({
        stats: {
          total_users: profiles.length,
          premium: profiles.filter((p: { subscription_tier: string }) => p.subscription_tier === "premium").length,
          standard: profiles.filter((p: { subscription_tier: string }) => p.subscription_tier === "standard").length,
          free: profiles.filter((p: { subscription_tier: string }) => p.subscription_tier === "free").length,
          total_revenue: verifiedRevenue,
          pending_payments: payments.filter((p: { status: string }) => p.status === "pending").length,
        },
        recent_comments: commentsR.data ?? [],
        contact_messages: contactR.data ?? [],
        active_users: activeUsers,
        recent_payments: payments,
      });
    }

    // ── GET : messages de contact ────────────────────────────────────────────
    if (action === "get_contact_messages") {
      const { data, error } = await sb.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data ?? []);
    }

    // ── POST : marquer message contact comme lu ──────────────────────────────
    if (action === "mark_contact_read" && req.method === "POST") {
      const { id } = req.body ?? {};
      if (!id) return res.status(400).json({ error: "id requis" });
      const { error } = await sb.from("contact_messages").update({ is_read: true }).eq("id", id);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    }

    // ── GET : données marchés ────────────────────────────────────────────────
    if (action === "get_market_data") {
      const { data, error } = await sb.from("market_data").select("*").order("type").order("display_order");
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data ?? []);
    }

    // ── POST : mettre à jour un item marché ──────────────────────────────────
    if (action === "update_market_item" && req.method === "POST") {
      const { id, name, value, change_abs, change_pct, unit } = req.body ?? {};
      if (!id) return res.status(400).json({ error: "id requis" });
      const { error } = await sb.from("market_data").update({ name, value: Number(value), change_abs: Number(change_abs), change_pct, unit: unit || null, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    }

    // ── POST : ajouter un item marché ────────────────────────────────────────
    if (action === "add_market_item" && req.method === "POST") {
      const { type, name, value, change_abs, change_pct, unit, display_order } = req.body ?? {};
      if (!type || !name) return res.status(400).json({ error: "type et name requis" });
      const { error } = await sb.from("market_data").insert({ type, name, value: Number(value ?? 0), change_abs: Number(change_abs ?? 0), change_pct: change_pct ?? '+0.00%', unit: unit || null, display_order: Number(display_order ?? 99) });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    }

    // ── POST : supprimer un item marché ──────────────────────────────────────
    if (action === "delete_market_item" && req.method === "POST") {
      const { id } = req.body ?? {};
      if (!id) return res.status(400).json({ error: "id requis" });
      const { error } = await sb.from("market_data").delete().eq("id", id);
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    }

    // ── GET : sections de navigation ─────────────────────────────────────────
    if (action === "get_sections") {
      const { data, error } = await sb.from("site_config").select("value").eq("key", "nav_sections").single();
      if (error) return res.json([]);
      return res.json(data?.value ?? []);
    }

    // ── POST : mettre à jour les sections de navigation ──────────────────────
    if (action === "update_sections" && req.method === "POST") {
      const { sections } = req.body ?? {};
      if (!Array.isArray(sections)) return res.status(400).json({ error: "sections (array) requis" });
      const { error } = await sb.from("site_config").upsert({ key: "nav_sections", value: sections, updated_at: new Date().toISOString() });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ success: true });
    }

    return res.status(400).json({ error: `Action inconnue : ${action}` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
}
