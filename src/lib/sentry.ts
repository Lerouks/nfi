/**
 * NFI REPORT — Sentry (Tracking des erreurs)
 *
 * Le script CDN dans index.html capture automatiquement toutes les erreurs non gérées.
 * Ce fichier fournit des helpers pour les captures manuelles (ex: catch blocks).
 *
 * Dashboard : https://sentry.io
 * Le DSN est embarqué dans l'URL du script CDN :
 *   https://js.sentry-cdn.com/46d006686fbbd9af84d462e794440ff7.min.js
 */

// Le CDN Sentry expose une variable globale `Sentry` sur window
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: unknown, hint?: object) => string;
      captureMessage: (msg: string, level?: string) => string;
      setUser: (user: { id: string; email?: string } | null) => void;
      withScope: (cb: (scope: SentryScope) => void) => void;
    };
  }
}

interface SentryScope {
  setExtras: (extras: Record<string, unknown>) => void;
  setTag: (key: string, value: string) => void;
  setUser: (user: { id: string; email?: string } | null) => void;
}

// ─── Pas d'init nécessaire — le CDN le fait automatiquement ──────────────────
// initSentry est conservé pour compatibilité avec App.tsx
export async function initSentry() {
  if (window.Sentry) {
    console.info("[Sentry] CDN chargé et opérationnel ✓");
  } else {
    // Fallback : attendre que le CDN soit prêt (max 3s)
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (window.Sentry) { clearInterval(check); resolve(); }
      }, 200);
      setTimeout(() => { clearInterval(check); resolve(); }, 3000);
    });
  }
}

// ─── Capture manuelle d'une erreur ───────────────────────────────────────────
export function captureError(error: Error, context?: Record<string, unknown>) {
  try {
    if (window.Sentry) {
      window.Sentry.withScope((scope) => {
        if (context) scope.setExtras(context);
        window.Sentry!.captureException(error);
      });
    }
  } catch { /* silently fail */ }
}

// ─── Contexte utilisateur (appelé après connexion Clerk) ─────────────────────
export function setUserContext(userId: string, email?: string) {
  try {
    window.Sentry?.setUser({ id: userId, email });
  } catch { /* silently fail */ }
}

export function clearUserContext() {
  try {
    window.Sentry?.setUser(null);
  } catch { /* silently fail */ }
}
