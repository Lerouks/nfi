/**
 * NFI REPORT — Configuration PostHog (Analytics & Feature Flags)
 *
 * Dashboard : https://app.posthog.com
 * Variables d'environnement :
 *   VITE_POSTHOG_KEY=phc_xxxxxxxxxxxx
 *   VITE_POSTHOG_HOST=https://eu.posthog.com
 */

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY ?? "";
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST ?? "https://eu.posthog.com";

export async function initPostHog() {
  if (!POSTHOG_KEY) {
    console.info("[PostHog] Clé non configurée — analytics désactivés. Ajoutez VITE_POSTHOG_KEY dans .env");
    return;
  }
  try {
    const posthog = (await import("posthog-js")).default;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      person_profiles: "identified_only",
    });
  } catch (err) {
    console.warn("[PostHog] Échec d'initialisation :", err);
  }
}

// ─── Events NFI REPORT ───────────────────────────────────────────────────────
async function getPostHog() {
  if (!POSTHOG_KEY) return null;
  try {
    return (await import("posthog-js")).default;
  } catch {
    return null;
  }
}

export const analytics = {
  articleRead: async (articleId: string, category: string, isPremium: boolean) => {
    const ph = await getPostHog();
    ph?.capture("article_read", { article_id: articleId, category, is_premium: isPremium });
  },
  subscribeIntent: async (planId: string) => {
    const ph = await getPostHog();
    ph?.capture("subscribe_intent", { plan_id: planId });
  },
  subscribeSuccess: async (planId: string, amount: number) => {
    const ph = await getPostHog();
    ph?.capture("subscribe_success", { plan_id: planId, amount_fcfa: amount });
  },
  newsletterSignup: async (email: string) => {
    const ph = await getPostHog();
    ph?.capture("newsletter_signup", { email });
  },
  searchPerformed: async (query: string, resultsCount: number) => {
    const ph = await getPostHog();
    ph?.capture("search_performed", { query, results_count: resultsCount });
  },
  identify: async (userId: string, traits?: Record<string, unknown>) => {
    const ph = await getPostHog();
    ph?.identify(userId, traits);
  },
  reset: async () => {
    const ph = await getPostHog();
    ph?.reset();
  },
};
