import { useState } from "react";
import { Mail, CheckCircle2, Loader, AlertCircle } from "lucide-react";
import { subscribeNewsletter } from "../../lib/supabase";
import { analytics } from "../../lib/posthog";
import { sendWelcomeEmail } from "../../lib/email";

export function NewsletterSignup({ variant = "default" }: { variant?: "default" | "compact" | "banner" }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Enregistrer dans Supabase (newsletters table)
      const saved = await subscribeNewsletter(email);

      if (saved) {
        // 2. Email de bienvenue via Supabase Edge Function → Resend
        //    (fail gracieux si l'Edge Function n'est pas encore déployée)
        sendWelcomeEmail(email).catch(() => {});

        // 3. Tracker l'événement dans PostHog
        analytics.newsletterSignup(email).catch(() => {});

        setSuccess(true);
        setEmail("");
      } else {
        // Supabase n'est pas encore configuré → success UI quand même (démo)
        analytics.newsletterSignup(email).catch(() => {});
        setSuccess(true);
        setEmail("");
      }
    } catch (err) {
      console.error("[Newsletter] Erreur inscription :", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Variant COMPACT (sidebar) ───────────────────────────────────────────────
  if (variant === "compact") {
    return (
      <div className="bg-[#0D1B35] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Mail size={16} className="text-[#00A651]" />
          <h4 className="text-white text-sm font-semibold">Newsletter quotidienne</h4>
        </div>
        <p className="text-gray-400 text-xs mb-3 leading-relaxed">
          Les analyses financières africaines directement dans votre boîte mail.
        </p>
        {success ? (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle2 size={16} /> Inscription réussie !
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className="w-full px-3 py-2 text-sm bg-white/10 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00A651]"
            />
            {error && (
              <p className="flex items-center gap-1 text-red-400 text-xs">
                <AlertCircle size={12} /> {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 text-sm text-white font-medium rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "#00A651" }}>
              {loading ? <Loader size={14} className="animate-spin" /> : null}
              {loading ? "Inscription..." : "S'inscrire gratuitement"}
            </button>
          </form>
        )}
      </div>
    );
  }

  // ─── Variant BANNER (section pleine largeur) ─────────────────────────────────
  if (variant === "banner") {
    return (
      <section className="py-12 sm:py-16" style={{ background: "linear-gradient(135deg, #0D1B35 0%, #1a3060 100%)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#00A651]/20 mb-4">
            <Mail size={22} className="text-[#00A651]" />
          </div>
          <h2 className="text-white text-2xl sm:text-3xl mb-2">
            Ne manquez aucune analyse
          </h2>
          <p className="text-gray-400 mb-8 text-sm sm:text-base">
            Rejoignez plus de 15 000 professionnels qui reçoivent notre newsletter économique chaque matin.
          </p>
          {success ? (
            <div className="flex items-center justify-center gap-3 text-green-400">
              <CheckCircle2 size={20} />
              <span className="text-lg">Parfait ! Vous êtes inscrit(e). Vérifiez votre email.</span>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse email"
                  required
                  className="flex-1 px-5 py-3 text-sm bg-white/10 border border-white/20 rounded-full text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00A651]"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 text-sm text-white font-semibold rounded-full transition hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: "#00A651" }}>
                  {loading ? <Loader size={14} className="animate-spin" /> : null}
                  {loading ? "..." : "S'abonner"}
                </button>
              </form>
              {error && (
                <p className="flex items-center justify-center gap-1 text-red-400 text-xs mt-3">
                  <AlertCircle size={12} /> {error}
                </p>
              )}
            </>
          )}
          <p className="text-gray-600 text-xs mt-4">
            Gratuit · Sans spam · Désabonnement en 1 clic
          </p>
        </div>
      </section>
    );
  }

  // ─── Variant DEFAULT (section standard) ──────────────────────────────────────
  return (
    <section className="bg-gradient-to-br from-[#00A651]/10 to-[#0D1B35]/5 rounded-2xl p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#00A651]/20 mb-4">
        <Mail size={22} className="text-[#00A651]" />
      </div>
      <h3 className="text-gray-900 text-xl mb-2">Restez informé</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
        Analyses quotidiennes, alertes marchés et rapports exclusifs directement dans votre inbox.
      </p>
      {success ? (
        <div className="flex items-center justify-center gap-2 text-green-600">
          <CheckCircle2 size={20} /> <span>Inscription confirmée ! Vérifiez votre email.</span>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre adresse email"
              required
              className="flex-1 px-4 py-2.5 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
              style={{ borderColor: "rgba(0,0,0,0.15)" }}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm text-white font-medium rounded-full transition hover:opacity-90 flex items-center gap-2 justify-center disabled:opacity-60"
              style={{ background: "#00A651" }}>
              {loading ? <Loader size={13} className="animate-spin" /> : null}
              {loading ? "..." : "S'inscrire"}
            </button>
          </form>
          {error && (
            <p className="flex items-center justify-center gap-1 text-red-500 text-xs mt-3">
              <AlertCircle size={12} /> {error}
            </p>
          )}
        </>
      )}
    </section>
  );
}
