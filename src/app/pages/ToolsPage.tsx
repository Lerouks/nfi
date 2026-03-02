import { useState, lazy, Suspense, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Calculator, TrendingUp, Banknote, Percent,
  Star, Lock, ChevronRight, Sparkles, Zap,
} from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useClerkActive, useClerkChecking } from "../../lib/clerkActive";
import { useSubscription } from "../../lib/subscription";

// ─── Lazy imports ─────────────────────────────────────────────────────────────
const SalarySimulator    = lazy(() => import("../components/tools/SalarySimulator"));
const EconomicIndices    = lazy(() => import("../components/tools/EconomicIndices"));
const CompoundCalc       = lazy(() => import("../components/tools/CompoundCalc"));
const SimpleInterestCalc = lazy(() => import("../components/tools/SimpleInterestCalc"));
const LoanSimulator      = lazy(() => import("../components/tools/LoanSimulator"));

// ─── Config ───────────────────────────────────────────────────────────────────
interface Tool {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  description: string;
  component: React.LazyExoticComponent<React.ComponentType>;
  plan: "free" | "premium";
}

const FREE_TOOLS: Tool[] = [
  {
    id: "loan",
    label: "Simulateur d'Emprunt",
    shortLabel: "Emprunt",
    icon: Banknote,
    color: "#0D1B35",
    bg: "#EFF6FF",
    description: "Calculez vos mensualités, le coût total du crédit et visualisez votre tableau d'amortissement.",
    component: LoanSimulator,
    plan: "free",
  },
  {
    id: "simple",
    label: "Intérêt Simple",
    shortLabel: "Intérêt simple",
    icon: Percent,
    color: "#D97706",
    bg: "#FFFBEB",
    description: "Simulez les intérêts simples sur un capital avec la formule I = P × r × t.",
    component: SimpleInterestCalc,
    plan: "free",
  },
];

const PREMIUM_TOOLS: Tool[] = [
  {
    id: "salary",
    label: "Simulateur Salaire",
    shortLabel: "Salaire",
    icon: Calculator,
    color: "#00A651",
    bg: "#F0FDF4",
    description: "Calculez votre salaire net selon la législation nigérienne (ITS + CNSS).",
    component: SalarySimulator,
    plan: "premium",
  },
  {
    id: "indices",
    label: "Indices Économiques",
    shortLabel: "Indices",
    icon: TrendingUp,
    color: "#0D1B35",
    bg: "#EFF6FF",
    description: "Suivez les indicateurs clés du Niger en temps réel avec graphiques interactifs.",
    component: EconomicIndices,
    plan: "premium",
  },
  {
    id: "compound",
    label: "Intérêt Composé",
    shortLabel: "Composé",
    icon: TrendingUp,
    color: "#E53E3E",
    bg: "#FFF5F5",
    description: "Simulez la croissance de vos investissements avec la magie des intérêts composés.",
    component: CompoundCalc,
    plan: "premium",
  },
];

const ALL_TOOLS = [...FREE_TOOLS, ...PREMIUM_TOOLS];

// ─── Wrapper Clerk — lit le tier uniquement quand ClerkProvider est actif ─────
function ToolsPageWithClerk() {
  const { user, isSignedIn, isLoaded } = useUser();
  const userId = isSignedIn && user ? user.id : null;
  const subscription = useSubscription(userId);
  const isPremium = isLoaded && !subscription.isLoading && (
    subscription.tier === "standard" || subscription.tier === "premium"
  );
  // Inclure le chargement Clerk dans subscriptionLoading pour éviter le flash "Paywall → Outil"
  const subscriptionLoading = !isLoaded || subscription.isLoading;
  return <ToolsPageContent isPremium={isPremium} subscriptionLoading={subscriptionLoading} />;
}

function ToolLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex items-center gap-3 text-gray-400">
        <div className="w-5 h-5 border-2 border-[#00A651] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Chargement de l'outil…</span>
      </div>
    </div>
  );
}

// ─── Sidebar nav item ─────────────────────────────────────────────────────────
function ToolNavItem({
  tool, isActive, onClick, locked = false,
}: {
  tool: Tool;
  isActive: boolean;
  onClick: () => void;
  locked?: boolean;
}) {
  const Icon = tool.icon;
  return (
    <button
      onClick={locked ? undefined : onClick}
      disabled={locked}
      aria-label={locked ? `${tool.label} — réservé aux abonnés Premium` : tool.label}
      aria-current={isActive ? "true" : undefined}
      title={tool.description}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
        locked
          ? "opacity-50 cursor-not-allowed"
          : isActive
          ? "bg-[#00A651]/10 text-[#00A651]"
          : "text-gray-600 hover:bg-gray-50 hover:text-[#0D1B35]"
      }`}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: isActive ? tool.color + "20" : "#F3F4F6" }}
      >
        {locked ? (
          <Lock size={13} className="text-gray-400" />
        ) : (
          <Icon size={15} style={{ color: isActive ? tool.color : "#9CA3AF" }} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{tool.label}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{tool.shortLabel}</p>
      </div>
      {isActive && !locked && <ChevronRight size={14} className="ml-auto shrink-0 text-[#00A651]" />}
    </button>
  );
}

// ─── Export principal ─────────────────────────────────────────────────────────
export default function ToolsPage() {
  const clerkActive = useClerkActive();
  // clerkChecking = true pendant la sonde réseau (~2 s) → affiche skeleton au lieu du paywall
  const clerkChecking = useClerkChecking();
  if (clerkActive) return <ToolsPageWithClerk />;
  return <ToolsPageContent isPremium={false} subscriptionLoading={clerkChecking} />;
}

// ─── Contenu (design inchangé) ────────────────────────────────────────────────
function ToolsPageContent({ isPremium, subscriptionLoading }: { isPremium: boolean; subscriptionLoading: boolean }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Lire le paramètre URL ?outil=<id> pour le deep-linking vers un outil précis
  const urlTool = searchParams.get("outil");
  const initialId = ALL_TOOLS.find((t) => t.id === urlTool)?.id ?? FREE_TOOLS[0].id;

  const [activeId, setActiveId] = useState(initialId);
  // On garde en mémoire tous les outils déjà ouverts pour éviter le démontage
  const [loadedIds, setLoadedIds] = useState<Set<string>>(
    () => new Set([initialId])
  );

  // Synchroniser l'URL quand l'outil change (permet le bookmarking et le partage)
  useEffect(() => {
    setSearchParams({ outil: activeId }, { replace: true });
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Quand l'abonnement finit de charger et que l'outil actif est verrouillé,
  // basculer automatiquement vers le premier outil gratuit pour éviter de rester
  // bloqué sur le paywall (ex : URL ?outil=salary pour un utilisateur free)
  useEffect(() => {
    if (!subscriptionLoading && !isPremium) {
      const active = ALL_TOOLS.find((t) => t.id === activeId);
      if (active?.plan === "premium") {
        setActiveId(FREE_TOOLS[0].id);
        setLoadedIds(new Set([FREE_TOOLS[0].id]));
      }
    }
  }, [subscriptionLoading, isPremium]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = ALL_TOOLS.find((t) => t.id === activeId) ?? FREE_TOOLS[0];
  const isActiveLocked = !isPremium && active.plan === "premium";

  const handleSelect = (id: string) => {
    const tool = ALL_TOOLS.find((t) => t.id === id);
    if (!tool) return;
    if (!isPremium && tool.plan === "premium") return;
    // Ajouter l'outil au cache avant de switcher → plus de flash Suspense
    setLoadedIds((prev) => new Set([...prev, id]));
    setActiveId(id);
    // Scroll vers le contenu de l'outil sur tous les écrans
    setTimeout(() => {
      document.getElementById("tool-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 30);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0D1B35 0%, #1a2f5c 60%, #00A651 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <h1
            className="text-white mb-3"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            Outils Pratiques
          </h1>
          <p className="text-white/70 max-w-xl mb-8" style={{ fontSize: "1.05rem" }}>
            Des calculateurs et simulateurs professionnels conçus pour les investisseurs et professionnels au Niger et en Afrique.
          </p>

          {/* Aperçu des deux plans */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            {/* Plan Gratuit */}
            <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <Zap size={14} className="text-white" />
                </div>
                <span className="text-white text-sm font-semibold">Plan Gratuit</span>
                <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">GRATUIT</span>
              </div>
              <div className="space-y-1.5">
                {FREE_TOOLS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelect(t.id)}
                      className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                        activeId === t.id ? "bg-white/25" : "hover:bg-white/10"
                      }`}
                    >
                      <Icon size={13} className="text-white/80 shrink-0" />
                      <span className="text-white/90 text-xs">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Plan Premium */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#00A651]/30 flex items-center justify-center">
                  <Star size={14} className="text-[#4ade80]" />
                </div>
                <span className="text-white text-sm font-semibold">Plan Premium</span>
                <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "rgba(0,166,81,0.2)", color: "#4ade80" }}>
                  <Sparkles size={9} /> PREMIUM
                </span>
              </div>
              <div className="space-y-1.5">
                {PREMIUM_TOOLS.map((t) => {
                  const Icon = t.icon;
                  const locked = !isPremium;
                  return (
                    <button
                      key={t.id}
                      onClick={() => !locked && handleSelect(t.id)}
                      disabled={locked}
                      className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                        locked ? "opacity-50 cursor-not-allowed" : activeId === t.id ? "bg-white/25" : "hover:bg-white/10"
                      }`}
                    >
                      {locked ? <Lock size={13} className="text-white/40 shrink-0" /> : <Icon size={13} className="text-white/80 shrink-0" />}
                      <span className="text-white/90 text-xs">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Corps ────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Sélecteur mobile (tabs horizontaux, < lg) ─────────────────── */}
        <div className="lg:hidden mb-5">
          <div className="overflow-x-auto scrollbar-none -mx-4 px-4">
            <div className="flex gap-2 min-w-max pb-1">
              {ALL_TOOLS.map((tool) => {
                const locked = !isPremium && tool.plan === "premium";
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => !locked && handleSelect(tool.id)}
                    disabled={locked}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm border shrink-0 transition-all ${
                      locked
                        ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200"
                        : activeId === tool.id
                        ? "text-white border-transparent"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#00A651] hover:text-[#00A651]"
                    }`}
                    style={!locked && activeId === tool.id ? { background: tool.color, borderColor: tool.color } : {}}
                  >
                    {locked ? <Lock size={12} /> : <Icon size={13} style={{ color: activeId === tool.id ? "#fff" : tool.color }} />}
                    <span>{tool.shortLabel}</span>
                    {tool.plan === "premium" && !locked && (
                      <span className="text-[9px] font-bold px-1 py-0.5 rounded-full bg-white/20">PRO</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar navigation (desktop uniquement) ─────────────────── */}
          <aside className="hidden lg:block lg:w-64 shrink-0" aria-label="Navigation des outils">
            <div className="bg-white rounded-2xl border p-2 sticky top-24 space-y-3" style={{ borderColor: "rgba(0,0,0,0.06)" }}>

              {/* Plan Gratuit */}
              <div>
                <div className="flex items-center gap-2 px-3 py-2">
                  <Zap size={12} className="text-[#D97706]" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider" id="free-tools-label">Plan Gratuit</p>
                </div>
                <nav aria-labelledby="free-tools-label" className="space-y-0.5">
                  {FREE_TOOLS.map((tool) => (
                    <ToolNavItem
                      key={tool.id}
                      tool={tool}
                      isActive={activeId === tool.id}
                      onClick={() => handleSelect(tool.id)}
                    />
                  ))}
                </nav>
              </div>

              <div className="border-t mx-2" style={{ borderColor: "rgba(0,0,0,0.06)" }} />

              {/* Plan Premium */}
              <div>
                <div className="flex items-center gap-2 px-3 py-2">
                  <Star size={12} className="text-[#00A651]" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider" id="premium-tools-label">Plan Premium</p>
                </div>
                <nav aria-labelledby="premium-tools-label" className="space-y-0.5">
                  {PREMIUM_TOOLS.map((tool) => (
                    <ToolNavItem
                      key={tool.id}
                      tool={tool}
                      isActive={activeId === tool.id}
                      onClick={() => handleSelect(tool.id)}
                      locked={!isPremium}
                    />
                  ))}
                </nav>

                {/* Badge abonné ou CTA */}
                {isPremium ? (
                  <div className="mt-3 mx-2 rounded-xl p-3 text-center" style={{ background: "linear-gradient(135deg, #00A65108, #0D1B3508)" }}>
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Star size={13} className="text-[#00A651]" />
                      <span className="text-xs font-semibold text-[#00A651]">Abonné Premium</span>
                    </div>
                    <p className="text-xs text-gray-500">Accès complet à tous les outils</p>
                  </div>
                ) : (
                  <div className="mt-3 mx-2">
                    <Link
                      to="/subscribe"
                      className="flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-semibold text-white rounded-xl transition hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #00A651, #008c44)" }}
                    >
                      <Star size={12} /> Débloquer Premium
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* ── Contenu outil ───────────────────────────────────── */}
          <main id="tool-content" className="flex-1 min-w-0 scroll-mt-navbar" aria-label={`Outil actif : ${active.label}`}>
            {/* Breadcrumb + badge plan */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Outils</span>
                <ChevronRight size={14} />
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: active.plan === "free" ? "rgba(217,119,6,0.1)" : "rgba(0,166,81,0.1)",
                    color:      active.plan === "free" ? "#D97706" : "#00A651",
                  }}
                >
                  {active.plan === "free" ? "Gratuit" : "Premium"}
                </span>
                <ChevronRight size={14} />
                <span className="text-[#0D1B35] font-medium">{active.label}</span>
              </div>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                style={{
                  background:  active.bg,
                  color:       active.color,
                  borderColor: active.color + "33",
                }}
              >
                <active.icon size={11} />
                {active.label}
              </span>
            </div>

            {/* Outil actif */}
            {subscriptionLoading && active.plan === "premium" ? (
              /* Chargement abonnement */
              <div className="bg-white rounded-2xl border p-12 text-center animate-pulse" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                <div className="w-14 h-14 bg-gray-100 rounded-2xl mx-auto mb-4" />
                <div className="h-6 bg-gray-100 rounded w-48 mx-auto mb-3" />
                <div className="h-4 bg-gray-100 rounded w-64 mx-auto" />
              </div>
            ) : isActiveLocked ? (
              /* Paywall inline */
              <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                <div className="w-14 h-14 rounded-2xl bg-[#00A651]/10 flex items-center justify-center mx-auto mb-4">
                  <Lock size={24} className="text-[#00A651]" />
                </div>
                <h2 className="text-[#0D1B35] mb-2" style={{ fontSize: "1.6rem" }}>
                  Outil Premium
                </h2>
                <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                  Cet outil est réservé aux abonnés Premium. Accédez au simulateur de salaire net, aux indices économiques et à la calculatrice d'intérêt composé.
                </p>
                <Link
                  to="/subscribe"
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-medium transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #00A651, #008c44)" }}
                >
                  <Star size={14} /> Voir les offres d'abonnement
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border p-6 sm:p-8" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                {/* Tous les outils déjà chargés restent montés (display none/block).
                    Ça évite le démontage/remontage et le flash Suspense au changement d'outil. */}
                {ALL_TOOLS.map((tool) => {
                  if (!loadedIds.has(tool.id)) return null;
                  const Comp = tool.component;
                  return (
                    <div key={tool.id} style={{ display: tool.id === activeId ? "block" : "none" }}>
                      <Suspense fallback={<ToolLoader />}>
                        <Comp />
                      </Suspense>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Autres outils */}
            <div className="mt-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Autres outils disponibles</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ALL_TOOLS.filter((t) => t.id !== activeId).map((tool) => {
                  const Icon = tool.icon;
                  const locked = !isPremium && tool.plan === "premium";
                  return (
                    <button
                      key={tool.id}
                      onClick={() => !locked && handleSelect(tool.id)}
                      disabled={locked}
                      className={`flex items-center gap-3 bg-white rounded-xl border p-4 text-left transition-all group ${
                        locked ? "opacity-60 cursor-not-allowed" : "hover:shadow-md"
                      }`}
                      style={{ borderColor: "rgba(0,0,0,0.06)" }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: tool.bg }}
                      >
                        {locked ? <Lock size={14} className="text-gray-400" /> : <Icon size={16} style={{ color: tool.color }} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-[#0D1B35] group-hover:text-[#00A651] transition-colors truncate">
                            {tool.label}
                          </p>
                          <span
                            className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{
                              background: tool.plan === "free" ? "rgba(217,119,6,0.1)" : "rgba(0,166,81,0.1)",
                              color:      tool.plan === "free" ? "#D97706" : "#00A651",
                            }}
                          >
                            {tool.plan === "free" ? "GRATUIT" : "PREMIUM"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{tool.description.substring(0, 45)}…</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}