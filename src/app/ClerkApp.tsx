import { RouterProvider } from "react-router";
import { ClerkProvider, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { router } from "./routes";
import { clerkAppearance } from "../lib/clerk";
import { upsertProfile } from "../lib/supabase";
import { analytics } from "../lib/posthog";
import { setUserContext, clearUserContext } from "../lib/sentry";
import { ClerkActiveCtx } from "../lib/clerkActive";
import { UserPlanCtx } from "../lib/userPlan";
import { useSubscription } from "../lib/subscription";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

// ─── Sync utilisateur Clerk → Supabase + PostHog + Sentry ────────────────────
// Ce composant est monté à l'intérieur du ClerkProvider, donc useUser() est sûr.
function UserSync() {
  const { user, isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress;

      // 1. Upsert dans Supabase (crée ou met à jour le profil)
      upsertProfile({
        id: user.id,
        email: email ?? "",
        full_name: user.fullName ?? null,
        avatar_url: user.imageUrl ?? null,
      });

      // 2. Identifier dans PostHog (lie les events à cet utilisateur)
      analytics.identify(user.id, {
        email,
        name: user.fullName,
        clerk_id: user.id,
        created_at: user.createdAt?.toISOString(),
      });

      // 3. Contexte Sentry (enrichit les rapports d'erreur avec l'id user)
      setUserContext(user.id, email);
    } else if (isLoaded && !isSignedIn) {
      // Déconnexion : réinitialiser les contextes analytics
      analytics.reset();
      clearUserContext();
    }
  }, [isSignedIn, isLoaded, user?.id]);

  return null;
}

// ─── Fournit le plan d'abonnement à tout le sous-arbre ───────────────────────
// Doit être monté à l'intérieur de ClerkProvider pour pouvoir appeler useUser().
function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const subscription = useSubscription(isLoaded ? (user?.id ?? null) : undefined);
  return (
    <UserPlanCtx.Provider value={{
      tier: subscription.tier,
      isLoading: !isLoaded || subscription.isLoading,
    }}>
      {children}
    </UserPlanCtx.Provider>
  );
}

// ─── App wrappée avec ClerkProvider ──────────────────────────────────────────
export default function ClerkApp() {
  return (
    <ClerkProvider publishableKey={clerkKey} appearance={clerkAppearance}>
      <ClerkActiveCtx.Provider value={true}>
        <UserSync />
        <PlanProvider>
          <RouterProvider router={router} />
        </PlanProvider>
      </ClerkActiveCtx.Provider>
    </ClerkProvider>
  );
}
