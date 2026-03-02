/**
 * NFI REPORT — Vercel Serverless Function : OG tags pour les crawlers
 *
 * Les crawlers sociaux (Facebook, WhatsApp, Twitter/X, LinkedIn, Telegram…)
 * n'exécutent PAS JavaScript. Cette fonction intercepte les requêtes sur
 * /article/:slug et :
 *   - Crawlers  → retourne un HTML minimal avec les bons OG/Twitter tags
 *                 (titre, description, image de couverture) + redirect JS
 *   - Navigateurs → sert dist/index.html (SPA React normal)
 *
 * Branché via vercel.json : { "source": "/article/:slug", "destination": "/api/article-og?slug=:slug" }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import path from "path";

// ─── Config ───────────────────────────────────────────────────────────────────

const SANITY_PROJECT_ID =
  process.env.VITE_SANITY_PROJECT_ID ?? "y1uifwk2";
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "2024-01-01";
const BASE_URL = "https://www.nfireport.com";

// User-agents des principaux crawlers sociaux et moteurs de recherche
const CRAWLER_RE =
  /facebookexternalhit|facebookbot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|Discordbot|baiduspider|Googlebot|bingbot|YandexBot|DuckDuckBot|SiteAuditBot|AhrefsBot|SemrushBot|ia_archiver|rogerbot|msnbot|Applebot/i;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(str: string): string {
  return (str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Lire dist/index.html (inclus dans le bundle de la fonction via vercel.json includeFiles) */
function readIndexHtml(): string {
  const candidates = [
    path.join(process.cwd(), "dist", "index.html"),
    path.join(__dirname, "..", "dist", "index.html"),
    path.join(__dirname, "dist", "index.html"),
  ];
  for (const p of candidates) {
    try {
      return fs.readFileSync(p, "utf-8");
    } catch {
      // essayer le chemin suivant
    }
  }
  throw new Error("dist/index.html introuvable");
}

/** Requête GROQ vers l'API REST Sanity (pas de SDK nécessaire) */
async function fetchArticleFromSanity(
  slug: string
): Promise<null | {
  title: string;
  excerpt: string;
  coverUrl: string | null;
  author: string;
  category: string;
  publishedAt: string;
  isPremium: boolean;
}> {
  const query = `*[_type=="article"&&slug.current==$slug][0]{
    title,
    excerpt,
    "coverUrl": cover.asset->url,
    author,
    category,
    publishedAt,
    isPremium
  }`;

  const url = new URL(
    `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`
  );
  url.searchParams.set("query", query);
  url.searchParams.set("$slug", JSON.stringify(slug));

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    // 4 s max pour ne pas dépasser le timeout Vercel
    signal: AbortSignal.timeout(4000),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as { result?: unknown };
  return (json.result as ReturnType<typeof fetchArticleFromSanity> | null) ?? null;
}

/** Génère le HTML minimal pour les crawlers avec tous les OG/Twitter tags */
function buildCrawlerHtml(article: NonNullable<Awaited<ReturnType<typeof fetchArticleFromSanity>>>, slug: string): string {
  const pageUrl = `${BASE_URL}/article/${esc(slug)}`;
  const title = esc(article.title);
  const description = esc(article.excerpt);
  const image = article.coverUrl ?? `${BASE_URL}/logo.png`;
  const publishedAt = article.publishedAt ?? new Date().toISOString();
  const author = esc(article.author ?? "NFI REPORT");

  const ld = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt,
    image: [image],
    datePublished: publishedAt,
    url: pageUrl,
    author: { "@type": "Person", name: article.author ?? "NFI REPORT" },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: "NFI REPORT",
      logo: { "@type": "ImageObject", url: `${BASE_URL}/logo.png` },
    },
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — NFI REPORT</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${pageUrl}">

<!-- Open Graph (Facebook · WhatsApp · LinkedIn) -->
<meta property="og:site_name" content="NFI REPORT">
<meta property="og:type" content="article">
<meta property="og:url" content="${pageUrl}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">
<meta property="og:image:secure_url" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${title}">
<meta property="og:locale" content="fr_FR">
<meta property="article:published_time" content="${publishedAt}">
<meta property="article:author" content="${author}">
<meta property="article:section" content="${esc(article.category ?? "")}">

<!-- Twitter Card (Twitter/X) -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@nfireport">
<meta name="twitter:creator" content="@nfireport">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:image:alt" content="${title}">

<!-- Structured Data JSON-LD -->
<script type="application/ld+json">${ld}</script>
</head>
<body>
<!-- Redirect vers le SPA pour les crawlers qui exécutent JS (ex: Google) -->
<script>window.location.replace("${pageUrl}");</script>
<noscript>
  <p><a href="${pageUrl}">Lire l'article : ${title}</a></p>
</noscript>
</body>
</html>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const slug = (req.query.slug as string) ?? "";
  if (!slug) {
    res.status(400).send("Missing slug");
    return;
  }

  const ua = (req.headers["user-agent"] as string) ?? "";
  const isCrawler = CRAWLER_RE.test(ua);

  // ── Navigateur ordinaire : servir le SPA (dist/index.html) ──────────────────
  if (!isCrawler) {
    try {
      const html = readIndexHtml();
      res
        .setHeader("Content-Type", "text/html; charset=utf-8")
        .setHeader("Cache-Control", "no-store")
        .status(200)
        .send(html);
    } catch {
      // Fallback si le fichier n'est pas accessible (env de dev local)
      res.redirect(302, `/article/${slug}`);
    }
    return;
  }

  // ── Crawler : récupérer l'article depuis Sanity et retourner les OG tags ────
  try {
    const article = await fetchArticleFromSanity(slug);

    if (!article) {
      // Article non trouvé → fallback sur le SPA
      try {
        const html = readIndexHtml();
        res
          .setHeader("Content-Type", "text/html; charset=utf-8")
          .status(200)
          .send(html);
      } catch {
        res.redirect(302, "/");
      }
      return;
    }

    res
      .setHeader("Content-Type", "text/html; charset=utf-8")
      // Cache 5 min côté CDN, revalidé ensuite (Vercel Edge Network)
      .setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600")
      .status(200)
      .send(buildCrawlerHtml(article, slug));
  } catch (err) {
    console.error("[article-og] Erreur Sanity :", err);
    try {
      const html = readIndexHtml();
      res
        .setHeader("Content-Type", "text/html; charset=utf-8")
        .status(200)
        .send(html);
    } catch {
      res.redirect(302, "/");
    }
  }
}
