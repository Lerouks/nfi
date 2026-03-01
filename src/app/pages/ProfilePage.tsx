import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  User, BookOpen, CreditCard, Settings, Bell, LogOut,
  Star, CheckCircle2, Eye, Shield,
  ChevronRight, Calendar, MessageSquare, Lock,
} from "lucide-react";
import { SUBSCRIPTION_PLANS, formatDate } from "../data/mockData";
import { ArticleCard } from "../components/ArticleCard";
import { SignInButton, SignOutButton, useUser } from "@clerk/clerk-react";
import { useSavedArticles } from "../../lib/savedArticles";
import { useSearchParams } from "react-router";
import { useClerkActive } from "../../lib/clerkActive";
import { useSubscription } from "../../lib/subscription";
import {
  upsertProfile,
  getPaymentRequests,
  getUserComments,
  type PaymentRequest,
  type Comment,
} from "../../lib/supabase";

type Tab = "overview" | "saved" | "subscription" | "settings";

// ─── Wrapper Clerk ─────────────────────────────────────────────────────────────
function ProfileWithClerk() {
  const { isSignedIn, user, isLoaded } = useUser();
  const subscription = useSubscription(isSignedIn && user ? user.id : null);

  useEffect(() => {
    if (!isSignedIn || !user) return;
    upsertProfile({
      id:         user.id,
      email:      user.primaryEmailAddress?.emailAddress ?? "",
      full_name:  user.fullName ?? user.firstName ?? null,
      avatar_url: user.imageUrl ?? null,
    }).catch(() => {});
  }, [isSignedIn, user?.id]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#00A651] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) return <NotSignedInScreen clerkActive={true} />;

  return (
    <ProfileContent
      userId={user.id}
      name={user.fullName ?? user.firstName ?? "—"}
      firstName={user.firstName ?? ""}
      lastName={user.lastName ?? ""}
      email={user.primaryEmailAddress?.emailAddress ?? ""}
      avatar={user.imageUrl ?? ""}
      subscription={subscription}
    />
  );
}

// ─── Écran non connecté ────────────────────────────────────────────────────────
function NotSignedInScreen({ clerkActive }: { clerkActive: boolean }) {
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User size={28} className="text-gray-400" />
        </div>
        <h2 className="text-gray-900 text-xl mb-2">Connexion requise</h2>
        <p className="text-gray-500 text-sm mb-6">
          Connectez-vous pour accéder à votre profil et gérer votre abonnement.
        </p>
        <div className="space-y-3">
          {clerkActive ? (
            <>
              <SignInButton mode="modal">
                <button className="w-full py-2.5 text-sm text-white font-medium rounded-full" style={{ background: "#00A651" }}>
                  Se connecter
                </button>
              </SignInButton>
              <SignInButton mode="modal">
                <button className="w-full py-2.5 text-sm text-[#00A651] font-medium rounded-full border-2 border-[#00A651] hover:bg-[#00A651] hover:text-white transition-all">
                  Créer un compte
                </button>
              </SignInButton>
            </>
          ) : (
            <p className="text-gray-400 text-xs">Authentification non configurée</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page profil principale ───────────────────────────────────────────────────
export default function ProfilePage() {
  const clerkActive = useClerkActive();
  if (clerkActive) return <ProfileWithClerk />;
  return <NotSignedInScreen clerkActive={false} />;
}

// ─── Contenu du profil ────────────────────────────────────────────────────────
function ProfileContent({
  userId,
  name,
  firstName,
  lastName,
  email,
  avatar,
  subscription,
}: {
  userId: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  subscription: ReturnType<typeof useSubscription>;
}) {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get("tab") as Tab) || "overview");
  const { savedArticles } = useSavedArticles();
  const [paymentHistory, setPaymentHistory] = useState<PaymentRequest[]>([]);
  const [userComments, setUserComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (!userId) return;
    getPaymentRequests(userId).then(setPaymentHistory).catch(() => {});
    getUserComments(userId, 20).then(setUserComments).catch(() => {});
  }, [userId]);

  const NOTIF_DEFAULTS = [
    { id: "newsletter",  label: "Newsletter quotidienne",  sub: "Résumé des actualités chaque matin",    enabled: true  },
    { id: "breaking",    label: "Alertes breaking news",   sub: "Nouvelles urgentes en temps réel",      enabled: true  },
    { id: "reports",     label: "Rapports financiers",     sub: "Nouveaux rapports premium disponibles", enabled: false },
    { id: "comments",    label: "Commentaires",            sub: "Réponses à vos commentaires",           enabled: true  },
  ];

  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      const stored = localStorage.getItem(`nfi_notif_${userId}`);
      if (stored) return JSON.parse(stored) as typeof NOTIF_DEFAULTS;
    } catch {}
    return NOTIF_DEFAULTS;
  });

  // Persister à chaque changement
  useEffect(() => {
    try { localStorage.setItem(`nfi_notif_${userId}`, JSON.stringify(notifPrefs)); } catch {}
  }, [notifPrefs, userId]);

  const toggleNotif = (id: string) =>
    setNotifPrefs((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setTimeout(() => {
      document.getElementById("profile-tab-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 30);
  };

  const tabs = [
    { id: "overview" as Tab,      label: "Vue d'ensemble",       Icon: User        },
    { id: "saved" as Tab,         label: "Articles sauvegardés", Icon: BookOpen    },
    { id: "subscription" as Tab,  label: "Abonnement",           Icon: CreditCard  },
    { id: "settings" as Tab,      label: "Paramètres",           Icon: Settings    },
  ];

  // Données réelles
  const profile = subscription.profile;
  const tier = subscription.tier;
  const memberSince = profile?.created_at ? new Date(profile.created_at) : null;
  const memberDays = memberSince ? Math.floor((Date.now() - memberSince.getTime()) / 86400000) : 0;

  // Activité récente combinée (commentaires + articles sauvegardés)
  const recentActivity = [
    ...userComments.slice(0, 3).map((c) => ({
      type: "comment" as const,
      title: `Commentaire sur "${c.article_slug.replace(/-/g, " ")}"`,
      time: c.created_at,
      Icon: MessageSquare,
    })),
    ...savedArticles.slice(0, 2).map((a) => ({
      type: "saved" as const,
      title: a.title,
      time: null,
      Icon: BookOpen,
    })),
  ].slice(0, 4);

  // Libellé tier
  const TIER_LABEL: Record<string, string> = { free: "Lecteur", standard: "Standard", premium: "Premium" };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Profile header */}
      <div className="bg-white border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatar ? (
                <img src={avatar} alt={name} className="w-16 h-16 rounded-full object-cover border-4 border-white shadow" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow">
                  <User size={28} className="text-gray-400" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00A651] rounded-full border-2 border-white" />
            </div>
            <div>
              <h1 className="text-gray-900 text-xl font-bold">{name}</h1>
              <p className="text-gray-500 text-sm">{email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-white ${
                  tier === "premium" ? "" : tier === "standard" ? "bg-blue-600" : "bg-gray-500"
                }`} style={tier === "premium" ? { background: "#C9A84C" } : {}}>
                  <Star size={10} /> {TIER_LABEL[tier] ?? tier}
                </span>
                {memberSince && (
                  <span className="text-xs text-gray-400">
                    Membre depuis {memberSince.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none mt-5 -mb-px">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => switchTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-t-lg border-b-2 transition-all shrink-0 ${
                  activeTab === id ? "border-b-2 bg-white" : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                }`}
                style={activeTab === id ? { color: "#00A651", borderColor: "#00A651" } : {}}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div id="profile-tab-content" className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* ===================== OVERVIEW ===================== */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              {/* Stats réelles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: "Articles sauvegardés",
                    value: savedArticles.length,
                    Icon: BookOpen,
                  },
                  {
                    label: "Commentaires publiés",
                    value: userComments.length,
                    Icon: MessageSquare,
                  },
                  {
                    label: "Jours membres",
                    value: memberDays,
                    Icon: Calendar,
                  },
                  tier === "free"
                    ? {
                        label: "Lectures premium restantes",
                        value: `${subscription.premiumReadsLeft}/3`,
                        Icon: Eye,
                      }
                    : {
                        label: "Abonnement",
                        value: TIER_LABEL[tier] ?? tier,
                        Icon: Star,
                      },
                ].map(({ label, value, Icon }) => (
                  <div key={label} className="bg-white rounded-xl border p-4 text-center" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                    <Icon size={18} className="text-[#00A651] mx-auto mb-2" />
                    <div className="text-xl font-black text-gray-900">{value}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Activité récente réelle */}
              <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                <h3 className="text-gray-900 font-semibold text-sm mb-4">Activité récente</h3>
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Aucune activité récente.</p>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-[#00A651]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <item.Icon size={13} className="text-[#00A651]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">
                            {item.type === "comment" ? "Commentaire publié" : "Article sauvegardé"}
                          </p>
                          <p className="text-sm text-gray-900 line-clamp-1 capitalize">{item.title}</p>
                        </div>
                        {item.time && (
                          <span className="text-xs text-gray-400 shrink-0">
                            {formatDate(item.time)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Abonnement actuel */}
              <div className="bg-[#0D1B35] rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Star size={14} className="text-[#00A651]" />
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Mon abonnement</span>
                </div>
                {subscription.isLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-5 bg-white/10 rounded w-24" />
                    <div className="h-3 bg-white/10 rounded w-32" />
                  </div>
                ) : (
                  <>
                    <p className="text-white font-bold text-lg">{TIER_LABEL[tier] ?? tier}</p>
                    {profile?.subscription_expires_at ? (
                      <p className="text-gray-400 text-xs mb-3">
                        Expire le {formatDate(profile.subscription_expires_at)}
                      </p>
                    ) : (
                      <p className="text-gray-400 text-xs mb-3">
                        {tier === "free" ? "Plan gratuit" : "Abonnement actif"}
                      </p>
                    )}
                    {tier === "free" && (
                      <p className="text-gray-400 text-xs mb-3">
                        Lectures premium ce mois : <span className="text-white font-semibold">{subscription.premiumReadsLeft}/3</span>
                      </p>
                    )}
                    {/* Accès selon tier */}
                    <div className="space-y-1 mb-3">
                      {tier === "free" && (
                        <p className="text-xs text-amber-400 flex items-center gap-1">
                          <Lock size={10} /> Articles premium limités (3/mois)
                        </p>
                      )}
                      {tier === "standard" && (
                        <p className="text-xs text-[#00A651] flex items-center gap-1">
                          <CheckCircle2 size={10} /> Accès illimité aux articles standard
                        </p>
                      )}
                      {tier === "premium" && (
                        <p className="text-xs text-[#C9A84C] flex items-center gap-1">
                          <CheckCircle2 size={10} /> Accès illimité à tout le contenu
                        </p>
                      )}
                    </div>
                  </>
                )}
                <button
                  onClick={() => switchTab("subscription")}
                  className="w-full py-2 text-xs text-white font-medium rounded-lg text-center"
                  style={{ background: "#00A651" }}>
                  Gérer l'abonnement
                </button>
              </div>

              <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                <h4 className="text-gray-900 font-semibold text-sm mb-3">Accès rapide</h4>
                <div className="space-y-1">
                  {[
                    { label: "Articles sauvegardés", tab: "saved" as Tab, Icon: BookOpen },
                    { label: "Abonnement",           tab: "subscription" as Tab, Icon: CreditCard },
                    { label: "Paramètres",           tab: "settings" as Tab, Icon: Settings },
                  ].map(({ label, tab, Icon }) => (
                    <button key={label} onClick={() => switchTab(tab)}
                      className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-50 transition group">
                      <span className="flex items-center gap-2 text-sm text-gray-700">
                        <Icon size={14} className="text-gray-400" /> {label}
                      </span>
                      <ChevronRight size={13} className="text-gray-300 group-hover:text-[#00A651]" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== SAVED ARTICLES ===================== */}
        {activeTab === "saved" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-gray-900 font-semibold flex items-center gap-2">
                <BookOpen size={16} className="text-[#00A651]" />
                Articles sauvegardés ({savedArticles.length})
              </h2>
            </div>
            {savedArticles.length === 0 ? (
              <div className="bg-white rounded-xl border p-10 text-center" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                <BookOpen size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Vous n'avez pas encore sauvegardé d'articles.</p>
                <Link to="/" className="text-[#00A651] hover:underline text-sm">Parcourir les articles →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {savedArticles.map((article) => {
                  const isPremiumLocked = article.isPremium && tier === "free" && subscription.premiumReadsLeft === 0;
                  return (
                    <div key={article.id} className="relative">
                      <ArticleCard article={article} variant="horizontal" showExcerpt />
                      {isPremiumLocked && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
                          <div className="text-center px-4">
                            <Lock size={20} className="text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 mb-2">Quota mensuel atteint</p>
                            <Link to="/subscribe" className="text-xs text-[#00A651] font-semibold hover:underline">
                              Passer à l'abonnement →
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== SUBSCRIPTION ===================== */}
        {activeTab === "subscription" && (
          <div className="max-w-2xl">
            <h2 className="text-gray-900 font-semibold mb-5 flex items-center gap-2">
              <CreditCard size={16} className="text-[#00A651]" />
              Mon abonnement
            </h2>

            {/* Plan actuel */}
            <div className="bg-white rounded-xl border p-6 mb-5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              {subscription.isLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-6 bg-gray-100 rounded w-32" />
                  <div className="h-4 bg-gray-100 rounded w-48" />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">{TIER_LABEL[tier] ?? tier}</span>
                        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full text-white ${
                          tier === "free" ? "bg-gray-400" : "bg-[#00A651]"
                        }`}>
                          <CheckCircle2 size={10} /> {tier === "free" ? "Gratuit" : "Actif"}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm mt-0.5">
                        {profile?.subscription_expires_at
                          ? `Expire le ${formatDate(profile.subscription_expires_at)}`
                          : tier === "free"
                          ? `Lectures premium : ${subscription.premiumReadsLeft}/3 ce mois`
                          : "Abonnement actif"}
                      </p>
                      {memberSince && (
                        <p className="text-gray-400 text-xs mt-1">
                          Membre depuis {memberSince.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      )}
                    </div>
                    {tier !== "free" && (
                      <div className="text-right">
                        <p className="text-2xl font-black text-gray-900">
                          {tier === "standard" ? "5 000" : "10 000"}
                        </p>
                        <p className="text-xs text-gray-400">FCFA / mois</p>
                      </div>
                    )}
                  </div>

                  {/* Fonctionnalités du plan */}
                  {(() => {
                    const activePlan = SUBSCRIPTION_PLANS.find(
                      (p) => p.name.toLowerCase() === tier || p.id === tier
                    );
                    return activePlan ? (
                      <div className="border-t pt-4" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Inclus dans votre plan</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activePlan.features.map((f) => (
                            <div key={f} className="flex items-center gap-2">
                              <CheckCircle2 size={12} className="text-[#00A651] shrink-0 mt-0.5" />
                              <span className="text-xs text-gray-700">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  <div className="flex gap-3 mt-5">
                    {tier === "free" ? (
                      <Link to="/subscribe"
                        className="flex-1 py-2.5 text-sm font-medium text-white rounded-full text-center transition hover:opacity-90"
                        style={{ background: "#00A651" }}>
                        Choisir un abonnement
                      </Link>
                    ) : tier === "standard" ? (
                      <>
                        <Link to="/subscribe"
                          className="flex-1 py-2.5 text-sm font-medium text-white rounded-full text-center transition hover:opacity-90"
                          style={{ background: "linear-gradient(135deg, #C9A84C, #b8942a)" }}>
                          ✦ Passer en Premium
                        </Link>
                        <a href="mailto:contact@nfireport.com?subject=Annulation abonnement"
                          className="py-2.5 px-4 text-sm font-medium text-gray-600 rounded-full border border-gray-200 hover:bg-gray-50 transition text-center">
                          Annuler
                        </a>
                      </>
                    ) : (
                      <a href="mailto:contact@nfireport.com?subject=Annulation abonnement"
                        className="flex-1 py-2.5 text-sm font-medium text-gray-600 rounded-full border border-gray-200 hover:bg-gray-50 transition text-center">
                        Demander une annulation
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Historique des paiements — réel depuis Supabase */}
            <div className="bg-white rounded-xl border p-6" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <h3 className="text-gray-900 font-semibold text-sm mb-4">Historique des paiements</h3>
              {paymentHistory.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Aucun paiement enregistré.</p>
              ) : (
                <div className="space-y-3">
                  {paymentHistory.map((pr) => (
                    <div key={pr.id} className="flex items-center justify-between py-2 border-b last:border-0"
                      style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                      <div>
                        <p className="text-sm text-gray-900">{formatDate(pr.created_at)}</p>
                        <p className="text-xs text-gray-400">{pr.payment_method} · {pr.plan_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {new Intl.NumberFormat("fr-FR").format(pr.amount)} {pr.currency}
                        </p>
                        <span className={`text-xs font-medium ${
                          pr.status === "verified" ? "text-green-600"
                          : pr.status === "pending"  ? "text-amber-600"
                          : pr.status === "rejected" ? "text-red-600"
                          : "text-gray-500"
                        }`}>
                          {pr.status === "verified" ? "Vérifié"
                          : pr.status === "pending"  ? "En attente"
                          : pr.status === "rejected" ? "Rejeté"
                          : "Remboursé"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== SETTINGS ===================== */}
        {activeTab === "settings" && (
          <div className="max-w-xl space-y-5">
            {/* Infos personnelles (lecture seule — gérées par Clerk) */}
            <div className="bg-white rounded-xl border p-6" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <h3 className="text-gray-900 font-semibold text-sm mb-4 flex items-center gap-2">
                <User size={14} className="text-[#00A651]" /> Informations personnelles
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Prénom</label>
                    <input type="text" readOnly value={firstName}
                      className="w-full px-4 py-2.5 text-sm border rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      style={{ borderColor: "rgba(0,0,0,0.12)" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Nom</label>
                    <input type="text" readOnly value={lastName}
                      className="w-full px-4 py-2.5 text-sm border rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                      style={{ borderColor: "rgba(0,0,0,0.12)" }} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
                  <input type="email" readOnly value={email}
                    className="w-full px-4 py-2.5 text-sm border rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    style={{ borderColor: "rgba(0,0,0,0.12)" }} />
                </div>
                <p className="text-xs text-gray-400">
                  Pour modifier vos informations, connectez-vous à votre compte Clerk.
                </p>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl border p-6" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <h3 className="text-gray-900 font-semibold text-sm mb-4 flex items-center gap-2">
                <Bell size={14} className="text-[#00A651]" /> Préférences de notifications
              </h3>
              <div className="space-y-3">
                {notifPrefs.map(({ id, label, sub, enabled }) => (
                  <div key={id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-900">{label}</p>
                      <p className="text-xs text-gray-400">{sub}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => toggleNotif(id)}
                      className="relative w-10 h-5 rounded-full transition-colors focus:outline-none cursor-pointer"
                      style={{ background: enabled ? "#00A651" : "#e5e7eb" }}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Sécurité */}
            <div className="bg-white rounded-xl border p-6" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <h3 className="text-gray-900 font-semibold text-sm mb-4 flex items-center gap-2">
                <Shield size={14} className="text-[#00A651]" /> Sécurité
              </h3>
              <p className="text-xs text-gray-500">
                La gestion du mot de passe est assurée par Clerk.
                Modifiez vos informations de sécurité directement depuis votre compte.
              </p>
            </div>

            {/* Danger zone */}
            <div className="bg-red-50 rounded-xl border border-red-100 p-5">
              <h3 className="text-red-700 font-semibold text-sm mb-2 flex items-center gap-2">
                <LogOut size={14} /> Zone de danger
              </h3>
              <p className="text-red-600 text-xs mb-3">La déconnexion met fin à votre session.</p>
              <div className="flex gap-3">
                <SignOutButton>
                  <button className="px-4 py-2 text-xs text-red-600 border border-red-200 rounded-full hover:bg-red-100 transition">
                    Se déconnecter
                  </button>
                </SignOutButton>
                <a href="mailto:contact@nfireport.com?subject=Suppression de compte"
                  className="px-4 py-2 text-xs text-white bg-red-500 rounded-full hover:bg-red-600 transition">
                  Demander la suppression du compte
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
