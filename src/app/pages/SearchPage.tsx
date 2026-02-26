import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router";
import { Search, Filter, X, TrendingUp } from "lucide-react";
import { searchArticles, CATEGORIES, TRENDING_TAGS, ARTICLES } from "../data/mockData";
import { ArticleCard } from "../components/ArticleCard";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(query);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<"all" | "free" | "premium">("all");

  const results = query ? searchArticles(query) : [];

  const filtered = results.filter((a) => {
    const catMatch = selectedCategory === "all" || a.categorySlug === selectedCategory;
    const typeMatch = selectedType === "all" || (selectedType === "free" ? !a.isPremium : a.isPremium);
    return catMatch && typeMatch;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
    }
  };

  useEffect(() => {
    setInputValue(query);
  }, [query]);

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Search header */}
      <div className="bg-white border-b py-6 sm:py-8 px-4" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Rechercher des articles, analyses, auteurs..."
                className="w-full pl-11 pr-12 py-3.5 text-sm border rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651] focus:bg-white"
                style={{ borderColor: "rgba(0,0,0,0.15)" }}
                autoFocus
              />
              {inputValue && (
                <button type="button"
                  onClick={() => { setInputValue(""); setSearchParams({}); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="flex justify-center mt-3">
              <button type="submit"
                className="px-8 py-2 text-sm text-white font-medium rounded-full transition hover:opacity-90"
                style={{ background: "#C9A84C" }}>
                Rechercher
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Trending tags */}
        {!query && (
          <div className="mb-8">
            <h3 className="text-gray-900 font-semibold text-sm mb-3 flex items-center gap-2">
              <TrendingUp size={14} className="text-[#00A651]" /> Recherches populaires
            </h3>
            <div className="flex flex-wrap gap-2">
              {TRENDING_TAGS.map((tag) => (
                <button key={tag}
                  onClick={() => { setSearchParams({ q: tag }); setInputValue(tag); }}
                  className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-black/[0.12] rounded-full transition-all hover:bg-[#00A651] hover:text-white hover:border-[#00A651]"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {query ? (
          <>
            {/* Results header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <p className="text-gray-600 text-sm">
                <span className="font-bold text-gray-900">{filtered.length}</span> résultat{filtered.length !== 1 ? "s" : ""} pour{" "}
                <span className="font-bold text-[#00A651]">"{query}"</span>
              </p>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter size={14} className="text-gray-400" />
                {/* Category filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs border rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-[#00A651]"
                  style={{ borderColor: "rgba(0,0,0,0.15)" }}>
                  <option value="all">Toutes sections</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>

                {/* Type filter */}
                <div className="flex gap-1 p-1 bg-white rounded-lg border" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                  {(["all", "free", "premium"] as const).map((f) => (
                    <button key={f} onClick={() => setSelectedType(f)}
                      className={`px-3 py-1 text-xs rounded-md transition font-medium ${selectedType === f ? "text-white" : "text-gray-500 hover:bg-gray-50"}`}
                      style={selectedType === f ? { background: "#00A651" } : {}}>
                      {f === "all" ? "Tous" : f === "free" ? "Gratuits" : "Premium"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filtered.length > 0 ? (
              <div className="space-y-3">
                {filtered.map((article) => (
                  <ArticleCard key={article.id} article={article} variant="horizontal" showExcerpt />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                <Search size={40} className="text-gray-200 mx-auto mb-4" />
                <h3 className="text-gray-900 font-semibold mb-2">Aucun résultat trouvé</h3>
                <p className="text-gray-500 text-sm mb-5">
                  Aucun article ne correspond à "{query}" avec les filtres sélectionnés.
                </p>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs text-gray-400">Suggestions :</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {TRENDING_TAGS.slice(0, 6).map((tag) => (
                      <button key={tag}
                        onClick={() => { setSearchParams({ q: tag }); setInputValue(tag); }}
                        className="px-3 py-1 text-xs text-[#00A651] border border-[#00A651]/30 rounded-full hover:bg-[#00A651] hover:text-white transition-colors">
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* No query: show featured articles */
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-5 rounded-full bg-[#00A651]" />
              <h2 className="text-gray-900 font-bold text-lg">Articles récents</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ARTICLES.slice(0, 6).map((article) => (
                <ArticleCard key={article.id} article={article} variant="grid" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}