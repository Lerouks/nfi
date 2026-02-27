import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

export const sanityClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID ?? "y1uifwk2",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
});

const builder = imageUrlBuilder(sanityClient);
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
    author: {
      id: "a1",
      name: a.author ?? "La Rédaction NFI",
      role: "Rédaction",
      avatar: "/redaction-avatar.png",
      bio: "",
      articles: 0,
    },
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
