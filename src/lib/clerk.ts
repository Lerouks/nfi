/**
 * NFI REPORT — Configuration Clerk (Authentification)
 *
 * Clerk gère : inscription, connexion, OAuth (Google, Facebook…),
 * gestion des sessions et des rôles utilisateur.
 *
 * Dashboard : https://dashboard.clerk.com
 * Variable d'environnement à définir :
 *   VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
 *
 * Usage dans un composant :
 *   import { useUser, SignInButton, SignUpButton } from "@clerk/clerk-react";
 *   const { user, isSignedIn } = useUser();
 *
 * Le ClerkProvider est initialisé dans /src/app/App.tsx.
 */
export const CLERK_PUBLISHABLE_KEY =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? "pk_test_YOUR_CLERK_PUBLISHABLE_KEY";

// Apparences personnalisées NFI REPORT
export const clerkAppearance = {
  variables: {
    colorPrimary: "#00A651",
    colorBackground: "#ffffff",
    colorText: "#111827",
    colorInputBackground: "#F7F8FA",
    borderRadius: "0.75rem",
    fontFamily: "'Lato', sans-serif",
  },
  elements: {
    formButtonPrimary: {
      backgroundColor: "#00A651",
      "&:hover": { backgroundColor: "#008c44" },
    },
    card: {
      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      border: "1px solid rgba(0,0,0,0.08)",
    },
  },
};
