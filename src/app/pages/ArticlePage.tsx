import { useParams, Link } from "react-router";
import { useState, useEffect } from "react";
import { useUser, SignInButton } from "@clerk/clerk-react";
import {
  Clock, Eye, MessageCircle, Bookmark, BookmarkCheck,
  ChevronRight, Twitter, Linkedin, Facebook, Lock,
  ThumbsUp, Send, TrendingUp, Copy, Check, LogIn,
} from "lucide-react";
import { PortableText } from "@portabletext/react";
import {
  COMMENTS, formatDate, type Article, type Comment as MockComment,
} from "../data/mockData";
import {
  getArticleBySlug, getAllArticles, toArticle,
  type SanityArticle,
} from "../../lib/sanity";
import {
  getComments, addComment, likeComment,
  incrementArticleViews, getArticleViews,
  type Comment as SupabaseComment,
} from "../../lib/supabase";
import { ArticleCard } from "../components/ArticleCard";
import { SubscriptionCTA } from "../components/SubscriptionCTA";
import { NewsletterSignup } from "../components/NewsletterSignup";
import { MarketOverview } from "../components/MarketTicker";

// Type unifié pour l'affichage des commentaires (Supabase ou mock)
type DisplayComment = {
  id: string;
  author: string;
  avatar: string | null;
  content: string;
  date: string;
  likes: number;
};

function toDisplayComment(c: SupabaseComment): DisplayComment {
  return {
    id: c.id,
    author: c.author_name,
    avatar: c.author_avatar,
    content: c.content,
    date: c.created_at,
    likes: c.likes,
  };
}

function mockToDisplay(c: MockComment): DisplayComment {
  return {
    id: c.id,
    author: c.author,
    avatar: c.avatar,
    content: c.content,
    date: c.date,
    likes: c.likes,
  };
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isSignedIn } = useUser();
  const [sanityArticle, setSanityArticle] = useState<SanityArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<DisplayComment[]>(COMMENTS.map(mockToDisplay));
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [realViews, setRealViews] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getArticleBySlug(slug).then((data) => {
      setSanityArticle(data);
      setLoading(false);
    });
    getAllArticles().then((data) => {
      setRelatedArticles(data.slice(0, 4).map(toArticle));
    });

    // Incrémenter les vues + charger le vrai nombre
    incrementArticleViews(slug).then(() => {
      getArticleViews(slug).then((v) => {
        if (v > 0) setRealViews(v);
      });
    });

    // Charger les vrais commentaires depuis Supabase
    getComments(slug).then((data) => {
      if (data.length > 0) {
        setComments(data.map(toDisplayComment));
      } else {
        // Fallback : mock si Supabase vide ou non configuré
        setComments(COMMENTS.map(mockToDisplay));
      }
    });
  }, [slug]);

  useEffect(() => {
    if (sanityArticle) {
      document.title = `${sanityArticle.title} — NFI REPORT`;
    }
    return () => { document.title = "NFI REPORT - La référence financière et économique au Niger"; };
  }, [sanityArticle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#00A651] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!sanityArticle) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-gray-900 text-2xl mb-2">Article introuvable</h1>
          <Link to="/" className="text-[#00A651] hover:underline">← Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  const article = toArticle(sanityArticle);
  const isPremiumLocked = article.isPremium;
  const PREVIEW_PARAGRAPHS = 2;
  // lockedContent supprimé — inutilisé (le contenu verrouillé est géré via isPremiumLocked)

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !slug) return;

    const authorName = user?.fullName ?? user?.firstName ?? "Anonyme";
    const authorAvatar = user?.imageUrl ?? null;
    const userId = user?.id ?? "anonymous";

    // Optimistic update
    const optimistic: DisplayComment = {
      id: `c${Date.now()}`,
      author: authorName,
      avatar: authorAvatar,
      content: comment,
      date: new Date().toISOString(),
      likes: 0,
    };
    setComments((prev) => [optimistic, ...prev]);
    setComment("");

    // Sauvegarde en base
    setSubmitting(true);
    const saved = await addComment(slug, userId, authorName, authorAvatar, comment.trim());
    setSubmitting(false);

    if (saved) {
      // Remplacer l'optimistic par la vraie entrée DB
      setComments((prev) =>
        prev.map((c) => (c.id === optimistic.id ? toDisplayComment(saved) : c))
      );
    }
  };

  const toggleLike = (id: string) => {
    setLikedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        likeComment(id); // Persiste le like en DB
      }
      return next;
    });
  };

  const articleUrl = `https://www.nfireport.com/#/article/${article.slug}`;
  const encodedUrl   = encodeURIComponent(articleUrl);
  const encodedTitle = encodeURIComponent(article.title);

  const shareLinks = {
    twitter:  `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}&via=nfireport`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("input");
      el.value = articleUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-5">
          <Link to="/" className="hover:text-[#00A651] transition-colors">Accueil</Link>
          <ChevronRight size={14} />
          <Link to={`/section/${article.categorySlug}`} className="hover:text-[#00A651] transition-colors">
            {article.category}
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 truncate max-w-[200px]">{article.title.slice(0, 40)}...</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Article content */}
          <article className="lg:col-span-2">
            {/* Header */}
            <div className="bg-white rounded-xl border overflow-hidden mb-5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              {/* Cover */}
              <div className="relative">
                <img src={article.cover} alt={article.title} className="w-full h-56 sm:h-80 object-cover" loading="eager" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Link
                    to={`/section/${article.categorySlug}`}
                    className="px-3 py-1.5 text-xs font-semibold text-white rounded-full"
                    style={{ background: "#C9A84C" }}>
                    {article.category}
                  </Link>
                  {article.isPremium && (
                    <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white rounded-full"
                      style={{ background: "#D4A017" }}>
                      <Lock size={10} /> Premium
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 sm:p-8">
                {/* Title */}
                <h1 className="text-gray-900 text-xl sm:text-2xl lg:text-3xl leading-snug mb-4">
                  {article.title}
                </h1>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 mb-5 pb-5 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                  <div className="flex items-center gap-2">
                    <img src={article.author.avatar} alt={article.author.name}
                      className="w-9 h-9 rounded-full object-cover" />
                    <div>
                      <p className="text-sm text-gray-900 font-medium">{article.author.name}</p>
                      <p className="text-xs text-gray-500">{article.author.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    <span>{formatDate(article.publishedAt)}</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {article.readTime} min</span>
                    <span className="flex items-center gap-1"><Eye size={11} /> {(realViews ?? article.views).toLocaleString("fr-FR")} vues</span>
                    <span className="flex items-center gap-1"><MessageCircle size={11} /> {comments.length}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    {/* Share buttons — vrais liens */}
                    <a
                      href={shareLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Partager sur Twitter"
                      className="p-1.5 rounded-full hover:bg-gray-100 transition text-gray-500 hover:text-[#1DA1F2]"
                    >
                      <Twitter size={15} />
                    </a>
                    <a
                      href={shareLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Partager sur LinkedIn"
                      className="p-1.5 rounded-full hover:bg-gray-100 transition text-gray-500 hover:text-[#0A66C2]"
                    >
                      <Linkedin size={15} />
                    </a>
                    <a
                      href={shareLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Partager sur Facebook"
                      className="p-1.5 rounded-full hover:bg-gray-100 transition text-gray-500 hover:text-[#1877F2]"
                    >
                      <Facebook size={15} />
                    </a>
                    <button
                      onClick={copyLink}
                      aria-label="Copier le lien"
                      title={copied ? "Lien copié !" : "Copier le lien"}
                      className={`p-1.5 rounded-full hover:bg-gray-100 transition ${copied ? "text-[#00A651]" : "text-gray-500 hover:text-[#C9A84C]"}`}
                    >
                      {copied ? <Check size={15} /> : <Copy size={15} />}
                    </button>
                    <button
                      onClick={() => setSaved(!saved)}
                      className="p-1.5 rounded-full hover:bg-gray-100 transition text-gray-500"
                      aria-label={saved ? "Retirer des favoris" : "Sauvegarder"}
                    >
                      {saved ? <BookmarkCheck size={15} className="text-[#00A651]" /> : <Bookmark size={15} className="text-gray-500 hover:text-[#C9A84C]" />}
                    </button>
                  </div>
                </div>

                {/* Excerpt — citation en Playfair Display italic */}
                <p className="text-gray-600 text-sm sm:text-base italic leading-relaxed mb-6 border-l-4 pl-4"
                  style={{ borderColor: "#C9A84C", fontFamily: "var(--font-serif)" }}>
                  {article.excerpt}
                </p>

                {/* Article content */}
                <div className="prose-article text-sm sm:text-base">
                  {isPremiumLocked ? (
                    <>
                      {sanityArticle.content && (
                        <div className="line-clamp-6">
                          <PortableText value={sanityArticle.content.slice(0, PREVIEW_PARAGRAPHS)} />
                        </div>
                      )}
                      {/* Premium gate */}
                      <div className="relative mt-6">
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent z-10" style={{ top: "-80px" }} />
                        <div className="relative z-20 mt-8">
                          <SubscriptionCTA variant="inline" />
                        </div>
                      </div>
                    </>
                  ) : sanityArticle.content ? (
                    <PortableText value={sanityArticle.content} />
                  ) : (
                    <p className="text-gray-500">Contenu non disponible.</p>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-8 pt-5 border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                  {article.tags.map((tag) => (
                    <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`}
                      className="px-3 py-1 text-xs text-[#00A651] border border-[#00A651]/30 rounded-full hover:bg-[#00A651] hover:text-white transition-colors">
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Author bio */}
            <div className="bg-white rounded-xl border p-5 sm:p-6 mb-5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <h3 className="text-gray-900 font-semibold mb-4 text-sm uppercase tracking-wider">À propos de l'auteur</h3>
              <div className="flex items-start gap-4">
                <img src={article.author.avatar} alt={article.author.name}
                  className="w-16 h-16 rounded-full object-cover shrink-0" loading="lazy" />
                <div>
                  <h4 className="text-gray-900 font-semibold">{article.author.name}</h4>
                  <p className="text-[#00A651] text-xs mb-2">{article.author.role}</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{article.author.bio}</p>
                  <p className="text-xs text-gray-500 mt-3">{article.author.articles} articles publiés</p>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-xl border p-5 sm:p-6" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <h3 className="text-gray-900 font-semibold mb-5 flex items-center gap-2">
                <MessageCircle size={16} className="text-[#00A651]" />
                Commentaires ({comments.length})
              </h3>

              {/* Comment form — connecté ou invitation à se connecter */}
              {isSignedIn ? (
                <form onSubmit={handleComment} className="mb-6">
                  <div className="flex items-start gap-3">
                    {user?.imageUrl && (
                      <img src={user.imageUrl} alt={user.fullName ?? "Vous"}
                        className="w-9 h-9 rounded-full object-cover shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Partagez votre analyse ou votre point de vue..."
                        rows={3}
                        className="w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651] resize-none"
                        style={{ borderColor: "rgba(0,0,0,0.15)" }}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          type="submit"
                          disabled={submitting || !comment.trim()}
                          className="flex items-center gap-2 px-5 py-2 text-sm text-white font-medium rounded-full transition hover:opacity-90 disabled:opacity-50"
                          style={{ background: "#C9A84C" }}>
                          <Send size={13} /> {submitting ? "Envoi…" : "Publier"}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="mb-6 flex items-center gap-4 p-4 rounded-xl bg-gray-50 border" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                  <LogIn size={18} className="text-[#00A651] shrink-0" />
                  <p className="text-sm text-gray-600 flex-1">
                    Connectez-vous pour laisser un commentaire.
                  </p>
                  <SignInButton mode="modal">
                    <button className="px-4 py-2 text-sm text-white font-medium rounded-full transition hover:opacity-90"
                      style={{ background: "#00A651" }}>
                      Se connecter
                    </button>
                  </SignInButton>
                </div>
              )}

              {/* Comments list */}
              <div className="space-y-5">
                {comments.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Soyez le premier à commenter cet article.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-3">
                      {c.avatar ? (
                        <img src={c.avatar} alt={c.author} className="w-9 h-9 rounded-full object-cover shrink-0" loading="lazy" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#00A651]/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-[#00A651]">{c.author.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">{c.author}</span>
                          <span className="text-xs text-gray-400">{formatDate(c.date)}</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                        <button
                          onClick={() => toggleLike(c.id)}
                          className={`flex items-center gap-1.5 mt-2 text-xs transition-colors ${
                            likedComments.has(c.id) ? "text-[#C9A84C]" : "text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          <ThumbsUp size={12} />
                          {c.likes + (likedComments.has(c.id) ? 1 : 0)}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-5">
            <MarketOverview />

            {/* Related articles */}
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <h3 className="text-gray-900 font-semibold text-sm mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-[#00A651]" /> Articles similaires
              </h3>
              <div className="space-y-4">
                {relatedArticles.filter((a) => a.id !== article.id).slice(0, 4).map((a) => (
                  <ArticleCard key={a.id} article={a} variant="compact" />
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <h3 className="text-gray-900 font-semibold text-sm mb-3">Tags de l'article</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`}
                    className="px-2.5 py-1 text-xs text-gray-600 bg-gray-100 rounded-full hover:bg-[#00A651] hover:text-white transition-colors">
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>

            <NewsletterSignup variant="compact" />

            {!article.isPremium && <SubscriptionCTA variant="sidebar" />}
          </aside>
        </div>

        {/* More articles section */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 rounded-full bg-[#00A651]" />
            <h2 className="text-gray-900 font-bold text-lg">Autres articles dans {article.category}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedArticles.filter((a) => a.id !== article.id).slice(0, 4).map((a) => (
              <ArticleCard key={a.id} article={a} variant="grid" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}