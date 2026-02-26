import { Link } from "react-router";
import { Clock, Eye, MessageCircle, Lock, Bookmark, BookmarkCheck } from "lucide-react";
import { useState } from "react";
import type { Article } from "../data/mockData";
import { formatDate } from "../data/mockData";

interface ArticleCardProps {
  article: Article;
  variant?: "grid" | "list" | "featured" | "compact" | "horizontal";
  showExcerpt?: boolean;
}

export function ArticleCard({ article, variant = "grid", showExcerpt = false }: ArticleCardProps) {
  const [saved, setSaved] = useState(false);

  if (variant === "compact") {
    return (
      <div className="flex items-start gap-3 group">
        <img
          src={article.cover}
          alt={article.title}
          className="w-20 h-16 object-cover rounded-lg shrink-0"
          loading="lazy"
        />
        <div className="min-w-0">
          <span className="text-[10px] font-semibold text-[#00A651] uppercase tracking-wider">
            {article.category}
          </span>
          <Link to={`/article/${article.slug}`}>
            <h4 className="text-sm text-gray-900 line-clamp-2 mt-0.5 group-hover:text-[#00A651] transition-colors leading-snug">
              {article.title}
            </h4>
          </Link>
          <div className="flex items-center gap-2 mt-1.5">
            <Clock size={10} className="text-gray-400" />
            <span className="text-[10px] text-gray-400">{article.readTime} min</span>
            {article.isPremium && (
              <span className="flex items-center gap-0.5 text-[10px] font-medium"
                style={{ color: "#00A651" }}>
                <Lock size={9} /> Premium
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "horizontal") {
    return (
      <article className="flex items-start gap-4 p-4 bg-white rounded-xl border hover:shadow-md transition-all group"
        style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        <Link to={`/article/${article.slug}`} className="shrink-0">
          <img
            src={article.cover}
            alt={article.title}
            className="w-32 sm:w-40 h-24 sm:h-28 object-cover rounded-lg"
            loading="lazy"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-[#00A651] uppercase tracking-wider">
              {article.category}
            </span>
            {article.isPremium && (
              <span className="flex items-center gap-1 text-xs text-white px-2 py-0.5 rounded-full font-medium"
                style={{ background: "#00A651" }}>
                <Lock size={9} /> Premium
              </span>
            )}
          </div>
          <Link to={`/article/${article.slug}`}>
            <h3 className="text-gray-900 line-clamp-2 group-hover:text-[#00A651] transition-colors leading-snug">
              {article.title}
            </h3>
          </Link>
          {showExcerpt && (
            <p className="text-sm text-gray-500 line-clamp-2 mt-1">{article.excerpt}</p>
          )}
          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
            <img
              src={article.author.avatar}
              alt={article.author.name}
              className="w-5 h-5 rounded-full object-cover"
              loading="lazy"
            />
            <span className="text-xs text-gray-600">{article.author.name}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">{formatDate(article.publishedAt)}</span>
            <span className="text-gray-300">·</span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} /> {article.readTime} min
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Eye size={11} /> {article.views.toLocaleString("fr-FR")}
            </span>
          </div>
        </div>
        <button
          onClick={() => setSaved(!saved)}
          className="p-1.5 rounded-full hover:bg-gray-100 transition shrink-0 text-gray-400 hover:text-[#00A651]"
          aria-label={saved ? "Retirer des favoris" : "Sauvegarder"}>
          {saved ? <BookmarkCheck size={16} className="text-[#00A651]" /> : <Bookmark size={16} />}
        </button>
      </article>
    );
  }

  // Grid / default
  return (
    <article className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all group flex flex-col"
      style={{ borderColor: "rgba(0,0,0,0.08)" }}>
      <div className="relative overflow-hidden">
        <Link to={`/article/${article.slug}`}>
          <img
            src={article.cover}
            alt={article.title}
            className={`w-full object-cover group-hover:scale-105 transition-transform duration-500 ${variant === "featured" ? "h-64 sm:h-80" : "h-48"}`}
            loading="lazy"
          />
        </Link>
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2.5 py-1 text-xs font-semibold text-white rounded-full"
            style={{ background: "#00A651" }}>
            {article.category}
          </span>
          {article.isPremium && (
            <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white rounded-full"
              style={{ background: "#D4A017" }}>
              <Lock size={9} /> Premium
            </span>
          )}
        </div>
        <button
          onClick={() => setSaved(!saved)}
          className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-full hover:bg-white transition text-gray-600">
          {saved ? <BookmarkCheck size={15} style={{ color: "#C9A84C" }} /> : <Bookmark size={15} />}
        </button>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <Link to={`/article/${article.slug}`}>
          {/* group-hover remplace onMouseEnter/onMouseLeave — plus stable */}
          <h3 className={`text-gray-900 group-hover:text-[#00A651] transition-colors leading-snug ${variant === "featured" ? "text-xl" : "text-base"} line-clamp-2`}>
            {article.title}
          </h3>
        </Link>
        {showExcerpt && (
          <p className="text-sm text-gray-500 line-clamp-2 mt-2 flex-1">{article.excerpt}</p>
        )}
        <div className="mt-3 flex items-center gap-2 pt-3 border-t flex-wrap"
          style={{ borderColor: "rgba(0,0,0,0.06)" }}>
          <img
            src={article.author.avatar}
            alt={article.author.name}
            className="w-6 h-6 rounded-full object-cover"
            loading="lazy"
          />
          <span className="text-xs text-gray-600 flex-1 truncate">{article.author.name}</span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={11} /> {article.readTime} min
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <MessageCircle size={11} /> {article.comments}
          </span>
        </div>
      </div>
    </article>
  );
}