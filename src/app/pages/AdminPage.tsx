import { useState, useEffect, useCallback } from "react";
import type { ComponentType } from "react";
import { useUser } from "@clerk/clerk-react";
import { useClerkActive } from "../../lib/clerkActive";
import {
  adminGetAllPaymentRequests,
  adminUpdatePaymentRequest,
  adminGetAllProfiles,
  adminUpdateSubscription,
  adminGetDashboard,
  adminGetContactMessages,
  adminMarkContactRead,
  adminGetMarketData,
  adminUpdateMarketItem,
  adminAddMarketItem,
  adminDeleteMarketItem,
  adminGetSections,
  adminUpdateSections,
  setAdminUser,
  type PaymentRequest,
  type Profile,
  type DashboardData,
  type ContactMessage,
  type MarketItem,
  type NavSection,
} from "../../lib/supabase";
import { broadcastMarketUpdate, broadcastSectionsUpdate } from "../../lib/siteData";
import {
  CheckCircle2, XCircle, Search, RefreshCw, ChevronDown, Shield, Loader,
  Users, DollarSign, CreditCard, MessageSquare, Mail, ArrowUp, ArrowDown,
  Plus, Trash2, Save, Edit2, Eye, TrendingUp, Star, Globe,
} from "lucide-react";

// IDs admin séparés par virgule dans VITE_ADMIN_IDS
const ADMIN_IDS = (import.meta.env.VITE_ADMIN_IDS ?? "")
  .split(",")
  .map((s: string) => s.trim())
  .filter(Boolean);

function isAdmin(userId: string | undefined) {
  if (!userId) return false;
  if (ADMIN_IDS.length === 0) return true; // si non configuré, autoriser (dev)
  return ADMIN_IDS.includes(userId);
}

export default function AdminPage() {
  const clerkActive = useClerkActive();
  if (clerkActive) return <AdminWithClerk />;
  return <AdminContent userId={undefined} />;
}

function AdminWithClerk() {
  const { user } = useUser();
  return <AdminContent userId={user?.id} />;
}

type TabId = "dashboard" | "payments" | "subscribers" | "marches" | "sections";

const TAB_LABELS: Record<TabId, string> = {
  dashboard:   "Tableau de bord",
  payments:    "Paiements",
  subscribers: "Abonnés",
  marches:     "Marchés",
  sections:    "Sections",
};

function AdminContent({ userId }: { userId: string | undefined }) {
  const [tab, setTab] = useState<TabId>("dashboard");

  // Initialiser le client admin IMMÉDIATEMENT (avant le rendu des tabs)
  // pour éviter la race condition où les tabs chargent avant setAdminUser.
  if (userId && isAdmin(userId)) setAdminUser(userId);

  // Mode configuration : VITE_ADMIN_IDS non défini → afficher l'ID pour setup
  if (ADMIN_IDS.length === 0 && userId) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center shadow-sm" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <Shield size={32} className="text-[#00A651] mx-auto mb-4" />
          <h1 className="text-gray-900 text-lg font-bold mb-2">Configuration admin</h1>
          <p className="text-gray-500 text-sm mb-4">
            Copiez votre ID ci-dessous et ajoutez-le dans <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.env</code>
          </p>
          <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left">
            <p className="text-xs text-gray-400 mb-1">Votre Clerk user ID :</p>
            <p className="font-mono text-sm text-gray-900 break-all select-all">{userId}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-left">
            <p className="text-xs text-gray-500 font-medium mb-1">Ajoutez dans <code className="text-xs">.env</code> :</p>
            <p className="font-mono text-xs text-blue-700 break-all select-all">VITE_ADMIN_IDS={userId}</p>
          </div>
          <p className="text-xs text-gray-400 mt-4">Puis redémarrez le serveur (<code className="bg-gray-100 px-1 rounded">npm run dev</code>)</p>
        </div>
      </div>
    );
  }

  if (!isAdmin(userId)) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center px-4">
        <div className="text-center">
          <Shield size={40} className="text-gray-300 mx-auto mb-4" />
          <h1 className="text-gray-900 text-xl mb-2">Accès refusé</h1>
          <p className="text-gray-500 text-sm">Vous n'avez pas les droits pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield size={20} className="text-[#00A651]" />
          <h1 className="text-gray-900 text-xl font-bold">Administration NFI REPORT</h1>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-white border rounded-xl p-1 mb-6 w-fit" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          {(Object.keys(TAB_LABELS) as TabId[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t ? "bg-[#0D1B35] text-white" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {tab === "dashboard"   && <DashboardTab />}
        {tab === "payments"    && <PaymentsTab />}
        {tab === "subscribers" && <SubscribersTab />}
        {tab === "marches"     && <MarchesTab />}
        {tab === "sections"    && <SectionsTab />}
      </div>
    </div>
  );
}

// ─── Onglet Tableau de bord ───────────────────────────────────────────────────

function DashboardTab() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [dashboard, msgs] = await Promise.all([
      adminGetDashboard(),
      adminGetContactMessages(),
    ]);
    setData(dashboard);
    setMessages(msgs);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMarkRead = async (id: string) => {
    await adminMarkContactRead(id);
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, is_read: true } : m));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#00A651] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        Impossible de charger le tableau de bord. Vérifiez la configuration Supabase.
        <button onClick={load} className="mt-3 block mx-auto px-4 py-2 rounded-lg text-xs text-gray-600 border border-gray-200 hover:border-gray-300">
          Réessayer
        </button>
      </div>
    );
  }

  const { stats } = data;
  const unread = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Vue globale du site</p>
        <button onClick={load} className="px-3 py-1.5 rounded-lg text-xs text-gray-500 border border-gray-200 hover:border-gray-300 flex items-center gap-1.5 bg-white">
          <RefreshCw size={12} /> Actualiser
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={Users}       label="Utilisateurs"         value={stats.total_users}  color="#0D1B35" />
        <StatCard icon={Star}        label="Premium"              value={stats.premium}       color="#C9A84C" />
        <StatCard icon={TrendingUp}  label="Standard"             value={stats.standard}      color="#3B82F6" />
        <StatCard icon={Globe}       label="Free"                 value={stats.free}          color="#6B7280" />
        <StatCard icon={DollarSign}  label="Revenus vérifiés"     value={`${stats.total_revenue.toLocaleString("fr-FR")} FCFA`} color="#00A651" />
        <StatCard icon={CreditCard}  label="Paiements en attente" value={stats.pending_payments} color="#F59E0B" />
      </div>

      {/* Utilisateurs les plus actifs */}
      {data.active_users.length > 0 && (
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Users size={15} className="text-[#00A651]" /> Utilisateurs les plus actifs
          </h3>
          <div className="space-y-3">
            {data.active_users.map((u, i) => (
              <div key={u.user_id} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-5 text-right font-bold">{i + 1}</span>
                {u.author_avatar ? (
                  <img src={u.author_avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#0D1B35] flex items-center justify-center text-white text-xs font-bold">
                    {u.author_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <span className="text-sm text-gray-800 flex-1">{u.author_name}</span>
                <span className="text-xs text-[#00A651] font-semibold">{u.count} commentaire{u.count > 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Commentaires récents */}
      {data.recent_comments.length > 0 && (
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <MessageSquare size={15} className="text-[#00A651]" /> Commentaires récents
          </h3>
          <div className="space-y-3">
            {data.recent_comments.map((c) => (
              <div key={c.id} className="flex gap-3 pb-3 border-b last:border-b-0 last:pb-0" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                {c.author_avatar ? (
                  <img src={c.author_avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold shrink-0">
                    {c.author_name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-800">{c.author_name}</span>
                    <span className="text-xs text-gray-400">· {c.article_slug}</span>
                    <span className="text-xs text-gray-400">· {new Date(c.created_at).toLocaleString("fr-FR")}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages de contact */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
          <Mail size={15} className="text-[#00A651]" /> Messages de contact
          {unread > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs text-white bg-red-500 font-bold">
              {unread} non lu{unread > 1 ? "s" : ""}
            </span>
          )}
        </h3>
        {messages.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">Aucun message de contact.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl p-4 border ${msg.is_read ? "bg-gray-50" : "bg-amber-50/60"}`}
                style={{ borderColor: msg.is_read ? "rgba(0,0,0,0.06)" : "rgba(251,191,36,0.4)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-semibold text-gray-800">{msg.name}</span>
                      <span className="text-xs text-gray-400">{msg.email}</span>
                      <span className="text-xs text-gray-400">· {new Date(msg.created_at).toLocaleString("fr-FR")}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-700 mb-1">{msg.subject}</p>
                    <p className="text-xs text-gray-600">{msg.message}</p>
                  </div>
                  {!msg.is_read && (
                    <button
                      onClick={() => handleMarkRead(msg.id)}
                      className="shrink-0 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 bg-white border border-gray-200 hover:border-gray-300 flex items-center gap-1.5 transition"
                    >
                      <Eye size={11} /> Lu
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paiements récents */}
      {data.recent_payments.length > 0 && (
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <CreditCard size={15} className="text-[#00A651]" /> Paiements récents
          </h3>
          <div className="space-y-2">
            {data.recent_payments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2 border-b last:border-b-0" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                <StatusBadge status={p.status} />
                <span className="text-sm text-gray-800 flex-1">{p.user_name ?? p.user_email}</span>
                <span className="text-xs text-gray-500">{p.plan_name}</span>
                <span className="text-xs font-semibold text-gray-700">{p.amount.toLocaleString("fr-FR")} FCFA</span>
                <span className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString("fr-FR")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-4" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={15} style={{ color }} />
        </div>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

// ─── Onglet Marchés ──────────────────────────────────────────────────────────

function MarchesTab() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<MarketItem>>({});
  // Chaînes brutes pour champs numériques — évite le reset à 0 lors de la frappe
  const [editRaw, setEditRaw] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState<Omit<MarketItem, "id" | "updated_at" | "is_active">>({
    type: "index", name: "", value: 0, change_abs: 0, change_pct: "+0.00%", unit: null, display_order: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const data = await adminGetMarketData();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEdit = (item: MarketItem) => {
    setEditingId(item.id);
    setEditValues({
      name: item.name, value: item.value, change_abs: item.change_abs,
      change_pct: item.change_pct, unit: item.unit, type: item.type,
      display_order: item.display_order, is_active: item.is_active,
    });
    setEditRaw({
      value: String(item.value),
      change_abs: String(item.change_abs),
      display_order: String(item.display_order),
    });
  };

  const handleSave = async (id: number) => {
    setSaving(id);
    const ok = await adminUpdateMarketItem({ id, ...editValues });
    if (ok) {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, ...editValues } as MarketItem : i));
      setEditingId(null);
      broadcastMarketUpdate();
      showToast("✓ Marché mis à jour et diffusé en temps réel", true);
    } else {
      showToast("Échec de la mise à jour", false);
    }
    setSaving(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cet élément du ticker ?")) return;
    setDeleting(id);
    const ok = await adminDeleteMarketItem(id);
    if (ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      broadcastMarketUpdate();
      showToast("✓ Élément supprimé", true);
    } else {
      showToast("Échec de la suppression", false);
    }
    setDeleting(null);
  };

  const handleAdd = async () => {
    if (!newItem.name.trim()) return;
    setSaving(-1);
    const ok = await adminAddMarketItem(newItem);
    if (ok) {
      await load();
      setAdding(false);
      setNewItem({ type: "index", name: "", value: 0, change_abs: 0, change_pct: "+0.00%", unit: null, display_order: 0 });
      broadcastMarketUpdate();
      showToast("✓ Élément ajouté et diffusé en temps réel", true);
    } else {
      showToast("Échec de l'ajout", false);
    }
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#00A651] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.ok ? "bg-[#00A651]" : "bg-red-500"}`}>
          {toast.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400">{items.length} élément{items.length !== 1 ? "s" : ""} dans le ticker — les modifications sont diffusées instantanément</p>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-1.5 rounded-lg text-xs text-gray-500 border border-gray-200 hover:border-gray-300 flex items-center gap-1.5 bg-white">
            <RefreshCw size={12} /> Actualiser
          </button>
          <button onClick={() => setAdding(true)} className="px-3 py-1.5 rounded-lg text-xs text-white bg-[#00A651] hover:bg-[#008c44] flex items-center gap-1.5 transition">
            <Plus size={12} /> Ajouter
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const isEditing = editingId === item.id;
          return (
            <div key={item.id} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              {!isEditing ? (
                <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${item.type === "index" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>
                    {item.type === "index" ? "Indice" : "Matière"}
                  </span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${item.is_active ? "bg-[#00A651]" : "bg-gray-300"}`} title={item.is_active ? "Actif" : "Inactif"} />
                  <span className="font-semibold text-gray-900 text-sm flex-1 min-w-0 truncate">{item.name}</span>
                  <span className="text-sm text-gray-700">{item.value.toLocaleString("fr-FR")}{item.unit ? ` ${item.unit}` : ""}</span>
                  <span className={`text-xs font-medium ${item.change_abs >= 0 ? "text-[#00A651]" : "text-red-500"}`}>{item.change_pct}</span>
                  <span className="text-xs text-gray-400">#{item.display_order}</span>
                  <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition">
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition disabled:opacity-50"
                  >
                    {deleting === item.id ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-3 bg-gray-50/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Type</label>
                      <select
                        value={editValues.type ?? item.type}
                        onChange={(e) => setEditValues((v) => ({ ...v, type: e.target.value as "index" | "commodity" }))}
                        className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651]"
                        style={{ borderColor: "rgba(0,0,0,0.15)" }}
                      >
                        <option value="index">Indice</option>
                        <option value="commodity">Matière première</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nom</label>
                      <input
                        value={editValues.name ?? item.name}
                        onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                        className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651]"
                        style={{ borderColor: "rgba(0,0,0,0.15)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Valeur</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editRaw.value ?? String(editValues.value ?? item.value)}
                        onChange={(e) => {
                          setEditRaw((r) => ({ ...r, value: e.target.value }));
                          const n = parseFloat(e.target.value);
                          if (!isNaN(n)) setEditValues((v) => ({ ...v, value: n }));
                        }}
                        className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651]"
                        style={{ borderColor: "rgba(0,0,0,0.15)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Variation absolue</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editRaw.change_abs ?? String(editValues.change_abs ?? item.change_abs)}
                        onChange={(e) => {
                          setEditRaw((r) => ({ ...r, change_abs: e.target.value }));
                          const n = parseFloat(e.target.value);
                          if (!isNaN(n)) setEditValues((v) => ({ ...v, change_abs: n }));
                        }}
                        className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651]"
                        style={{ borderColor: "rgba(0,0,0,0.15)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Variation % (ex: +1.23%)</label>
                      <input
                        value={editValues.change_pct ?? item.change_pct}
                        onChange={(e) => setEditValues((v) => ({ ...v, change_pct: e.target.value }))}
                        className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651]"
                        style={{ borderColor: "rgba(0,0,0,0.15)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Unité (ex: $/oz)</label>
                      <input
                        value={editValues.unit ?? item.unit ?? ""}
                        onChange={(e) => setEditValues((v) => ({ ...v, unit: e.target.value || null }))}
                        placeholder="Optionnel"
                        className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651]"
                        style={{ borderColor: "rgba(0,0,0,0.15)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Ordre d'affichage</label>
                      <input
                        type="number"
                        step="1"
                        value={editRaw.display_order ?? String(editValues.display_order ?? item.display_order)}
                        onChange={(e) => {
                          setEditRaw((r) => ({ ...r, display_order: e.target.value }));
                          const n = parseInt(e.target.value);
                          if (!isNaN(n)) setEditValues((v) => ({ ...v, display_order: n }));
                        }}
                        className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651]"
                        style={{ borderColor: "rgba(0,0,0,0.15)" }}
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-4">
                      <label className="text-xs text-gray-500">Actif dans le ticker</label>
                      <button
                        type="button"
                        onClick={() => setEditValues((v) => ({ ...v, is_active: !(v.is_active ?? item.is_active) }))}
                        className={`relative w-10 h-5 rounded-full transition ${(editValues.is_active ?? item.is_active) ? "bg-[#00A651]" : "bg-gray-300"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${(editValues.is_active ?? item.is_active) ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleSave(item.id)}
                      disabled={saving === item.id}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#00A651] hover:bg-[#008c44] transition disabled:opacity-50"
                    >
                      {saving === item.id ? <Loader size={12} className="animate-spin" /> : <Save size={12} />}
                      Enregistrer
                    </button>
                    <button onClick={() => { setEditingId(null); setEditRaw({}); }} className="px-4 py-2 rounded-lg text-xs text-gray-600 border border-gray-200 hover:border-gray-300 transition">
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Formulaire ajout */}
      {adding && (
        <div className="mt-4 bg-white rounded-xl border p-4 space-y-3" style={{ borderColor: "rgba(0,0,0,0.08)", borderStyle: "dashed" }}>
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Plus size={14} className="text-[#00A651]" /> Nouvel élément
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Type</label>
              <select
                value={newItem.type}
                onChange={(e) => setNewItem((v) => ({ ...v, type: e.target.value as "index" | "commodity" }))}
                className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651]"
                style={{ borderColor: "rgba(0,0,0,0.15)" }}
              >
                <option value="index">Indice</option>
                <option value="commodity">Matière première</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nom *</label>
              <input
                value={newItem.name}
                onChange={(e) => setNewItem((v) => ({ ...v, name: e.target.value }))}
                placeholder="ex: CAC 40"
                className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651]"
                style={{ borderColor: "rgba(0,0,0,0.15)" }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Valeur</label>
              <input
                type="number"
                value={newItem.value}
                onChange={(e) => setNewItem((v) => ({ ...v, value: parseFloat(e.target.value) || 0 }))}
                className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651]"
                style={{ borderColor: "rgba(0,0,0,0.15)" }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Variation absolue</label>
              <input
                type="number"
                value={newItem.change_abs}
                onChange={(e) => setNewItem((v) => ({ ...v, change_abs: parseFloat(e.target.value) || 0 }))}
                className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651]"
                style={{ borderColor: "rgba(0,0,0,0.15)" }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Variation % (texte)</label>
              <input
                value={newItem.change_pct}
                onChange={(e) => setNewItem((v) => ({ ...v, change_pct: e.target.value }))}
                placeholder="+1.23%"
                className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651]"
                style={{ borderColor: "rgba(0,0,0,0.15)" }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Unité (optionnel)</label>
              <input
                value={newItem.unit ?? ""}
                onChange={(e) => setNewItem((v) => ({ ...v, unit: e.target.value || null }))}
                placeholder="ex: $/oz"
                className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651]"
                style={{ borderColor: "rgba(0,0,0,0.15)" }}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ordre d'affichage</label>
              <input
                type="number"
                value={newItem.display_order}
                onChange={(e) => setNewItem((v) => ({ ...v, display_order: parseInt(e.target.value) || 0 }))}
                className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651]"
                style={{ borderColor: "rgba(0,0,0,0.15)" }}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={saving === -1 || !newItem.name.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#00A651] hover:bg-[#008c44] transition disabled:opacity-50"
            >
              {saving === -1 ? <Loader size={12} className="animate-spin" /> : <Plus size={12} />}
              Ajouter
            </button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 rounded-lg text-xs text-gray-600 border border-gray-200 hover:border-gray-300 transition">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Onglet Sections ──────────────────────────────────────────────────────────

const ICON_OPTIONS = ["Globe", "TrendingUp", "MapPin", "BarChart2", "Star", "Zap", "BookOpen", "Target", "Compass"];

function SectionsTab() {
  const [sections, setSections] = useState<NavSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await adminGetSections();
    setSections(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const ok = await adminUpdateSections(sections);
    if (ok) {
      broadcastSectionsUpdate();
      showToast("✓ Sections enregistrées et diffusées en temps réel", true);
    } else {
      showToast("Échec de l'enregistrement", false);
    }
    setSaving(false);
  };

  const updateSection = (idx: number, field: keyof NavSection, value: string) => {
    setSections((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setSections((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    setSections((prev) => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const deleteSection = (idx: number) => {
    setSections((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSection = () => {
    setSections((prev) => [...prev, { label: "Nouvelle section", slug: `section-${Date.now()}`, icon: "Globe" }]);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-[#00A651] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.ok ? "bg-[#00A651]" : "bg-red-500"}`}>
          {toast.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-400">{sections.length} section{sections.length !== 1 ? "s" : ""} — cliquez "Enregistrer tout" pour diffuser les changements</p>
        <div className="flex gap-2">
          <button onClick={addSection} className="px-3 py-1.5 rounded-lg text-xs text-white bg-[#0D1B35] hover:bg-[#1a2d5a] flex items-center gap-1.5 transition">
            <Plus size={12} /> Ajouter
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#00A651] hover:bg-[#008c44] flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {saving ? <Loader size={12} className="animate-spin" /> : <Save size={12} />}
            Enregistrer tout
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-xl border p-4" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Libellé (menu)</label>
                <input
                  value={section.label}
                  onChange={(e) => updateSection(idx, "label", e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651]"
                  style={{ borderColor: "rgba(0,0,0,0.15)" }}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Slug (URL)</label>
                <input
                  value={section.slug}
                  onChange={(e) => updateSection(idx, "slug", e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651] font-mono text-xs"
                  style={{ borderColor: "rgba(0,0,0,0.15)" }}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Icône</label>
                <select
                  value={section.icon}
                  onChange={(e) => updateSection(idx, "icon", e.target.value)}
                  className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00A651]"
                  style={{ borderColor: "rgba(0,0,0,0.15)" }}
                >
                  {ICON_OPTIONS.map((ico) => (
                    <option key={ico} value={ico}>{ico}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-1.5 mt-3 justify-end">
              <button onClick={() => moveUp(idx)} disabled={idx === 0} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition" title="Monter">
                <ArrowUp size={13} />
              </button>
              <button onClick={() => moveDown(idx)} disabled={idx === sections.length - 1} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition" title="Descendre">
                <ArrowDown size={13} />
              </button>
              <button onClick={() => deleteSection(idx)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition" title="Supprimer">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {sections.length > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#00A651] hover:bg-[#008c44] flex items-center gap-2 transition disabled:opacity-50"
          >
            {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            Enregistrer et diffuser
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Onglet Paiements ─────────────────────────────────────────────────────────

function PaymentsTab() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("pending");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ id: string; action: "verified" | "rejected" } | null>(null);
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await adminGetAllPaymentRequests();
    setRequests(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const handleAction = async (id: string, status: "verified" | "rejected", adminNote?: string) => {
    setActionId(id);
    await adminUpdatePaymentRequest(id, status, adminNote);
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status, admin_note: adminNote ?? null } : r));
    setActionId(null);
    setNoteModal(null);
    setNote("");
  };

  const METHOD_LABELS: Record<string, string> = {
    "orange-money": "Orange Money", wave: "Wave", moov: "Moov Money",
    nita: "NITA", amana: "AMANA", card: "Carte bancaire",
  };

  return (
    <div>
      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["pending", "all", "verified", "rejected"] as const).map((f) => {
          const count = f === "all" ? requests.length : requests.filter((r) => r.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                filter === f ? "bg-[#0D1B35] text-white border-[#0D1B35]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {f === "all" ? "Tous" : f === "pending" ? "En attente" : f === "verified" ? "Vérifiés" : "Rejetés"} ({count})
            </button>
          );
        })}
        <button onClick={load} className="ml-auto px-3 py-1.5 rounded-full text-xs text-gray-500 border border-gray-200 hover:border-gray-300 flex items-center gap-1.5 bg-white">
          <RefreshCw size={12} /> Actualiser
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#00A651] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          Aucune demande {filter !== "all" ? `"${filter === "pending" ? "en attente" : filter}"` : ""}.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div key={req.id} className="bg-white rounded-xl border p-4 sm:p-5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{req.user_name ?? "—"}</span>
                    <span className="text-gray-400 text-xs">{req.user_email}</span>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(req.created_at).toLocaleString("fr-FR")} · <strong>{req.plan_name}</strong> · {req.amount.toLocaleString("fr-FR")} FCFA
                    {req.promo_code && <span className="ml-1 text-[#00A651]">· Code: {req.promo_code}</span>}
                  </p>
                  <p className="text-xs text-gray-400">
                    {METHOD_LABELS[req.payment_method] ?? req.payment_method}
                    {req.phone_number && ` · ${req.phone_number}`}
                    {req.reference_number && ` · Réf: ${req.reference_number}`}
                  </p>
                  {req.admin_note && (
                    <p className="text-xs text-amber-600 mt-1">Note: {req.admin_note}</p>
                  )}
                </div>

                {req.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      disabled={actionId === req.id}
                      onClick={() => setNoteModal({ id: req.id, action: "verified" })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#00A651] hover:bg-[#008c44] transition disabled:opacity-50"
                    >
                      <CheckCircle2 size={13} /> Valider
                    </button>
                    <button
                      disabled={actionId === req.id}
                      onClick={() => setNoteModal({ id: req.id, action: "rejected" })}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50"
                    >
                      <XCircle size={13} /> Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal note */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-gray-900 mb-3">
              {noteModal.action === "verified" ? "Valider le paiement" : "Rejeter le paiement"}
            </h3>
            <p className="text-xs text-gray-500 mb-3">Note optionnelle (visible dans l'historique)</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: Reçu Orange Money confirmé le..."
              rows={3}
              className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651] resize-none"
              style={{ borderColor: "rgba(0,0,0,0.15)" }}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setNoteModal(null); setNote(""); }}
                className="flex-1 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 hover:border-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={() => handleAction(noteModal.id, noteModal.action, note || undefined)}
                className={`flex-1 py-2 rounded-lg text-sm text-white font-medium ${
                  noteModal.action === "verified" ? "bg-[#00A651] hover:bg-[#008c44]" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Onglet Abonnés ───────────────────────────────────────────────────────────

function SubscribersTab() {
  const [search, setSearch] = useState("");
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Durée sélectionnée par utilisateur (userId → months)
  const [selectedMonths, setSelectedMonths] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const data = await adminGetAllProfiles();
    setAllProfiles(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const displayed = search.trim()
    ? allProfiles.filter((p) =>
        (p.email ?? "").toLowerCase().includes(search.trim().toLowerCase()) ||
        (p.full_name ?? "").toLowerCase().includes(search.trim().toLowerCase())
      )
    : allProfiles;

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUpdateSub = async (userId: string, tier: "free" | "standard" | "premium", months: number) => {
    setActionUserId(userId);
    const ok = await adminUpdateSubscription(userId, tier, months);
    if (ok) {
      const expiresAt = tier === "free" ? null
        : new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString();
      setAllProfiles((prev) => prev.map((p) =>
        p.id !== userId ? p
          : { ...p, subscription_tier: tier, subscription_status: tier === "free" ? "canceled" : "active", subscription_expires_at: expiresAt }
      ));
      setExpandedId(null);
      const tierLabel = tier === "free" ? "Free" : tier.charAt(0).toUpperCase() + tier.slice(1);
      const monthLabel = months === 12 ? "1 an" : months === 1 ? "1 mois" : `${months} mois`;
      showToast(`✓ ${tierLabel}${tier !== "free" ? ` — ${monthLabel}` : ""} appliqué`, true);
    } else {
      showToast("Échec. Vérifiez la console (F12).", false);
    }
    setActionUserId(null);
  };

  const TIER_BADGE: Record<string, string> = {
    free: "bg-gray-100 text-gray-500",
    standard: "bg-blue-50 text-blue-600",
    premium: "bg-amber-50 text-amber-600",
  };

  const DURATIONS = [
    { months: 1, label: "1 mois" },
    { months: 3, label: "3 mois" },
    { months: 6, label: "6 mois" },
    { months: 12, label: "1 an" },
  ];

  const tierOrder: Record<string, number> = { premium: 0, standard: 1, free: 2 };
  const sorted = [...displayed].sort((a, b) =>
    (tierOrder[a.subscription_tier] ?? 3) - (tierOrder[b.subscription_tier] ?? 3)
  );

  return (
    <div>
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${toast.ok ? "bg-[#00A651]" : "bg-red-500"}`}>
          {toast.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer par email ou nom..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
            style={{ borderColor: "rgba(0,0,0,0.15)" }}
          />
        </div>
        <button
          onClick={loadAll}
          className="px-3 py-2.5 rounded-xl text-sm text-gray-500 border border-gray-200 hover:border-gray-300 flex items-center gap-1.5 bg-white"
          style={{ borderColor: "rgba(0,0,0,0.10)" }}
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {!loading && (
        <p className="text-xs text-gray-400 mb-3">
          {sorted.length} abonné{sorted.length !== 1 ? "s" : ""}
          {search.trim() ? ` trouvé${sorted.length !== 1 ? "s" : ""} pour "${search.trim()}"` : " au total"}
          {" · "}{allProfiles.filter((p) => p.subscription_tier !== "free").length} payant{allProfiles.filter((p) => p.subscription_tier !== "free").length !== 1 ? "s" : ""}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#00A651] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          {search.trim() ? `Aucun résultat pour "${search.trim()}"` : "Aucun abonné enregistré."}
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((profile) => {
            const months = selectedMonths[profile.id] ?? 1;
            const isLoading = actionUserId === profile.id;
            return (
              <div key={profile.id} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm truncate">{profile.full_name ?? "—"}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TIER_BADGE[profile.subscription_tier] ?? "bg-gray-100 text-gray-500"}`}>
                        {profile.subscription_tier}
                      </span>
                      {profile.subscription_status === "active" && profile.subscription_tier !== "free" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00A651] inline-block" title="Actif" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{profile.email}</p>
                    {profile.subscription_expires_at && (
                      <p className="text-xs text-gray-400">
                        Expire le {new Date(profile.subscription_expires_at).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const next = expandedId === profile.id ? null : profile.id;
                      setExpandedId(next);
                      if (next && !selectedMonths[profile.id]) {
                        setSelectedMonths((prev) => ({ ...prev, [profile.id]: 1 }));
                      }
                    }}
                    className="flex items-center gap-1 text-xs text-[#00A651] font-medium shrink-0 px-2 py-1 rounded-lg hover:bg-green-50 transition"
                  >
                    Modifier <ChevronDown size={13} className={`transition ${expandedId === profile.id ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {expandedId === profile.id && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-3 bg-gray-50/50" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    {/* Sélecteur de durée */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Durée</p>
                      <div className="flex flex-wrap gap-2">
                        {DURATIONS.map((d) => (
                          <button
                            key={d.months}
                            onClick={() => setSelectedMonths((prev) => ({ ...prev, [profile.id]: d.months }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                              months === d.months
                                ? "bg-[#0D1B35] text-white border-[#0D1B35]"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        disabled={isLoading}
                        onClick={() => handleUpdateSub(profile.id, "standard", months)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {isLoading ? <Loader size={12} className="animate-spin" /> : null}
                        Passer en Standard
                      </button>
                      <button
                        disabled={isLoading}
                        onClick={() => handleUpdateSub(profile.id, "premium", months)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition disabled:opacity-50"
                      >
                        {isLoading ? <Loader size={12} className="animate-spin" /> : null}
                        Passer en Premium
                      </button>
                      <button
                        disabled={isLoading}
                        onClick={() => handleUpdateSub(profile.id, "free", 0)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50"
                      >
                        {isLoading ? <Loader size={12} className="animate-spin" /> : null}
                        Réinitialiser (Free)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Badge statut ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: PaymentRequest["status"] }) {
  const styles: Record<string, string> = {
    pending:  "bg-amber-50 text-amber-600",
    verified: "bg-green-50 text-green-600",
    rejected: "bg-red-50 text-red-500",
    refunded: "bg-gray-100 text-gray-500",
  };
  const labels: Record<string, string> = {
    pending: "En attente", verified: "Vérifié", rejected: "Rejeté", refunded: "Remboursé",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
