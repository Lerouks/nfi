import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import {
  Globe, TrendingUp, MapPin, BarChart2,
  ChevronDown, Search, X, Star, Menu,
  Wrench,
} from "lucide-react";
import { MARKET_DATA, searchArticles } from "../data/mockData";
import logoImg from "@/assets/logo";
import { ClerkNavAuth, ClerkMobileAuth } from "./ClerkNavAuth";
import { NotificationPanel } from "./NotificationPanel";

// ─── Clerk disponible si la clé est configurée ───────────────────────────────
const CLERK_READY =
  typeof import.meta.env.VITE_CLERK_PUBLISHABLE_KEY === "string" &&
  (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string).startsWith("pk_");

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  { label: "Économie Africaine", href: "/section/economie-africaine", icon: Globe },
  { label: "Économie Mondiale",  href: "/section/economie-mondiale",  icon: TrendingUp },
  { label: "Focus Niger",        href: "/section/focus-niger",        icon: MapPin },
  { label: "Analyses de Marché", href: "/section/analyses-de-marche", icon: BarChart2 },
];

// Normalise les deux types de données marchés en un format uniforme pour le ticker
interface TickerItem {
  key: string;
  name: string;
  value: string;
  change: string;
  up: boolean;
}

function buildTickerItems(): TickerItem[] {
  const items: TickerItem[] = [];
  for (const idx of MARKET_DATA.indices) {
    items.push({
      key: idx.name,
      name: idx.name,
      value: idx.value.toLocaleString("fr-FR"),
      change: idx.percent,
      up: idx.change >= 0,
    });
  }
  for (const c of MARKET_DATA.commodities) {
    items.push({
      key: c.name,
      name: c.name,
      value: `${c.value.toLocaleString("fr-FR")} ${c.unit}`,
      change: `${c.change >= 0 ? "+" : ""}${c.change}`,
      up: c.change >= 0,
    });
  }
  return items;
}

const TICKER_ITEMS = buildTickerItems();

// ─── Sub-components ───────────────────────────────────────────────────────────

function TickerRow({ prefix }: { prefix: string }) {
  return (
    <>
      {TICKER_ITEMS.map((item) => (
        <span key={`${prefix}-${item.key}`} className="text-xs flex items-center gap-1.5 shrink-0">
          <span className="text-gray-400 font-medium">{item.name}</span>
          <span className="text-white font-semibold">{item.value}</span>
          <span className={item.up ? "text-[#00A651]" : "text-red-400"}>{item.change}</span>
          <span className="text-gray-600 mx-2">|</span>
        </span>
      ))}
    </>
  );
}

// ─── Smooth ticker band (CSS animation) ──────────────────────────────────────

function TickerBand() {
  const [paused, setPaused] = useState(false);

  return (
    <>
      <style>{`
        @keyframes nfi-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div
        className="overflow-hidden ml-20 cursor-default"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex items-center whitespace-nowrap will-change-transform"
          style={{
            animation: "nfi-ticker 35s linear infinite",
            animationPlayState: paused ? "paused" : "running",
          }}
        >
          <TickerRow prefix="a" />
          <TickerRow prefix="b" />
        </div>
      </div>
    </>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export function Navbar() {
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [searchResults, setSearchResults] = useState<ReturnType<typeof searchArticles>>([]);
  const [scrolled,     setScrolled]     = useState(false);

  const searchRef  = useRef<HTMLDivElement>(null);
  const navigate   = useNavigate();
  const location   = useLocation();

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setSectionsOpen(false);
  }, [location]);

  // Live search
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      setSearchResults(searchArticles(searchQuery).slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Close search on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Close search on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && searchOpen) closeSearch();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      {/* ── Market Ticker ─────────────────────────────────────── */}
      <div className="bg-[#0D1B35] text-white py-1.5 overflow-hidden relative" aria-hidden="true" role="presentation">
        <div
          className="absolute left-0 top-0 h-full flex items-center z-10 px-3"
          style={{ background: "#00A651" }}
        >
          <span className="text-white text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
            Marchés
          </span>
        </div>

        <TickerBand />
      </div>

      {/* ── Main Header ───────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 bg-white border-b transition-shadow ${scrolled ? "shadow-md" : "shadow-sm"}`}
        style={{ borderBottomColor: "rgba(0,0,0,0.08)" }}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden bg-[#0D1B35] shadow-sm">
                <img src={logoImg} alt="NFI REPORT" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block">
                <div className="text-[#0D1B35] font-black text-lg tracking-tight leading-none">
                  NFI <span className="text-[#00A651]">REPORT</span>
                </div>
                <div className="text-[10px] text-gray-500 tracking-widest uppercase">
                  Niger Financial Insights
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/" className="px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 hover:text-[#00A651] transition-colors">
                Accueil
              </Link>
              <div className="relative" onMouseLeave={() => setSectionsOpen(false)}>
                <button
                  className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors ${sectionsOpen ? "text-[#00A651]" : "text-gray-700"}`}
                  onMouseEnter={() => setSectionsOpen(true)}
                  aria-haspopup="true"
                  aria-expanded={sectionsOpen}
                  aria-label="Sections — ouvrir le sous-menu"
                >
                  Sections
                  <ChevronDown size={14} className={`transition-transform ${sectionsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
                {sectionsOpen && (
                  <div className="absolute top-full left-0 mt-1 w-60 bg-white rounded-xl shadow-xl border py-2 z-50" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                    {NAV_SECTIONS.map((item) => (
                      <Link key={item.href} to={item.href} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#00A651] transition-colors">
                        <item.icon size={15} className="text-[#00A651]" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link to="/outils" className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 hover:text-[#00A651] transition-colors">
                <Wrench size={13} className="text-[#00A651]" /> Outils
              </Link>
              <Link to="/subscribe" className="px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 hover:text-[#00A651] transition-colors">
                Abonnement
              </Link>
              <Link to="/about" className="px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 hover:text-[#00A651] transition-colors">
                À propos
              </Link>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-1.5">
              {/* Search trigger — always visible, same size */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 transition text-gray-600 hover:text-[#0D1B35]"
                aria-label="Rechercher"
              >
                <Search size={18} />
              </button>

              {/* Notifications */}
              <NotificationPanel />

              {/* Subscribe CTA */}
              <Link
                to="/subscribe"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-full font-medium transition-all hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(135deg, #00A651, #008c44)" }}
              >
                <Star size={13} /> S'abonner
              </Link>

              {/* User menu */}
              {CLERK_READY ? (
                <ClerkNavAuth />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#0D1B35] flex items-center justify-center opacity-40 cursor-not-allowed" title="Auth non configurée" />
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
                className="p-2 rounded-full hover:bg-gray-100 transition text-gray-600 md:hidden"
              >
                {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Search overlay (pleine largeur, au-dessus du contenu) ── */}
        {searchOpen && (
          <div
            ref={searchRef}
            className="absolute inset-x-0 top-0 h-16 bg-white z-50 flex items-center px-4 sm:px-6 shadow-md"
            style={{ borderBottom: "2px solid #00A651" }}
          >
            <form onSubmit={handleSearch} className="flex items-center w-full gap-3">
              {/* Logo NFI REPORT */}
              <Link to="/" onClick={closeSearch} className="flex items-center gap-2 shrink-0 mr-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden bg-[#0D1B35] shadow-sm">
                  <img src={logoImg} alt="NFI REPORT" className="w-full h-full object-cover" />
                </div>
                <span className="hidden sm:block text-[#0D1B35] font-black text-sm tracking-tight leading-none">
                  NFI <span className="text-[#00A651]">REPORT</span>
                </span>
              </Link>

              {/* Separateur */}
              <div className="w-px h-5 bg-gray-200 shrink-0" />

              <Search size={16} className="text-[#00A651] shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un article, une thématique…"
                className="flex-1 text-sm bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-gray-400 border border-gray-200 rounded">
                Échap
              </kbd>
              <button
                type="button"
                onClick={closeSearch}
                className="p-1.5 rounded-full hover:bg-gray-100 transition shrink-0"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </form>

            {/* Résultats live */}
            {searchResults.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 bg-white border-t shadow-xl py-2 z-50 max-h-80 overflow-y-auto"
                style={{ borderColor: "rgba(0,0,0,0.08)" }}
              >
                {searchResults.map((article) => (
                  <Link
                    key={article.id}
                    to={`/article/${article.slug}`}
                    className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                    onClick={closeSearch}
                  >
                    <img src={article.cover} alt={article.title} className="w-12 h-9 object-cover rounded-lg shrink-0" loading="lazy" />
                    <div>
                      <p className="text-xs text-[#00A651] mb-0.5">{article.category}</p>
                      <p className="text-sm text-gray-800 line-clamp-2">{article.title}</p>
                    </div>
                  </Link>
                ))}
                <button
                  onClick={() => {
                    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                    closeSearch();
                  }}
                  className="w-full px-5 py-2.5 text-xs text-[#00A651] text-center hover:bg-gray-50 transition-colors border-t"
                >
                  Voir tous les résultats pour « {searchQuery} »
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Mobile Menu ───────────────────────────────────────── */}
        {mobileOpen && (
          <div id="mobile-menu" className="md:hidden border-t bg-white px-4 py-4 space-y-1" role="navigation" aria-label="Menu mobile">
            <Link to="/" className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
              Accueil
            </Link>
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sections</div>
              {NAV_SECTIONS.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <item.icon size={14} className="text-[#00A651]" />
                  {item.label}
                </Link>
              ))}
            </div>
            <Link to="/outils" className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
              <Wrench size={14} className="text-[#00A651]" /> Outils Pratiques
            </Link>
            <Link to="/subscribe" className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
              Abonnement
            </Link>
            <Link to="/about" className="block px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
              À propos
            </Link>

            {/* Auth mobile — Clerk si dispo */}
            {CLERK_READY && <ClerkMobileAuth onClose={() => setMobileOpen(false)} />}

            <div className="pt-2">
              <Link
                to="/subscribe"
                className="flex items-center justify-center gap-2 w-full py-2.5 text-sm text-white rounded-full font-medium"
                style={{ background: "linear-gradient(135deg, #00A651, #008c44)" }}
              >
                <Star size={14} /> S'abonner
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}