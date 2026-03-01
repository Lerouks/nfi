import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";

const token = import.meta.env.VITE_SANITY_TOKEN as string | undefined;

export const sanityClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID ?? "y1uifwk2",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: !token,       // CDN pour dataset public, API pour dataset privé avec token
  ...(token ? { token } : {}),
  perspective: "published",
  stega: false,
});

const builder = createImageUrlBuilder(sanityClient);
export function urlFor(source: any) {
  return builder.image(source);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SanityArticle {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  content: any[];
  cover: any;
  category: string;
  tags: string[];
  author: string;
  isPremium: boolean;
  featured: boolean;
  publishedAt: string;
  readTime: number;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

const ARTICLE_FIELDS = `
  _id, title, slug, excerpt, cover, category, tags,
  author, isPremium, featured, publishedAt, readTime
`;

export async function getAllArticles(): Promise<SanityArticle[]> {
  return sanityClient.fetch(
    `*[_type == "article"] | order(publishedAt desc) { ${ARTICLE_FIELDS} }`
  );
}

export async function getFeaturedArticles(): Promise<SanityArticle[]> {
  return sanityClient.fetch(
    `*[_type == "article" && featured == true] | order(publishedAt desc)[0...4] { ${ARTICLE_FIELDS} }`
  );
}

export async function getArticleBySlug(slug: string): Promise<SanityArticle | null> {
  const results = await sanityClient.fetch(
    `*[_type == "article" && slug.current == $slug][0] { ${ARTICLE_FIELDS}, content }`,
    { slug }
  );
  return results ?? null;
}

export async function getArticlesByCategory(categorySlug: string): Promise<SanityArticle[]> {
  return sanityClient.fetch(
    `*[_type == "article" && category == $categorySlug] | order(publishedAt desc) { ${ARTICLE_FIELDS} }`,
    { categorySlug }
  );
}

export async function searchArticles(query: string): Promise<SanityArticle[]> {
  return sanityClient.fetch(
    `*[_type == "article" && (title match $q || excerpt match $q)] | order(publishedAt desc) { ${ARTICLE_FIELDS} }`,
    { q: `${query}*` }
  );
}

/** Compte le nombre d'articles publiés par un auteur (nom exact) */
export async function getArticleCountByAuthor(authorName: string): Promise<number> {
  const count = await sanityClient.fetch(
    `count(*[_type == "article" && author == $authorName && defined(slug.current)])`,
    { authorName }
  );
  return typeof count === "number" ? count : 0;
}

// Mapping des catégories Sanity → { name, slug } de l'app
const CATEGORY_MAP: Record<string, { name: string; slug: string }> = {
  // valeurs actuelles (alignées avec l'app)
  "economie-africaine":  { name: "Économie Africaine", slug: "economie-africaine" },
  "economie-mondiale":   { name: "Économie Mondiale",  slug: "economie-mondiale" },
  "focus-niger":         { name: "Focus Niger",        slug: "focus-niger" },
  "analyses-de-marche":  { name: "Analyses de Marché", slug: "analyses-de-marche" },
  // anciennes valeurs (rétro-compatibilité)
  "economie":    { name: "Économie Africaine", slug: "economie-africaine" },
  "finance":     { name: "Économie Africaine", slug: "economie-africaine" },
  "afrique":     { name: "Économie Africaine", slug: "economie-africaine" },
  "entreprises": { name: "Économie Africaine", slug: "economie-africaine" },
  "international": { name: "Économie Mondiale", slug: "economie-mondiale" },
  "niger":       { name: "Focus Niger",        slug: "focus-niger" },
  "marches":     { name: "Analyses de Marché", slug: "analyses-de-marche" },
  "analyse":     { name: "Analyses de Marché", slug: "analyses-de-marche" },
};

// Convertit un SanityArticle en format compatible avec le reste de l'app
export function toArticle(a: SanityArticle) {
  const cat = CATEGORY_MAP[a.category] ?? { name: a.category ?? "Actualités", slug: a.category ?? "actualites" };
  return {
    id: a._id,
    title: a.title,
    slug: a.slug?.current ?? '',
    excerpt: a.excerpt,
    content: "",
    cover: a.cover ? urlFor(a.cover).width(800).url() : "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&fit=crop",
    author: (() => {
      const authorName = a.author ?? "La Rédaction NFI";
      const isTeam = !a.author || /r[eé]daction/i.test(a.author);
      return {
        id: isTeam ? "a1" : `ext-${authorName.toLowerCase().replace(/\s+/g, "-")}`,
        name: authorName,
        role: isTeam ? "Équipe éditoriale" : "Journaliste & Contributeur",
        avatar: "/redaction-avatar.png",
        bio: isTeam
          ? "La Rédaction de NFI REPORT est composée de journalistes, d'économistes et d'analystes spécialisés en économie africaine, finance des marchés émergents et développement du continent. Nos contenus sont vérifiés, sourcés et soumis à un comité éditorial indépendant avant publication."
          : `${authorName} est un expert contributeur de NFI REPORT. Spécialiste reconnu dans son domaine, il apporte une analyse pointue et indépendante sur les sujets économiques et financiers qui façonnent l'Afrique.`,
        articles: 0,
      };
    })(),
    category: cat.name,
    categorySlug: cat.slug,
    tags: a.tags ?? [],
    publishedAt: a.publishedAt,
    readTime: a.readTime ?? 5,
    isPremium: a.isPremium ?? false,
    featured: a.featured ?? false,
    views: 0,
    comments: 0,
  };
}
