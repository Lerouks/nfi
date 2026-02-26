import { useParams, Link } from "react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronRight, Filter, Grid, List, SlidersHorizontal, TrendingUp
} from "lucide-react";
import {
  ARTICLES, CATEGORIES, TRENDING_TAGS,
  getArticlesByCategory, formatDate,
} from "../data/mockData";
import { ArticleCard } from "../components/ArticleCard";
import { MarketOverview } from "../components/MarketTicker";
import { NewsletterSignup } from "../components/NewsletterSignup";
import { SubscriptionCTA } from "../components/SubscriptionCTA";

const ITEMS_PER_PAGE = 6;

type SortOption = "recent" | "popular" | "readtime";
type ViewMode = "grid" | "list";
type FilterType = "all" | "free" | "premium";

export default function SectionPage() {
  const { slug } = useParams<{ slug: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);

  // Ref pour ignorer le premier rendu (évite le scroll automatique au chargement)
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    const el = document.getElementById("articles-list");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [filter, sortBy]);

  const category = CATEGORIES.find((c) => c.slug === slug);
  const rawArticles = slug ? getArticlesByCategory(slug) : ARTICLES;

  // If not enough articles, supplement with similar ones from all
  const baseArticles = rawArticles.length >= 3 ? rawArticles : ARTICLES;

  // Filter
  let filtered = baseArticles.filter((a) => {
    if (filter === "free") return !a.isPremium;
    if (filter === "premium") return a.isPremium;
    return true;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "popular") return b.views - a.views;
    if (sortBy === "readtime") return a.readTime - b.readTime;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const displayed = filtered.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = page < totalPages;

  // Mémoïsé — évite le recalcul à chaque render
  const popularArticles = useMemo(
    () => [...ARTICLES].sort((a, b) => b.views - a.views).slice(0, 4),
    []
  );

  if (!category && slug) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-gray-900 text-2xl mb-2">Section introuvable</h1>
          <Link to="/" className="text-[#00A651] hover:underline">← Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Section header */}
      <div className="bg-white border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-[#00A651] transition-colors">Accueil</Link>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium">
              {category?.name ?? "Toutes les actualités"}
            </span>
          </nav>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-gray-900 text-2xl sm:text-3xl">
                {category?.name ?? "Toutes les actualités"}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {filtered.length} article{filtered.length !== 1 ? "s" : ""} · Mis à jour aujourd'hui
              </p>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none mt-5">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={`/section/${cat.slug}`}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-full shrink-0 transition-all font-medium ${
                  cat.slug === slug
                    ? "text-white shadow"
                    : "text-gray-600 bg-gray-100 hover:bg-gray-200"
                }`}
                style={cat.slug === slug ? { background: "#00A651" } : {}}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Articles */}
          <div className="lg:col-span-2">
            {/* Toolbar */}
            <div id="articles-list" className="flex items-center gap-2 mb-5 flex-wrap">
              {/* Filters */}
              <div className="flex gap-1 p-1 bg-white rounded-lg border" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                {(["all", "free", "premium"] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setPage(1); }}
                    className={`px-3 py-1.5 text-xs rounded-md transition-all font-medium ${
                      filter === f ? "text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                    style={filter === f ? { background: "#00A651" } : {}}
                  >
                    {f === "all" ? "Tous" : f === "free" ? "Gratuits" : "Premium"}
                  </button>
                ))}
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1.5 ml-auto">
                <SlidersHorizontal size={14} className="text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value as SortOption); setPage(1); }}
                  className="text-xs border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-[#00A651]"
                  style={{ borderColor: "rgba(0,0,0,0.15)" }}
                >
                  <option value="recent">Plus récents</option>
                  <option value="popular">Plus populaires</option>
                  <option value="readtime">Lecture rapide</option>
                </select>
              </div>

              {/* View toggle */}
              <div className="flex gap-1 p-1 bg-white rounded-lg border" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded transition ${viewMode === "grid" ? "text-white" : "text-gray-500 hover:text-gray-700"}`}
                  style={viewMode === "grid" ? { background: "#00A651" } : {}}
                >
                  <Grid size={14} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded transition ${viewMode === "list" ? "text-white" : "text-gray-500 hover:text-gray-700"}`}
                  style={viewMode === "list" ? { background: "#00A651" } : {}}
                >
                  <List size={14} />
                </button>
              </div>
            </div>

            {/* Article grid/list */}
            {displayed.length === 0 ? (
              <div className="bg-white rounded-xl border p-10 text-center" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                <Filter size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun article trouvé avec ces filtres.</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayed.map((article) => (
                  <ArticleCard key={article.id} article={article} variant="grid" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {displayed.map((article) => (
                  <ArticleCard key={article.id} article={article} variant="horizontal" showExcerpt />
                ))}
              </div>
            )}

            {/* Load more */}
            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="px-8 py-2.5 text-sm font-medium border-2 border-[#00A651] text-[#00A651] rounded-full hover:bg-[#00A651] hover:text-white transition-all"
                >
                  Charger plus d'articles
                </button>
              </div>
            )}

            {/* Pagination indicator */}
            <div className="mt-4 text-center text-xs text-gray-400">
              Affichage {Math.min(displayed.length, filtered.length)} / {filtered.length} articles
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            <MarketOverview />

            {/* Most popular */}
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <h3 className="text-gray-900 font-semibold text-sm mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-red-500" /> Les plus lus
              </h3>
              <div className="space-y-4">
                {popularArticles.map((article, index) => (
                  <div key={article.id} className="flex items-start gap-3 group">
                    <span className="text-xl font-black shrink-0"
                      style={{ color: index === 0 ? "#D4A017" : "#e5e7eb" }}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <Link to={`/article/${article.slug}`}>
                        <p className="text-xs text-gray-900 line-clamp-2 group-hover:text-[#00A651] transition-colors leading-snug">
                          {article.title}
                        </p>
                      </Link>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {article.views.toLocaleString("fr-FR")} vues · {formatDate(article.publishedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <h3 className="text-gray-900 font-semibold text-sm mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {TRENDING_TAGS.slice(0, 12).map((tag) => (
                  <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`}
                    className="px-2.5 py-1 text-xs text-gray-600 bg-gray-100 rounded-full hover:bg-[#00A651] hover:text-white transition-colors">
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>

            <NewsletterSignup variant="compact" />
            <SubscriptionCTA variant="sidebar" />
          </aside>
        </div>
      </div>
    </div>
  );
}