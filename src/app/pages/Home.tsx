import { Link } from "react-router";
import { useMemo } from "react";
import { ArrowRight, TrendingUp, Clock, ChevronRight, Flame } from "lucide-react";
import { ARTICLES, CATEGORIES, TRENDING_TAGS, getFeaturedArticles, formatDate } from "../data/mockData";
import { ArticleCard } from "../components/ArticleCard";
import { MarketOverview } from "../components/MarketTicker";
import { NewsletterSignup } from "../components/NewsletterSignup";
import { SubscriptionCTA } from "../components/SubscriptionCTA";
import { BRVMChart, GDPChart, InvestmentChart } from "../components/FinancialChart";

export default function Home() {
  // Calculs dans le composant — pas au niveau module
  const featured = useMemo(() => getFeaturedArticles(), []);
  const latest   = useMemo(() => ARTICLES.slice(0, 6), []);
  const popular  = useMemo(() => [...ARTICLES].sort((a, b) => b.views - a.views).slice(0, 4), []);

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* ======================================================
          HERO SECTION
      ====================================================== */}
      <section className="bg-white border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Main featured article */}
            {featured[0] && (
              <div className="lg:col-span-2 relative group rounded-2xl overflow-hidden">
                <img
                  src={featured[0].cover}
                  alt={featured[0].title}
                  className="w-full h-72 sm:h-96 lg:h-[480px] object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="eager"
                />
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(13,27,53,0.95) 0%, rgba(13,27,53,0.5) 50%, transparent 100%)" }} />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-1 text-xs font-semibold text-white rounded-full" style={{ background: "#C9A84C" }}>
                      {featured[0].category}
                    </span>
                    <span className="text-gray-300 text-xs flex items-center gap-1">
                      <Flame size={11} className="text-orange-400" /> À la une
                    </span>
                  </div>
                  <Link to={`/article/${featured[0].slug}`}>
                    <h1 className="text-white text-xl sm:text-2xl lg:text-3xl mb-3 leading-snug hover:text-green-300 transition-colors">
                      {featured[0].title}
                    </h1>
                  </Link>
                  <p className="text-gray-300 text-sm line-clamp-2 mb-4 max-w-xl">
                    {featured[0].excerpt}
                  </p>
                  <div className="flex items-center gap-3">
                    <img src={featured[0].author.avatar} alt={featured[0].author.name} className="w-8 h-8 rounded-full object-cover border-2 border-white/30" loading="lazy" />
                    <div>
                      <p className="text-white text-xs font-medium">{featured[0].author.name}</p>
                      <p className="text-gray-400 text-[10px] flex items-center gap-1">
                        <Clock size={9} /> {formatDate(featured[0].publishedAt)} · {featured[0].readTime} min de lecture
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Right column: 2 featured + trending */}
            <div className="flex flex-col gap-4">
              {featured.slice(1, 3).map((article) => (
                <div key={article.id} className="relative group rounded-xl overflow-hidden flex-1">
                  <img
                    src={article.cover}
                    alt={article.title}
                    className="w-full h-40 sm:h-48 lg:h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    style={{ minHeight: 160 }}
                    loading="lazy"
                  />
                  <div className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(13,27,53,0.9) 0%, transparent 60%)" }} />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="text-[10px] font-semibold text-[#00A651] uppercase tracking-wider">
                      {article.category}
                    </span>
                    <Link to={`/article/${article.slug}`}>
                      <h3 className="text-white text-sm leading-snug mt-0.5 hover:text-green-300 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                    </Link>
                    <p className="text-gray-400 text-[10px] mt-1 flex items-center gap-1">
                      <Clock size={9} /> {article.readTime} min · {formatDate(article.publishedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          BREAKING / CATEGORIES BAR
      ====================================================== */}
      <div className="bg-[#0D1B35] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-4 overflow-x-auto scrollbar-none">
          <span className="text-[#D4A017] text-xs font-bold uppercase tracking-wider shrink-0">Sections :</span>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/section/${cat.slug}`}
              className="flex items-center gap-1.5 text-gray-300 hover:text-white text-xs shrink-0 transition-colors py-1 px-3 rounded-full hover:bg-white/10">
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left: Latest articles */}
          <div className="lg:col-span-2 space-y-8">
            {/* Latest news */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full" style={{ background: "#C9A84C" }} />
                  <h2 className="text-gray-900 font-bold text-lg">Dernières actualités</h2>
                </div>
                <Link to="/section/economie-africaine"
                  className="flex items-center gap-1 text-sm hover:underline" style={{ color: "#C9A84C" }}>
                  Voir tout <ArrowRight size={14} />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {latest.map((article) => (
                  <ArticleCard key={article.id} article={article} variant="grid" />
                ))}
              </div>
            </div>

            {/* Charts section */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-5 rounded-full" style={{ background: "#C9A84C" }} />
                <h2 className="text-gray-900 font-bold text-lg">Marchés & Analyses</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <BRVMChart />
                <GDPChart />
              </div>
              <div className="mt-4">
                <InvestmentChart />
              </div>
            </div>

            {/* Popular articles */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full bg-red-500" />
                  <h2 className="text-gray-900 font-bold text-lg">
                    <TrendingUp size={16} className="inline text-red-500 mr-1" />
                    Les plus lus
                  </h2>
                </div>
              </div>
              <div className="space-y-3">
                {popular.map((article, index) => (
                  <div key={article.id} className="flex items-start gap-4 p-4 bg-white rounded-xl border hover:shadow-md transition-all group"
                    style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                    <div className="text-3xl font-black tabular-nums shrink-0"
                      style={{ color: index === 0 ? "#D4A017" : index === 1 ? "#9ca3af" : index === 2 ? "#cd7f32" : "#e5e7eb" }}>
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-[#00A651] uppercase tracking-wider">
                        {article.category}
                      </span>
                      <Link to={`/article/${article.slug}`}>
                        <h4 className="text-sm text-gray-900 line-clamp-2 mt-0.5 group-hover:text-[#00A651] transition-colors leading-snug">
                          {article.title}
                        </h4>
                      </Link>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {article.views.toLocaleString("fr-FR")} vues
                      </p>
                    </div>
                    <img src={article.cover} alt={article.title} className="w-16 h-12 object-cover rounded-lg shrink-0" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <aside className="space-y-5">
            {/* Market overview */}
            <MarketOverview />

            {/* Newsletter */}
            <NewsletterSignup variant="compact" />

            {/* Subscription CTA */}
            <SubscriptionCTA variant="sidebar" />

            {/* Trending Tags */}
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <h3 className="text-gray-900 font-semibold text-sm mb-3 flex items-center gap-2">
                <TrendingUp size={14} style={{ color: "#C9A84C" }} /> Tags tendance
              </h3>
              <div className="flex flex-wrap gap-2">
                {TRENDING_TAGS.map((tag) => (
                  <Link
                    key={tag}
                    to={`/search?q=${encodeURIComponent(tag)}`}
                    className="px-2.5 py-1 text-xs text-gray-600 bg-gray-100 rounded-full transition-colors hover:bg-[#C9A84C] hover:text-white"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <h3 className="text-gray-900 font-semibold text-sm mb-3">Sections</h3>
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    to={`/section/${cat.slug}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <span className="flex items-center gap-2 text-sm text-gray-700">
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">{cat.count}</span>
                      <ChevronRight size={12} className="text-gray-300 group-hover:text-[#00A651]" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Focus Niger highlight */}
            <div className="rounded-xl overflow-hidden relative group">
              <img
                src="https://images.unsplash.com/photo-1761143518967-4f9f4f65a955?w=400&h=250&fit=crop"
                alt="Focus Niger"
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,27,53,0.92), transparent)" }} />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <span className="text-[10px] font-bold text-[#D4A017] uppercase tracking-wider">Focus Niger</span>
                <h4 className="text-white text-sm font-medium mt-1 mb-2 leading-snug">
                  Actualités économiques et politiques du Niger
                </h4>
                <Link to="/section/focus-niger"
                  className="flex items-center gap-1 text-xs text-[#00A651] hover:underline">
                  Voir les articles <ChevronRight size={11} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ======================================================
          SUBSCRIPTION CTA BANNER
      ====================================================== */}
      <SubscriptionCTA variant="banner" />

      {/* ======================================================
          NEWSLETTER
      ====================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <NewsletterSignup variant="default" />
      </div>
    </div>
  );
}