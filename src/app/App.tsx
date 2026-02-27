import { RouterProvider } from "react-router";
import { useEffect, useState, lazy, Suspense } from "react";
import { router } from "./routes";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const isClerkReady =
  typeof clerkKey === "string" &&
  clerkKey.length > 10 &&
  (clerkKey.startsWith("pk_live_") || clerkKey.startsWith("pk_test_")) &&
  !clerkKey.includes("YOUR_CLERK");

const ClerkApp = lazy(() => import("./ClerkApp"));

/**
 * Decode the Frontend API domain embedded in a Clerk publishable key.
 * Format: pk_(live|test)_BASE64("domain$")
 */
function clerkDomain(key: string): string | null {
  try {
    const b64 = key.replace(/^pk_(live|test)_/, "");
    return atob(b64).replace(/\$$/, "");
  } catch {
    return null;
  }
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  /**
   * null  → vérification en cours (on affiche RouterProvider en attendant)
   * true  → domaine Clerk accessible → charge ClerkApp
   * false → domaine inaccessible → reste sur RouterProvider sans auth
   */
  const [clerkOk, setClerkOk] = useState<boolean | null>(null);

  useEffect(() => {
    import("../lib/posthog").then(({ initPostHog }) => initPostHog());
    import("../lib/sentry").then(({ initSentry }) => initSentry());

    if (import.meta.env.DEV) {
      console.info(
        "%cNFI REPORT%c — Business, Économie, Finance",
        "color: #00A651; font-weight: bold; font-size: 14px;",
        "color: #0D1B35; font-size: 12px;"
      );
    }

    if (!isClerkReady || !clerkKey) {
      setClerkOk(false);
      return;
    }

    const domain = clerkDomain(clerkKey);
    if (!domain) {
      setClerkOk(false);
      return;
    }

    // Sonde rapide (2 s max) pour vérifier si le domaine Clerk est joignable.
    // mode "no-cors" : échoue sur erreur DNS/réseau, réussit si le serveur répond.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2000);

    fetch(`https://${domain}/`, { signal: ctrl.signal, mode: "no-cors", cache: "no-store" })
      .then(() => {
        clearTimeout(timer);
        setClerkOk(true);
      })
      .catch(() => {
        clearTimeout(timer);
        setClerkOk(false);
      });

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, []);

  // Clerk accessible → charge ClerkApp (avec auth complète)
  if (clerkOk === true) {
    return (
      <Suspense fallback={null}>
        <ClerkApp />
      </Suspense>
    );
  }

  // En attente de la sonde OU domaine inaccessible → site sans auth (articles visibles)
  return <RouterProvider router={router} />;
}
