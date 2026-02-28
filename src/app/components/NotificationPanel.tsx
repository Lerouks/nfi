import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router";
import {
  Bell, X, Check, CheckCheck, TrendingUp, Newspaper,
  AlertTriangle, Star, Info, Trash2, Loader,
} from "lucide-react";
import { getAllArticles, type SanityArticle } from "../../lib/sanity";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType = "breaking" | "article" | "market" | "premium" | "system";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  href?: string;
  time: Date;
  read: boolean;
}

// ─── Persistance localStorage ─────────────────────────────────────────────────

const LS_READ    = "nfi-notifs-read";
const LS_DELETED = "nfi-notifs-deleted";

function loadSet(key: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(key) ?? "[]")); }
  catch { return new Set(); }
}
function saveSet(key: string, s: Set<string>) {
  try { localStorage.setItem(key, JSON.stringify([...s])); } catch { /* noop */ }
}

// ─── Convertit un article Sanity en Notification ──────────────────────────────

function articleToNotif(a: SanityArticle, deleted: Set<string>): Notification | null {
  const id = `art-${a.slug.current}`;
  if (deleted.has(id)) return null;
  const read = loadSet(LS_READ).has(id);
  return {
    id,
    type: a.isPremium ? "premium" : "article",
    title: a.isPremium ? "Contenu Premium" : "Nouvel article publié",
    body: a.title,
    href: `/article/${a.slug.current}`,
    time: new Date(a.publishedAt),
    read,
  };
}

// Notification système unique (bienvenue) — toujours présente sauf si supprimée
const SYSTEM_NOTIF: Omit<Notification, "read"> = {
  id: "sys-welcome",
  type: "system",
  title: "NFI Report",
  body: "Bienvenue ! Configurez vos préférences de notification dans votre profil.",
  href: "/profile",
  time: new Date("2026-01-01"),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  const diffMs  = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)  return "À l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `il y a ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1)  return "Hier";
  if (diffD < 30)   return `il y a ${diffD} j`;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date);
}

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
  breaking: { icon: AlertTriangle, color: "text-red-500",    bg: "bg-red-50" },
  market:   { icon: TrendingUp,    color: "text-blue-500",   bg: "bg-blue-50" },
  article:  { icon: Newspaper,     color: "text-[#00A651]",  bg: "bg-green-50" },
  premium:  { icon: Star,          color: "text-amber-500",  bg: "bg-amber-50" },
  system:   { icon: Info,          color: "text-gray-500",   bg: "bg-gray-100" },
};

// ─── Notification item ────────────────────────────────────────────────────────

function NotifItem({
  notif,
  onRead,
  onDelete,
  onClose,
}: {
  notif: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const cfg  = TYPE_CONFIG[notif.type];
  const Icon = cfg.icon;

  const inner = (
    <>
      {!notif.read && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#00A651]" />
      )}
      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${cfg.bg}`}>
        <Icon size={16} className={cfg.color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs mb-0.5 font-medium ${notif.read ? "text-gray-400" : cfg.color}`}>
          {notif.title}
        </p>
        <p className="text-sm text-gray-700 line-clamp-2 leading-snug">{notif.body}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-[11px] text-gray-400">{formatTime(notif.time)}</p>
          {notif.href && (
            <span className="text-[11px] text-[#00A651] opacity-0 group-hover:opacity-100 transition-opacity">
              → Voir
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 flex flex-col gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
        {!notif.read && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRead(notif.id); }}
            title="Marquer comme lu"
            className="p-1 rounded hover:bg-gray-200 transition-colors"
          >
            <Check size={13} className="text-[#00A651]" />
          </button>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(notif.id); }}
          title="Supprimer"
          className="p-1 rounded hover:bg-red-100 transition-colors"
        >
          <Trash2 size={13} className="text-red-400" />
        </button>
      </div>
    </>
  );

  const sharedClass = `group relative flex gap-3 px-4 py-3 transition-colors ${
    notif.read ? "hover:bg-gray-50" : "bg-[#00A651]/[0.04] hover:bg-[#00A651]/[0.08]"
  }`;

  if (notif.href) {
    return (
      <Link
        to={notif.href}
        onClick={() => { onRead(notif.id); onClose(); }}
        className={sharedClass}
        style={{ textDecoration: "none" }}
      >
        {inner}
      </Link>
    );
  }
  return <div className={sharedClass}>{inner}</div>;
}

// ─── Skeleton de chargement ───────────────────────────────────────────────────

function NotifSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3 animate-pulse">
      <div className="shrink-0 w-9 h-9 rounded-full bg-gray-100" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3 bg-gray-100 rounded w-24" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-2 bg-gray-100 rounded w-16" />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotificationPanel() {
  const [notifs,  setNotifs]  = useState<Notification[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter,  setFilter]  = useState<"all" | "unread">("all");
  const panelRef              = useRef<HTMLDivElement>(null);
  // Pour éviter de re-fetcher si déjà chargé dans cette session
  const fetchedRef            = useRef(false);

  // ── Charger les notifications depuis Sanity ─────────────────────────────
  const loadNotifs = useCallback(async (force = false) => {
    if (fetchedRef.current && !force) return;
    setLoading(true);
    fetchedRef.current = true;

    const deleted = loadSet(LS_DELETED);
    const readSet = loadSet(LS_READ);

    try {
      const articles = await getAllArticles();
      // Limiter aux 15 articles les plus récents
      const articleNotifs = articles
        .slice(0, 15)
        .map((a) => articleToNotif(a, deleted))
        .filter((n): n is Notification => n !== null)
        // Appliquer l'état "lu" depuis localStorage
        .map((n) => ({ ...n, read: readSet.has(n.id) }));

      // Notification système : ajoutée seulement si pas supprimée
      const sysNotifs: Notification[] = deleted.has(SYSTEM_NOTIF.id)
        ? []
        : [{ ...SYSTEM_NOTIF, read: readSet.has(SYSTEM_NOTIF.id) }];

      setNotifs([...articleNotifs, ...sysNotifs]);
    } catch {
      // Fallback : notification système seule
      const deleted = loadSet(LS_DELETED);
      const readSet = loadSet(LS_READ);
      setNotifs(
        deleted.has(SYSTEM_NOTIF.id)
          ? []
          : [{ ...SYSTEM_NOTIF, read: readSet.has(SYSTEM_NOTIF.id) }]
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage (pré-fetch discret)
  useEffect(() => { loadNotifs(); }, [loadNotifs]);

  // Re-fetch à chaque ouverture du panel
  useEffect(() => {
    if (open) loadNotifs(true);
  }, [open, loadNotifs]);

  // Fermer au clic extérieur
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Fermer à l'Échap
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const markRead = (id: string) => {
    const s = loadSet(LS_READ);
    s.add(id);
    saveSet(LS_READ, s);
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    const s = loadSet(LS_READ);
    notifs.forEach((n) => s.add(n.id));
    saveSet(LS_READ, s);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotif = (id: string) => {
    const s = loadSet(LS_DELETED);
    s.add(id);
    saveSet(LS_DELETED, s);
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    const s = loadSet(LS_DELETED);
    notifs.forEach((n) => s.add(n.id));
    saveSet(LS_DELETED, s);
    setNotifs([]);
  };

  const unreadCount = notifs.filter((n) => !n.read).length;
  const displayed   = filter === "unread" ? notifs.filter((n) => !n.read) : notifs;

  return (
    <div className="relative hidden sm:block" ref={panelRef}>
      {/* Cloche */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative p-2 rounded-full transition text-gray-600 hover:text-[#0D1B35] hover:bg-gray-100 ${
          open ? "bg-gray-100 text-[#0D1B35]" : ""
        }`}
        aria-label="Notifications"
      >
        {loading && !open
          ? <Loader size={18} className="animate-spin text-gray-400" />
          : <Bell size={18} />
        }
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center bg-red-500 rounded-full text-white text-[9px] font-bold leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-[min(380px,calc(100vw-1rem))] bg-white rounded-2xl shadow-2xl border z-50 overflow-hidden"
          style={{ borderColor: "rgba(0,0,0,0.09)" }}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-[#0D1B35]" />
              <span className="text-sm font-semibold text-[#0D1B35]">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-red-500">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  title="Tout marquer comme lu"
                  className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#00A651] hover:bg-green-50 rounded-lg transition-colors"
                >
                  <CheckCheck size={13} /> Tout lire
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={14} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-1 px-4 pt-2.5 pb-1.5">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-[#0D1B35] text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {f === "all" ? "Toutes" : `Non lues${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
              </button>
            ))}
          </div>

          {/* Liste */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <>
                <NotifSkeleton />
                <NotifSkeleton />
                <NotifSkeleton />
              </>
            ) : displayed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Bell size={20} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">
                  {filter === "unread" ? "Aucune notification non lue" : "Aucune notification"}
                </p>
              </div>
            ) : (
              displayed.map((notif) => (
                <NotifItem
                  key={notif.id}
                  notif={notif}
                  onRead={markRead}
                  onDelete={deleteNotif}
                  onClose={() => setOpen(false)}
                />
              ))
            )}
          </div>

          {/* Pied de panel */}
          {notifs.length > 0 && (
            <div
              className="flex items-center justify-between px-4 py-2.5 border-t bg-gray-50/60"
              style={{ borderColor: "rgba(0,0,0,0.07)" }}
            >
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="text-xs text-[#00A651] hover:underline"
              >
                Préférences de notification
              </Link>
              <button
                onClick={clearAll}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={11} /> Effacer tout
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
