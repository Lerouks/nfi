import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { useClerkActive } from "../../lib/clerkActive";
import {
  adminGetAllPaymentRequests,
  adminUpdatePaymentRequest,
  adminSearchProfiles,
  adminUpdateSubscription,
  type PaymentRequest,
  type Profile,
} from "../../lib/supabase";
import { CheckCircle2, XCircle, Search, RefreshCw, ChevronDown, Shield } from "lucide-react";

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

function AdminContent({ userId }: { userId: string | undefined }) {
  const [tab, setTab] = useState<"payments" | "subscribers">("payments");

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
        <div className="flex gap-1 bg-white border rounded-xl p-1 mb-6 w-fit" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          {(["payments", "subscribers"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition ${
                tab === t ? "bg-[#0D1B35] text-white" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {t === "payments" ? "Paiements" : "Abonnés"}
            </button>
          ))}
        </div>

        {tab === "payments" ? <PaymentsTab /> : <SubscribersTab />}
      </div>
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
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    const data = await adminSearchProfiles(search.trim());
    setResults(data);
    setSearching(false);
  };

  const handleUpdateSub = async (userId: string, tier: "free" | "standard" | "premium", months: number) => {
    setActionUserId(userId);
    const ok = await adminUpdateSubscription(userId, tier, months);
    if (ok) {
      setResults((prev) => prev.map((p) => {
        if (p.id !== userId) return p;
        const expiresAt = tier === "free" ? null
          : new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString();
        return { ...p, subscription_tier: tier, subscription_status: tier === "free" ? "canceled" : "active", subscription_expires_at: expiresAt };
      }));
      setExpandedId(null);
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

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par email..."
          className="flex-1 px-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
          style={{ borderColor: "rgba(0,0,0,0.15)" }}
        />
        <button
          type="submit"
          disabled={searching}
          className="px-4 py-2.5 rounded-xl text-sm text-white font-medium flex items-center gap-2 disabled:opacity-60"
          style={{ background: "#00A651" }}
        >
          {searching ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search size={15} />}
          Chercher
        </button>
      </form>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((profile) => (
            <div key={profile.id} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm truncate">{profile.full_name ?? "—"}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TIER_BADGE[profile.subscription_tier]}`}>
                      {profile.subscription_tier}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{profile.email}</p>
                  {profile.subscription_expires_at && (
                    <p className="text-xs text-gray-400">
                      Expire le {new Date(profile.subscription_expires_at).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setExpandedId(expandedId === profile.id ? null : profile.id)}
                  className="flex items-center gap-1 text-xs text-[#00A651] font-medium shrink-0"
                >
                  Modifier <ChevronDown size={13} className={`transition ${expandedId === profile.id ? "rotate-180" : ""}`} />
                </button>
              </div>

              {expandedId === profile.id && (
                <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  {/* Standard */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Passer en Standard</p>
                    <div className="flex flex-wrap gap-2">
                      {DURATIONS.map((d) => (
                        <button
                          key={d.months}
                          disabled={actionUserId === profile.id}
                          onClick={() => handleUpdateSub(profile.id, "standard", d.months)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition disabled:opacity-50"
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Premium */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Passer en Premium</p>
                    <div className="flex flex-wrap gap-2">
                      {DURATIONS.map((d) => (
                        <button
                          key={d.months}
                          disabled={actionUserId === profile.id}
                          onClick={() => handleUpdateSub(profile.id, "premium", d.months)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 transition disabled:opacity-50"
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Free */}
                  <button
                    disabled={actionUserId === profile.id}
                    onClick={() => handleUpdateSub(profile.id, "free", 0)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    Réinitialiser (Free)
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !searching && search && (
        <p className="text-center text-gray-400 text-sm py-8">Aucun abonné trouvé pour "{search}"</p>
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
