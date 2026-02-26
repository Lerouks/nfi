import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
  Bell, X, Check, CheckCheck, TrendingUp, Newspaper,
  AlertTriangle, Star, Info, Trash2,
} from "lucide-react";

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

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_NOTIFS: Notification[] = [
  {
    id: "1",
    type: "breaking",
    title: "Flash Info",
    body: "La BCEAO relève ses taux directeurs : impact sur le crédit aux PME en zone UEMOA.",
    href: "/article/bceao-taux-directeurs-credit-pme-uemoa",
    time: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
  },
  {
    id: "2",
    type: "market",
    title: "Alerte Marché",
    body: "L'or franchit les 2 900 $/oz. Le FCFA recule légèrement face à l'euro.",
    href: "/section/analyses-de-marche",
    time: new Date(Date.now() - 28 * 60 * 1000),
    read: false,
  },
  {
    id: "3",
    type: "article",
    title: "Nouvel article publié",
    body: "Investissements chinois en Afrique : vers un nouveau paradigme post-Forum de Beijing.",
    href: "/article/investissements-chinois-afrique-forum-beijing",
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
  },
  {
    id: "4",
    type: "premium",
    title: "Contenu Premium",
    body: "Rapport exclusif : Classement des meilleurs environnements d'investissement en Afrique 2026.",
    href: "/article/rapport-classement-environnements-investissement-afrique-2026",
    time: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: "5",
    type: "article",
    title: "Analyse publiée",
    body: "Niamey sous tension : enjeux économiques de la transition politique au Niger.",
    href: "/article/niamey-tension-enjeux-economiques-transition-politique",
    time: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: "6",
    type: "system",
    title: "NFI Report",
    body: "Bienvenue ! Configurez vos préférences de notification dans votre profil.",
    href: "/profile",
    time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    read: true,
  },
];

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
  return `il y a ${diffD} j`;
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

  // Contenu interne partagé entre Link et div
  const inner = (
    <>
      {/* Unread dot */}
      {!notif.read && (
        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#00A651]" />
      )}

      {/* Icône */}
      <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${cfg.bg}`}>
        <Icon size={16} className={cfg.color} />
      </div>

      {/* Texte */}
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

      {/*
        Boutons d'action :
        - pointer-events-none par défaut (évite de bloquer les clics sur le Link quand invisibles)
        - pointer-events-auto uniquement quand visibles au survol
        - stopPropagation + preventDefault pour ne pas déclencher la navigation du Link
      */}
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

  // Si la notification a un lien, on enveloppe tout dans un <Link>
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

  // Sinon, un simple div non cliquable
  return (
    <div className={sharedClass}>
      {inner}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NotificationPanel() {
  const [notifs,  setNotifs]  = useState<Notification[]>(INITIAL_NOTIFS);
  const [open,    setOpen]    = useState(false);
  const [filter,  setFilter]  = useState<"all" | "unread">("all");
  const panelRef              = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter((n) => !n.read).length;

  const displayed = filter === "unread"
    ? notifs.filter((n) => !n.read)
    : notifs;

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

  const markRead    = (id: string) =>
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const markAllRead = () =>
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));

  const deleteNotif = (id: string) =>
    setNotifs((prev) => prev.filter((n) => n.id !== id));

  const clearAll = () => setNotifs([]);

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
        <Bell size={18} />
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
            {displayed.length === 0 ? (
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