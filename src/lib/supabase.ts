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
export type Profile = {
  id: string;                                           // Clerk user ID
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: "free" | "standard" | "premium";
  subscription_expires_at: string | null;
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
      subscription_tier: profile.subscription_tier ?? "free",
      created_at: profile.created_at ?? new Date().toISOString(),
    })
  );
  return result !== null;
}

// ─── Newsletter ───────────────────────────────────────────────────────────────

/** Inscrit un email à la newsletter (upsert = pas de doublon) */
export async function subscribeNewsletter(email: string): Promise<boolean> {
  const result = await safeQuery(() =>
    supabase.from("newsletters").upsert(
      { email, is_active: true, subscribed_at: new Date().toISOString() },
      { onConflict: "email" }
    )
  );
  return result !== null;
}

/** Vérifie si un email est déjà inscrit */
export async function isNewsletterSubscribed(email: string): Promise<boolean> {
  const data = await safeQuery(() =>
    supabase.from("newsletters").select("id").eq("email", email).eq("is_active", true).single()
  );
  return data !== null;
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