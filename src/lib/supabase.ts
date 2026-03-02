import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * NFI REPORT — Client Supabase (singleton)
 * Une seule instance GoTrueClient dans tout le browser context.
 */

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

const SUPABASE_READY =
  SUPABASE_URL.startsWith("https://") && SUPABASE_ANON_KEY.startsWith("eyJ");

// ─── Singleton ────────────────────────────────────────────────────────────────
const SINGLETON_KEY = "__nfi_supabase_client__";

declare global {
  // eslint-disable-next-line no-var
  var __nfi_supabase_client__: SupabaseClient | undefined;
}

function getSupabaseClient(): SupabaseClient {
  if (globalThis[SINGLETON_KEY]) {
    return globalThis[SINGLETON_KEY] as SupabaseClient;
  }
  const client = createClient(
    SUPABASE_READY ? SUPABASE_URL      : "https://placeholder.supabase.co",
    SUPABASE_READY ? SUPABASE_ANON_KEY : "placeholder-key",
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "nfi-report-auth",
      },
    }
  );
  globalThis[SINGLETON_KEY] = client;
  return client;
}
export const supabase = getSupabaseClient();

// ─── Helper : ignore toutes les requêtes si Supabase n'est pas configuré ─────
async function safeQuery<T>(fn: () => PromiseLike<{ data: T | null; error: unknown }>, label?: string): Promise<T | null> {
  if (!SUPABASE_READY) {
    console.warn("[Supabase] Non configuré — requête ignorée", label ?? "");
    return null;
  }
  try {
    const { data, error } = await fn();
    if (error) {
      // warn (pas error) : safeQuery retourne toujours null et les appelants ont des fallbacks
      console.warn("[Supabase] Requête échouée –", label ?? "(sans label)", error);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("[Supabase] Exception –", label ?? "(sans label)", err);
    return null;
  }
}

// ─── Types des tables NFI REPORT ─────────────────────────────────────────────
export type SubscriptionTier = "free" | "standard" | "premium";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "pending";

export type MarketItem = {
  id: number;
  type: "index" | "commodity";
  name: string;
  value: number;
  change_abs: number;
  change_pct: string;
  unit: string | null;
  display_order: number;
  is_active: boolean;
  updated_at: string;
};

export type NavSection = {
  label: string;
  slug: string;
  icon: string;
};

export type ChartData = {
  brvm:       { month: string; value: number }[];
  gdpGrowth:  { country: string; value: number }[];
  investment: { year: string; china: number; europe: number; usa: number; other: number }[];
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type DashboardData = {
  stats: {
    total_users: number;
    premium: number;
    standard: number;
    free: number;
    total_revenue: number;
    pending_payments: number;
  };
  recent_comments: Comment[];
  contact_messages: ContactMessage[];
  active_users: { user_id: string; author_name: string; author_avatar: string | null; count: number }[];
  recent_payments: PaymentRequest[];
};

export type Profile = {
  id: string;                   // Clerk user ID
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  subscription_expires_at: string | null;
  premium_read_count: number;
  premium_read_reset_at: string;
  created_at: string;
  updated_at: string;
};

export type PaymentRequest = {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  plan_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  payment_method: string;
  phone_number: string | null;
  reference_number: string | null;
  promo_code: string | null;
  admin_note: string | null;
  status: "pending" | "verified" | "rejected" | "refunded";
  created_at: string;
};

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_url: string;
  category_slug: string;
  author_id: string;
  is_premium: boolean;
  published_at: string;
  views: number;
  tags: string[];
};

export type Comment = {
  id: string;
  article_slug: string;
  user_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  likes: number;
  created_at: string;
};

export type Newsletter = {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
};

// ─── Profiles ────────────────────────────────────────────────────────────────

/** Récupère le profil d'un utilisateur par son Clerk user ID */
export async function getProfile(userId: string): Promise<Profile | null> {
  return safeQuery(() =>
    supabase.from("profiles").select("*").eq("id", userId).single()
  );
}

/** Crée ou met à jour le profil après connexion Clerk.
 *  NE touche PAS aux champs d'abonnement s'ils ne sont pas fournis explicitement
 *  (évite d'écraser un abonnement premium défini par l'admin).
 */
export async function upsertProfile(profile: Partial<Profile> & { id: string }): Promise<boolean> {
  // Construire l'objet à insérer/mettre à jour
  // Les champs subscription_* sont inclus seulement si fournis explicitement.
  // Pour un nouvel utilisateur (INSERT), la base utilise ses propres DEFAULT ("free" / "active").
  // Pour un utilisateur existant (UPDATE on conflict), ces champs ne sont pas touchés.
  const data: Record<string, unknown> = {
    id:         profile.id,
    email:      profile.email      ?? "",
    full_name:  profile.full_name  ?? null,
    avatar_url: profile.avatar_url ?? null,
    updated_at: new Date().toISOString(),
  };
  if (profile.subscription_tier   !== undefined) data.subscription_tier   = profile.subscription_tier;
  if (profile.subscription_status !== undefined) data.subscription_status = profile.subscription_status;
  if (profile.subscription_expires_at !== undefined) data.subscription_expires_at = profile.subscription_expires_at;

  const result = await safeQuery(() =>
    supabase.from("profiles").upsert(data as Partial<Profile> & { id: string })
  );
  return result !== null;
}

/**
 * Retourne le tier effectif d'un utilisateur en tenant compte de la date d'expiration.
 * Si l'abonnement est expiré, retourne "free" et met à jour le profil en base.
 */
export async function getEffectiveTier(userId: string): Promise<SubscriptionTier> {
  if (!SUPABASE_READY || !userId) return "free";
  const profile = await getProfile(userId);
  if (!profile) return "free";

  const tier = profile.subscription_tier;
  if (tier === "free") return "free";

  // Vérifier expiration
  if (profile.subscription_expires_at) {
    const expiry = new Date(profile.subscription_expires_at);
    if (expiry < new Date()) {
      // Downgrade automatique
      await safeQuery(() =>
        supabase.from("profiles").update({
          subscription_tier:   "free",
          subscription_status: "canceled",
          updated_at:          new Date().toISOString(),
        }).eq("id", userId)
      );
      return "free";
    }
  }
  return tier;
}

/**
 * Vérifie si un utilisateur free peut lire un article premium (quota 3/mois).
 * NE consomme PAS le quota — appeler usePremiumQuota() pour consommer.
 */
export async function checkPremiumQuota(userId: string): Promise<number> {
  if (!SUPABASE_READY || !userId) return 0;
  const data = await safeQuery(() =>
    supabase.rpc("check_premium_quota", { p_user_id: userId })
  );
  return (data as number | null) ?? 0;
}

/**
 * Consomme 1 lecture premium pour un utilisateur free.
 * Retourne le nombre de lectures restantes après consommation (0 = quota épuisé).
 */
export async function usePremiumQuota(userId: string): Promise<number> {
  if (!SUPABASE_READY || !userId) return 0;
  const data = await safeQuery(() =>
    supabase.rpc("use_premium_quota", { p_user_id: userId })
  );
  return (data as number | null) ?? 0;
}

// ─── Paiements ───────────────────────────────────────────────────────────────

/** Enregistre une demande de paiement en attente de validation admin */
export async function savePaymentRequest(req: {
  userId: string;
  userEmail: string;
  userName: string | null;
  planId: string;
  planName: string;
  amount: number;
  paymentMethod: string;
  phoneNumber?: string;
  referenceNumber?: string;
  promoCode?: string;
}): Promise<PaymentRequest | null> {
  return safeQuery(() =>
    supabase
      .from("payment_requests")
      .insert({
        user_id:          req.userId,
        user_email:       req.userEmail,
        user_name:        req.userName,
        plan_id:          req.planId,
        plan_name:        req.planName,
        amount:           req.amount,
        currency:         "FCFA",
        payment_method:   req.paymentMethod,
        phone_number:     req.phoneNumber ?? null,
        reference_number: req.referenceNumber ?? null,
        promo_code:       req.promoCode ?? null,
        status:           "pending",
      })
      .select()
      .single()
  , "savePaymentRequest");
}

// ─── Admin ────────────────────────────────────────────────────────────────────
// Les opérations admin passent par /api/admin (Vercel serverless) qui utilise
// SUPABASE_SERVICE_ROLE_KEY côté serveur et applique le schéma DB si besoin.

let _adminUserId = "";

/** À appeler depuis AdminPage dès qu'on connaît l'ID de l'admin connecté. */
export function setAdminUser(id: string): void {
  _adminUserId = id;
}

async function callAdminApi<T>(
  action: string,
  body?: Record<string, unknown>
): Promise<T | null> {
  if (!_adminUserId) {
    console.error("[Admin] setAdminUser() non appelé");
    return null;
  }
  try {
    const url = `/api/admin?action=${encodeURIComponent(action)}`;
    const res = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        "x-admin-id":   _adminUserId,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      console.error(`[Admin] ${action} HTTP ${res.status}:`, text);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[Admin] ${action} exception:`, err);
    return null;
  }
}

/** [Admin] Récupère toutes les demandes de paiement */
export async function adminGetAllPaymentRequests(): Promise<PaymentRequest[]> {
  return (await callAdminApi<PaymentRequest[]>("get_payment_requests")) ?? [];
}

/** [Admin] Met à jour le statut d'une demande de paiement */
export async function adminUpdatePaymentRequest(
  id: string,
  status: "verified" | "rejected" | "refunded",
  adminNote?: string
): Promise<boolean> {
  const res = await callAdminApi<{ success: boolean }>("update_payment_request", {
    id, status, adminNote: adminNote ?? null,
  });
  return res?.success === true;
}

/** [Admin] Récupère tous les profils */
export async function adminGetAllProfiles(): Promise<Profile[]> {
  return (await callAdminApi<Profile[]>("get_profiles")) ?? [];
}

/** [Admin] Recherche des profils par email */
export async function adminSearchProfiles(email: string): Promise<Profile[]> {
  if (!_adminUserId) return [];
  try {
    const res = await fetch(
      `/api/admin?action=search_profiles&email=${encodeURIComponent(email)}`,
      { headers: { "x-admin-id": _adminUserId } }
    );
    if (!res.ok) return [];
    return (await res.json()) as Profile[];
  } catch {
    return [];
  }
}

/** [Admin] Met à jour l'abonnement d'un utilisateur */
export async function adminUpdateSubscription(
  userId: string,
  tier: SubscriptionTier,
  months: number
): Promise<boolean> {
  const res = await callAdminApi<{ success: boolean }>("update_subscription", {
    userId, tier, months,
  });
  return res?.success === true;
}

/** Récupère les demandes de paiement d'un utilisateur */
export async function getPaymentRequests(userId: string): Promise<PaymentRequest[]> {
  const data = await safeQuery(() =>
    supabase
      .from("payment_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
  );
  return (data as PaymentRequest[] | null) ?? [];
}

// ─── Newsletter ───────────────────────────────────────────────────────────────

/** Inscrit un email à la newsletter (upsert = pas de doublon). Retourne true si OK. */
export async function subscribeNewsletter(email: string, tier: SubscriptionTier = "free"): Promise<boolean> {
  if (!SUPABASE_READY) return false;
  try {
    const { error } = await supabase.from("newsletters").upsert(
      {
        email,
        plan_tier:     tier,
        is_active:     true,
        subscribed_at: new Date().toISOString(),
        updated_at:    new Date().toISOString(),
      },
      { onConflict: "email" }
    );
    return error === null;
  } catch {
    return false;
  }
}

// ─── Articles ─────────────────────────────────────────────────────────────────

/** Incrémente les vues d'un article via RPC Supabase */
export async function incrementArticleViews(slug: string): Promise<void> {
  await safeQuery(() =>
    supabase.rpc("increment_article_views", { article_slug: slug })
  );
}

/** Récupère le nombre de vues réel d'un article */
export async function getArticleViews(slug: string): Promise<number> {
  const data = await safeQuery(() =>
    supabase
      .from("article_views")
      .select("views")
      .eq("article_slug", slug)
      .single()
  );
  return (data as { views: number } | null)?.views ?? 0;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

/** Récupère tous les commentaires d'un article, du plus récent au plus ancien */
export async function getComments(articleSlug: string): Promise<Comment[]> {
  const data = await safeQuery(() =>
    supabase
      .from("comments")
      .select("*")
      .eq("article_slug", articleSlug)
      .order("created_at", { ascending: false })
  );
  return (data as Comment[] | null) ?? [];
}

/** Récupère les commentaires publiés par un utilisateur */
export async function getUserComments(userId: string, limit = 20): Promise<Comment[]> {
  const data = await safeQuery(() =>
    supabase
      .from("comments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)
  );
  return (data as Comment[] | null) ?? [];
}

/** Ajoute un commentaire et retourne le commentaire créé */
export async function addComment(
  articleSlug: string,
  userId: string,
  authorName: string,
  authorAvatar: string | null,
  content: string
): Promise<Comment | null> {
  return safeQuery(() =>
    supabase
      .from("comments")
      .insert({
        article_slug: articleSlug,
        user_id: userId,
        author_name: authorName,
        author_avatar: authorAvatar,
        content,
        likes: 0,
      })
      .select()
      .single()
  );
}

/** Incrémente le like d'un commentaire */
export async function likeComment(commentId: string): Promise<void> {
  await safeQuery(() =>
    supabase.rpc("increment_comment_likes", { comment_id: commentId })
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────

/** Enregistre un message de contact en base */
export async function sendContactMessage(
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<boolean> {
  if (!SUPABASE_READY) return false;
  try {
    const { error } = await supabase
      .from("contact_messages")
      .insert({ name, email, subject, message });
    return error === null;
  } catch {
    return false;
  }
}

/** Retourne les vues de tous les articles (pour trier "Les plus lus") */
export async function getAllArticleViews(): Promise<Record<string, number>> {
  const data = await safeQuery(() =>
    supabase
      .from("article_views")
      .select("article_slug, views")
      .order("views", { ascending: false })
  );
  if (!data) return {};
  return Object.fromEntries(
    (data as { article_slug: string; views: number }[]).map((r) => [r.article_slug, r.views])
  );
}
// ─── Données publiques dynamiques (market_data, site_config) ─────────────────
//
// Circuit-breaker : si la table est introuvable (HTTP 404 / PGRST200),
// on stocke un flag localStorage pendant 24h et on court-circuite toutes
// les requêtes suivantes sans émettre de fetch → plus de rouge dans la console.
// Dès que la table est créée, la première requête réussit et efface le flag.

const CB_TTL = 24 * 60 * 60 * 1000; // 24 heures
const _cbOpen = new Set<string>();   // cache in-memory (évite de relire localStorage)

function cbIsOpen(table: string): boolean {
  if (_cbOpen.has(table)) return true;
  try {
    const raw = localStorage.getItem(`__nfi_cb_${table}`);
    if (!raw) return false;
    const { at } = JSON.parse(raw) as { at: number };
    if (Date.now() - at < CB_TTL) { _cbOpen.add(table); return true; }
    localStorage.removeItem(`__nfi_cb_${table}`); // TTL expiré → on réessaie
  } catch { /* localStorage indisponible */ }
  return false;
}

function cbOpen(table: string): void {
  _cbOpen.add(table);
  try { localStorage.setItem(`__nfi_cb_${table}`, JSON.stringify({ at: Date.now() })); } catch {}
}

function cbClose(table: string): void {
  _cbOpen.delete(table);
  try { localStorage.removeItem(`__nfi_cb_${table}`); } catch {}
}

// Codes d'erreur PostgREST indiquant que la table n'existe pas encore
const TABLE_MISSING_CODES = new Set(['PGRST200', '42P01', 'PGRST301']);

/** Récupère les données de marché depuis Supabase (lues par le ticker Navbar) */
export async function getMarketData(): Promise<MarketItem[]> {
  if (!SUPABASE_READY || cbIsOpen('market_data')) return [];
  try {
    const { data, error } = await supabase
      .from("market_data").select("*").eq("is_active", true).order("type").order("display_order");
    if (error) {
      if (TABLE_MISSING_CODES.has((error as any).code)) cbOpen('market_data');
      else console.warn("[Supabase] market_data –", error);
      return [];
    }
    cbClose('market_data');
    return (data as MarketItem[]) ?? [];
  } catch { return []; }
}

/** Récupère les sections de navigation depuis Supabase */
export async function getNavSections(): Promise<NavSection[]> {
  if (!SUPABASE_READY || cbIsOpen('site_config')) return [];
  try {
    const { data, error } = await supabase
      .from("site_config").select("value").eq("key", "nav_sections").maybeSingle();
    if (error) {
      if (TABLE_MISSING_CODES.has((error as any).code)) cbOpen('site_config');
      else console.warn("[Supabase] site_config –", error);
      return [];
    }
    cbClose('site_config');
    return ((data as { value: NavSection[] } | null)?.value) ?? [];
  } catch { return []; }
}

// ─── Fonctions Admin ──────────────────────────────────────────────────────────

/** [Admin] Dashboard CEO */
export async function adminGetDashboard(): Promise<DashboardData | null> {
  return callAdminApi<DashboardData>("get_dashboard");
}

/** [Admin] Messages de contact */
export async function adminGetContactMessages(): Promise<ContactMessage[]> {
  return (await callAdminApi<ContactMessage[]>("get_contact_messages")) ?? [];
}

/** [Admin] Marquer un message contact comme lu */
export async function adminMarkContactRead(id: string): Promise<boolean> {
  const res = await callAdminApi<{ success: boolean }>("mark_contact_read", { id });
  return res?.success === true;
}

/** [Admin] Données de marché complètes */
export async function adminGetMarketData(): Promise<MarketItem[]> {
  return (await callAdminApi<MarketItem[]>("get_market_data")) ?? [];
}

/** [Admin] Mettre à jour un item marché */
export async function adminUpdateMarketItem(item: Partial<MarketItem> & { id: number }): Promise<boolean> {
  const res = await callAdminApi<{ success: boolean }>("update_market_item", item as Record<string, unknown>);
  return res?.success === true;
}

/** [Admin] Ajouter un item marché */
export async function adminAddMarketItem(item: Omit<MarketItem, "id" | "updated_at" | "is_active">): Promise<boolean> {
  const res = await callAdminApi<{ success: boolean }>("add_market_item", item as Record<string, unknown>);
  return res?.success === true;
}

/** [Admin] Supprimer un item marché */
export async function adminDeleteMarketItem(id: number): Promise<boolean> {
  const res = await callAdminApi<{ success: boolean }>("delete_market_item", { id });
  return res?.success === true;
}

/** [Admin] Sections de navigation */
export async function adminGetSections(): Promise<NavSection[]> {
  return (await callAdminApi<NavSection[]>("get_sections")) ?? [];
}

/** [Admin] Mettre à jour les sections de navigation */
export async function adminUpdateSections(sections: NavSection[]): Promise<boolean> {
  const res = await callAdminApi<{ success: boolean }>("update_sections", { sections });
  return res?.success === true;
}

/** Récupère les données graphiques Marchés & Analyses (lecture publique via site_config) */
export async function getChartData(): Promise<ChartData | null> {
  if (!SUPABASE_READY || cbIsOpen('site_config')) return null;
  try {
    const { data, error } = await supabase
      .from("site_config").select("value").eq("key", "chart_data").maybeSingle();
    if (error) {
      if (TABLE_MISSING_CODES.has((error as any).code)) cbOpen('site_config');
      return null;
    }
    cbClose('site_config');
    return (data as { value: ChartData } | null)?.value ?? null;
  } catch { return null; }
}

/** [Admin] Données graphiques complètes */
export async function adminGetChartData(): Promise<ChartData | null> {
  return callAdminApi<ChartData>("get_chart_data");
}

/** [Admin] Mettre à jour les données graphiques */
export async function adminUpdateChartData(chartData: ChartData): Promise<boolean> {
  const res = await callAdminApi<{ success: boolean }>("update_chart_data", { chartData });
  return res?.success === true;
}
