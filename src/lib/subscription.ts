/**
 * NFI REPORT — Hook useSubscription
 *
 * Retourne le tier effectif de l'utilisateur connecté en interrogeant
 * la table Supabase `profiles`.  Gère :
 *   • Expiration automatique → downgrade vers "free"
 *   • Quota mensuel (3 articles premium pour tier "free")
 *   • Upsert du profil lors du premier accès (nouvel utilisateur)
 */

import { useEffect, useRef, useState } from "react";
import {
  getProfile, upsertProfile, getEffectiveTier, checkPremiumQuota, usePremiumQuota,
  type SubscriptionTier, type Profile,
} from "./supabase";

export type { SubscriptionTier };

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  profile: Profile | null;
  isLoading: boolean;
  /** Articles premium restants ce mois (pertinent pour tier "free" uniquement) */
  premiumReadsLeft: number;
  /** true si l'utilisateur peut accéder aux contenus premium */
  canAccessPremium: boolean;
}

const FREE_MONTHLY_QUOTA = 3;

/**
 * Hook principal.  Accepte un userId Clerk (null si non connecté).
 * Charge le profil Supabase, vérifie l'expiration, calcule le quota.
 */
export function useSubscription(userId: string | null | undefined): SubscriptionInfo {
  const [state, setState] = useState<SubscriptionInfo>({
    tier: "free",
    profile: null,
    isLoading: true,
    premiumReadsLeft: FREE_MONTHLY_QUOTA,
    canAccessPremium: false,
  });

  const prevUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    // Re-fetch si userId change OU si le composant est remonté (après navigation)
    const isFirstMount = prevUserId.current === undefined;
    if (!isFirstMount && userId === prevUserId.current) return;
    prevUserId.current = userId;

    if (!userId) {
      setState({
        tier: "free",
        profile: null,
        isLoading: false,
        premiumReadsLeft: FREE_MONTHLY_QUOTA,
        canAccessPremium: false,
      });
      return;
    }

    let cancelled = false;

    (async () => {
      setState((s) => ({ ...s, isLoading: true }));

      // 1. Charger le profil
      let profile = await getProfile(userId);

      // 2. Créer le profil si nouvel utilisateur (pas d'upsert ici, juste l'essentiel)
      if (!profile) {
        await upsertProfile({ id: userId, email: "", subscription_tier: "free" });
        profile = await getProfile(userId);
      }

      if (cancelled) return;

      if (!profile) {
        setState({
          tier: "free",
          profile: null,
          isLoading: false,
          premiumReadsLeft: FREE_MONTHLY_QUOTA,
          canAccessPremium: false,
        });
        return;
      }

      // 3. Tier effectif (tient compte de l'expiration)
      const tier = await getEffectiveTier(userId);
      if (cancelled) return;

      const canAccessPremium = tier === "standard" || tier === "premium";
      let premiumReadsLeft = FREE_MONTHLY_QUOTA;

      if (!canAccessPremium) {
        premiumReadsLeft = await checkPremiumQuota(userId);
      }

      if (cancelled) return;

      setState({
        tier,
        profile,
        isLoading: false,
        premiumReadsLeft: canAccessPremium ? Infinity : premiumReadsLeft,
        canAccessPremium: canAccessPremium || premiumReadsLeft > 0,
      });
    })();

    return () => { cancelled = true; };
  }, [userId]);

  return state;
}

/**
 * Consomme 1 lecture premium pour un utilisateur free.
 * À appeler une seule fois quand le contenu complet est affiché.
 * Retourne le nombre de lectures restantes.
 */
export async function consumePremiumRead(userId: string): Promise<number> {
  return usePremiumQuota(userId);
}
