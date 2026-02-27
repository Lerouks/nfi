import { useState } from "react";
import { Link } from "react-router";
import {
  User, BookOpen, CreditCard, Settings, Bell, LogOut,
  Edit3, Star, CheckCircle2, Clock, Eye, Shield,
  ChevronRight, Calendar,
} from "lucide-react";
import { MOCK_USER, SUBSCRIPTION_PLANS, formatDate } from "../data/mockData";
import { ArticleCard } from "../components/ArticleCard";
import { SignInButton, useUser } from "@clerk/clerk-react";
import { useSavedArticles } from "../../lib/savedArticles";
import { useSearchParams } from "react-router";

// ─── Vérification Clerk ───────────────────────────────────────────────────────
const CLERK_READY =
  typeof import.meta.env.VITE_CLERK_PUBLISHABLE_KEY === "string" &&
  (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string).startsWith("pk_");

type Tab = "overview" | "saved" | "subscription" | "settings";

// ─── Wrapper Clerk (hooks appelés uniquement quand ClerkProvider est actif) ───
function ProfileWithClerk() {
  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#00A651] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <NotSignedInScreen />;
  }

  // Enrichir MOCK_USER avec les données Clerk réelles
  const clerkUser = {
    ...MOCK_USER,
    name: user.fullName ?? MOCK_USER.name,
    email: user.primaryEmailAddress?.emailAddress ?? MOCK_USER.email,
    avatar: user.imageUrl ?? MOCK_USER.avatar,
  };

  return <ProfileContent user={clerkUser} isLoggedIn={true} />;
}

// ─── Écran non connecté ────────────────────────────────────────────────────────
function NotSignedInScreen() {
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
          {CLERK_READY ? (
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
            <p className="text-gray-400 text-xs">Auth non configurée</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page profil principale ───────────────────────────────────────────────────
export default function ProfilePage() {
  if (CLERK_READY) return <ProfileWithClerk />;
  // Fallback sans Clerk : mock connecté (comportement original)
  return <ProfileContent user={MOCK_USER} isLoggedIn={true} />;
}

// ─── Contenu du profil (design inchangé) ─────────────────────────────────────
function ProfileContent({
  user,
  isLoggedIn,
}: {
  user: typeof MOCK_USER;
  isLoggedIn: boolean;
}) {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get("tab") as Tab) || "overview");
  const { savedArticles } = useSavedArticles();

  // ── Préférences de notifications (état mutable) ──────────────────────────
  const [notifPrefs, setNotifPrefs] = useState([
    { id: "newsletter",  label: "Newsletter quotidienne",  sub: "Résumé des actualités chaque matin",       enabled: true  },
    { id: "breaking",    label: "Alertes breaking news",   sub: "Nouvelles urgentes en temps réel",         enabled: true  },
    { id: "reports",     label: "Rapports financiers",     sub: "Nouveaux rapports premium disponibles",    enabled: false },
    { id: "comments",    label: "Commentaires",            sub: "Réponses à vos commentaires",              enabled: true  },
  ]);

  const toggleNotif = (id: string) =>
    setNotifPrefs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );

  const plan = SUBSCRIPTION_PLANS.find((p) => p.name === user.subscription);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setTimeout(() => {
      document.getElementById("profile-tab-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 30);
  };

  const tabs = [
    { id: "overview" as Tab, label: "Vue d'ensemble", Icon: User },
    { id: "saved" as Tab, label: "Articles sauvegardés", Icon: BookOpen },
    { id: "subscription" as Tab, label: "Abonnement", Icon: CreditCard },
    { id: "settings" as Tab, label: "Paramètres", Icon: Settings },
  ];

  if (!isLoggedIn) return <NotSignedInScreen />;

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Profile header */}
      <div className="bg-white border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={user.avatar} alt={user.name}
                className="w-16 h-16 rounded-full object-cover border-4 border-white shadow" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00A651] rounded-full border-2 border-white" />
            </div>
            <div>
              <h1 className="text-gray-900 text-xl font-bold">{user.name}</h1>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                  style={{ background: "#C9A84C" }}>
                  <Star size={10} /> {user.subscription}
                </span>
                <span className="text-xs text-gray-400">
                  Membre depuis {new Date(user.joinedAt).getFullYear()}
                </span>
              </div>
            </div>
            <button className="ml-auto p-2 rounded-full hover:bg-gray-100 transition text-gray-600">
              <Edit3 size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none mt-5 -mb-px">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => switchTab(id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-t-lg border-b-2 transition-all shrink-0 ${
                  activeTab === id
                    ? "border-b-2 bg-white"
                    : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
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
            {/* Stats */}
            <div className="lg:col-span-2 space-y-5">
              {/* Stats cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Articles lus", value: user.readArticles, Icon: Eye },
                  { label: "Articles sauvegardés", value: savedArticles.length, Icon: BookOpen },
                  { label: "Commentaires", value: 12, Icon: Bell },
                  { label: "Jours membres", value: Math.floor((Date.now() - new Date(user.joinedAt).getTime()) / 86400000), Icon: Calendar },
                ].map(({ label, value, Icon }) => (
                  <div key={label} className="bg-white rounded-xl border p-4 text-center" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                    <Icon size={18} className="text-[#00A651] mx-auto mb-2" />
                    <div className="text-xl font-black text-gray-900">{value}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Recent activity */}
              <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                <h3 className="text-gray-900 font-semibold text-sm mb-4">Activité récente</h3>
                <div className="space-y-3">
                  {[
                    { action: "Article lu", title: "La BCEAO relève ses taux directeurs", time: "Il y a 2 heures", icon: Eye },
                    { action: "Article sauvegardé", title: "Niger : le secteur minier post-coup d'État", time: "Il y a 1 jour", icon: BookOpen },
                    { action: "Commentaire publié", title: "Investissements chinois en Afrique", time: "Il y a 3 jours", icon: Bell },
                  ].map(({ action, title, time, icon: Icon }) => (
                    <div key={title} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#00A651]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon size={13} className="text-[#00A651]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">{action}</p>
                        <p className="text-sm text-gray-900 line-clamp-1">{title}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar: subscription summary */}
            <div className="space-y-4">
              <div className="bg-[#0D1B35] rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Star size={14} className="text-[#00A651]" />
                  <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Mon abonnement</span>
                </div>
                <p className="text-white font-bold text-lg">{user.subscription}</p>
                <p className="text-gray-400 text-xs mb-3">
                  Expire le {formatDate(user.subscriptionExpiry)}
                </p>
                <div className="w-full bg-white/10 rounded-full h-1.5 mb-3">
                  <div className="h-1.5 rounded-full" style={{ width: "65%", background: "#00A651" }} />
                </div>
                <p className="text-gray-400 text-xs mb-4">65% de la période utilisée</p>
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
                    { label: "Abonnement", tab: "subscription" as Tab, Icon: CreditCard },
                    { label: "Paramètres", tab: "settings" as Tab, Icon: Settings },
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
                <Link to="/" className="text-[#00A651] hover:underline text-sm">
                  Parcourir les articles →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {savedArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} variant="horizontal" showExcerpt />
                ))}
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

            {/* Current plan */}
            <div className="bg-white rounded-xl border p-6 mb-5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">{user.subscription}</span>
                    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full text-white bg-[#00A651]">
                      <CheckCircle2 size={10} /> Actif
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mt-0.5">
                    Renouvellement automatique le {formatDate(user.subscriptionExpiry)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-gray-900">5 000</p>
                  <p className="text-xs text-gray-400">FCFA / mois</p>
                </div>
              </div>

              {plan && (
                <div className="border-t pt-4" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Inclus dans votre plan</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-[#00A651] shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-700">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-5">
                <Link to="/subscribe"
                  className="flex-1 py-2.5 text-sm font-medium text-white rounded-full text-center transition hover:opacity-90"
                  style={{ background: "#00A651" }}>
                  Passer en Premium
                </Link>
                <button className="flex-1 py-2.5 text-sm font-medium text-gray-600 rounded-full border border-gray-200 hover:bg-gray-50 transition">
                  Annuler l'abonnement
                </button>
              </div>
            </div>

            {/* Billing history */}
            <div className="bg-white rounded-xl border p-6" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <h3 className="text-gray-900 font-semibold text-sm mb-4">Historique de paiements</h3>
              <div className="space-y-3">
                {[
                  { date: "01 Fév 2026", amount: "5 000 FCFA", status: "Payé", method: "Orange Money" },
                  { date: "01 Jan 2026", amount: "5 000 FCFA", status: "Payé", method: "Orange Money" },
                  { date: "01 Déc 2025", amount: "5 000 FCFA", status: "Payé", method: "Orange Money" },
                ].map(({ date, amount, status, method }) => (
                  <div key={date} className="flex items-center justify-between py-2 border-b last:border-0"
                    style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <div>
                      <p className="text-sm text-gray-900">{date}</p>
                      <p className="text-xs text-gray-400">{method}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{amount}</p>
                      <span className="text-xs text-green-600 font-medium">{status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================== SETTINGS ===================== */}
        {activeTab === "settings" && (
          <div className="max-w-xl space-y-5">
            {/* Profile info */}
            <div className="bg-white rounded-xl border p-6" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <h3 className="text-gray-900 font-semibold text-sm mb-4 flex items-center gap-2">
                <User size={14} className="text-[#00A651]" /> Informations personnelles
              </h3>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Prénom</label>
                    <input type="text" defaultValue="Oumarou"
                      className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
                      style={{ borderColor: "rgba(0,0,0,0.15)" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Nom</label>
                    <input type="text" defaultValue="Sanda"
                      className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
                      style={{ borderColor: "rgba(0,0,0,0.15)" }} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
                  <input type="email" defaultValue={user.email}
                    className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
                    style={{ borderColor: "rgba(0,0,0,0.15)" }} />
                </div>
                <button type="submit"
                  className="px-6 py-2.5 text-sm text-white font-medium rounded-full transition hover:opacity-90"
                  style={{ background: "#00A651" }}>
                  Enregistrer les modifications
                </button>
              </form>
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
                    {/* Toggle interactif */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => toggleNotif(id)}
                      className="relative w-10 h-5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A651]/50 cursor-pointer"
                      style={{ background: enabled ? "#00A651" : "#e5e7eb" }}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                          enabled ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-xl border p-6" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <h3 className="text-gray-900 font-semibold text-sm mb-4 flex items-center gap-2">
                <Shield size={14} className="text-[#00A651]" /> Sécurité
              </h3>
              <button className="w-full text-left px-4 py-3 rounded-lg border hover:bg-gray-50 transition text-sm text-gray-700"
                style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                Changer le mot de passe
              </button>
            </div>

            {/* Danger zone */}
            <div className="bg-red-50 rounded-xl border border-red-100 p-5">
              <h3 className="text-red-700 font-semibold text-sm mb-2 flex items-center gap-2">
                <LogOut size={14} /> Zone de danger
              </h3>
              <p className="text-red-600 text-xs mb-3">Ces actions sont irréversibles.</p>
              <div className="flex gap-3">
                <button className="px-4 py-2 text-xs text-red-600 border border-red-200 rounded-full hover:bg-red-100 transition">
                  Se déconnecter
                </button>
                <button className="px-4 py-2 text-xs text-white bg-red-500 rounded-full hover:bg-red-600 transition">
                  Supprimer le compte
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}