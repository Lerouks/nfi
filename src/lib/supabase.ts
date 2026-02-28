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
// On stocke l'instance sur globalThis pour éviter les multiples GoTrueClient
// lors des re-rendus HMR ou des imports depuis plusieurs modules.
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
    SUPABASE_READY ? SUPABASE_URL     : "https://placeholder.supabase.co",
    SUPABASE_READY ? SUPABASE_ANON_KEY : "placeholder-key",
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "nfi-report-auth",   // clé unique → évite les collisions
      },
    }
  );

  globalThis[SINGLETON_KEY] = client;
  return client;
}

export const supabase = getSupabaseClient();

// ─── Helper : ignore toutes les requêtes si Supabase n'est pas configuré ─────
async function safeQuery<T>(fn: () => Promise<{ data: T | null; error: unknown }>): Promise<T | null> {
  if (!SUPABASE_READY) return null;
  try {
    const { data, error } = await fn();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

// ─── Types des tables NFI REPORT ─────────────────────────────────────────────
export type SubscriptionTier = "free" | "standard" | "premium";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "pending";

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

/** Crée ou met à jour le profil après connexion Clerk */
export async function upsertProfile(profile: Partial<Profile> & { id: string }): Promise<boolean> {
  const result = await safeQuery(() =>
    supabase.from("profiles").upsert({
      ...profile,
      subscription_tier:   profile.subscription_tier   ?? "free",
      subscription_status: profile.subscription_status ?? "active",
      updated_at: new Date().toISOString(),
    })
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
        status:           "pending",
      })
      .select()
      .single()
  );
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