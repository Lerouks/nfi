/**
 * NFI REPORT — Hooks pour les données dynamiques du site
 *
 * useMarketData()  → données du ticker (indices + matières premières)
 * useNavSections() → sections de navigation
 *
 * Chaque hook :
 *  1. Initialise avec les données par défaut (pas de flash)
 *  2. Charge depuis Supabase au montage
 *  3. Se met à jour via BroadcastChannel quand l'admin sauvegarde
 *  4. Polling toutes les 60s en secours
 */

import { useState, useEffect, useCallback } from "react";
import { getMarketData, getNavSections, type MarketItem, type NavSection } from "./supabase";
import { MARKET_DATA } from "../app/data/mockData";

// ─── Channels ─────────────────────────────────────────────────────────────────
export const MARKET_CHANNEL   = "nfi_market_data";
export const SECTIONS_CHANNEL = "nfi_nav_sections";

/** Diffuse une mise à jour aux autres onglets */
function broadcast(channel: string) {
  try {
    const bc = new BroadcastChannel(channel);
    bc.postMessage("update");
    bc.close();
  } catch {}
}

export function broadcastMarketUpdate()   { broadcast(MARKET_CHANNEL); }
export function broadcastSectionsUpdate() { broadcast(SECTIONS_CHANNEL); }

// ─── Valeurs par défaut (évite le flash au premier rendu) ────────────────────

const DEFAULT_MARKET_ITEMS: MarketItem[] = [
  ...MARKET_DATA.indices.map((idx, i) => ({
    id: i + 1,
    type: "index" as const,
    name: idx.name,
    value: idx.value,
    change_abs: idx.change,
    change_pct: idx.percent,
    unit: null,
    display_order: i + 1,
    is_active: true,
    updated_at: new Date().toISOString(),
  })),
  ...MARKET_DATA.commodities.map((c, i) => ({
    id: 100 + i,
    type: "commodity" as const,
    name: c.name,
    value: c.value,
    change_abs: c.change,
    change_pct: `${c.change >= 0 ? "+" : ""}${c.change}`,
    unit: c.unit,
    display_order: i + 1,
    is_active: true,
    updated_at: new Date().toISOString(),
  })),
];

const DEFAULT_SECTIONS: NavSection[] = [
  { label: "Économie Africaine", slug: "economie-africaine",  icon: "Globe"      },
  { label: "Économie Mondiale",  slug: "economie-mondiale",   icon: "TrendingUp" },
  { label: "Focus Niger",        slug: "focus-niger",         icon: "MapPin"     },
  { label: "Analyses de Marché", slug: "analyses-de-marche",  icon: "BarChart2"  },
];

// ─── useMarketData ────────────────────────────────────────────────────────────

export function useMarketData(): MarketItem[] {
  const [items, setItems] = useState<MarketItem[]>(DEFAULT_MARKET_ITEMS);

  const refetch = useCallback(async () => {
    const data = await getMarketData();
    if (data.length > 0) setItems(data);
  }, []);

  useEffect(() => {
    refetch();

    // Écoute les mises à jour de l'onglet admin (même navigateur)
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(MARKET_CHANNEL);
      bc.onmessage = () => refetch();
    } catch {}

    // Polling de secours (si BroadcastChannel non dispo ou inter-appareils)
    const timer = setInterval(refetch, 60_000);

    return () => {
      bc?.close();
      clearInterval(timer);
    };
  }, [refetch]);

  return items;
}

// ─── useNavSections ───────────────────────────────────────────────────────────

export function useNavSections(): NavSection[] {
  const [sections, setSections] = useState<NavSection[]>(DEFAULT_SECTIONS);

  const refetch = useCallback(async () => {
    const data = await getNavSections();
    if (data.length > 0) setSections(data);
  }, []);

  useEffect(() => {
    refetch();

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(SECTIONS_CHANNEL);
      bc.onmessage = () => refetch();
    } catch {}

    const timer = setInterval(refetch, 120_000);

    return () => {
      bc?.close();
      clearInterval(timer);
    };
  }, [refetch]);

  return sections;
}
