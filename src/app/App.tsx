import { RouterProvider } from "react-router";
import { useEffect, lazy, Suspense } from "react";
import { router } from "./routes";

// Clerk est chargé uniquement si une vraie clé est configurée
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const isClerkReady =
  typeof clerkKey === "string" &&
  clerkKey.length > 10 &&
  (clerkKey.startsWith("pk_live_") || clerkKey.startsWith("pk_test_")) &&
  !clerkKey.includes("YOUR_CLERK");

const ClerkApp = lazy(() => import("./ClerkApp"));

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
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
  }, []);

  if (isClerkReady) {
    return (
      <Suspense fallback={null}>
        <ClerkApp />
      </Suspense>
    );
  }

  return <RouterProvider router={router} />;
}
