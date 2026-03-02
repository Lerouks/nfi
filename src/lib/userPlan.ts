/**
 * NFI REPORT — Contexte global du plan utilisateur
 *
 * Fournit le tier d'abonnement de l'utilisateur connecté à tous les composants,
 * indépendamment de la disponibilité de Clerk.
 *
 * useUserPlan() → { tier, isLoading }
 *   - tier:      "free" | "standard" | "premium"
 *   - isLoading: true pendant que Clerk/Supabase chargent (évite le flash)
 */

import { createContext, useContext } from "react";
import type { SubscriptionTier } from "./subscription";

export interface UserPlan {
  tier: SubscriptionTier;
  /** true pendant le chargement Clerk + Supabase */
  isLoading: boolean;
}

export const DEFAULT_PLAN: UserPlan = { tier: "free", isLoading: false };

export const UserPlanCtx = createContext<UserPlan>(DEFAULT_PLAN);

/** Hook pour lire le plan de l'utilisateur courant depuis n'importe quel composant. */
export const useUserPlan = () => useContext(UserPlanCtx);
