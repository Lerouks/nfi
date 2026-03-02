import { Link } from "react-router";
import { Star, Lock, CheckCircle2, Zap } from "lucide-react";
import { useUserPlan } from "../../lib/userPlan";

interface SubscriptionCTAProps {
  variant?: "banner" | "inline" | "sidebar";
}

export function SubscriptionCTA({ variant = "banner" }: SubscriptionCTAProps) {
  const { tier, isLoading } = useUserPlan();

  // Pendant le chargement ou pour les abonnés Premium : rien à afficher
  if (isLoading || tier === "premium") return null;

  const isStandard = tier === "standard";

  // ─── SIDEBAR ─────────────────────────────────────────────────────────────────
  if (variant === "sidebar") {
    if (isStandard) {
      return (
        <div className="rounded-xl p-5 text-center"
          style={{ background: "linear-gradient(135deg, #0D1B35, #1a3060)" }}>
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#C9A84C]/20 mb-3">
            <Zap size={18} className="text-[#C9A84C]" />
          </div>
          <h4 className="text-white font-semibold mb-1.5">Passer à Premium</h4>
          <p className="text-gray-400 text-xs mb-4 leading-relaxed">
            Débloquez les rapports exclusifs, les webinaires et l'accès API marchés.
          </p>
          <div className="space-y-1.5 mb-4 text-left">
            {["Rapports exclusifs", "Webinaires mensuels", "Accès API marchés"].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <CheckCircle2 size={12} className="text-[#C9A84C] shrink-0" />
                <span className="text-xs text-gray-300">{f}</span>
              </div>
            ))}
          </div>
          <div className="text-center mb-3">
            <span className="text-[#C9A84C] font-bold text-lg">10 000</span>
            <span className="text-gray-400 text-xs"> FCFA par mois</span>
          </div>
          <Link to="/subscribe"
            className="block w-full py-2 text-sm text-white font-semibold rounded-lg text-center transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #C9A84C, #A07830)" }}>
            Passer à Premium
          </Link>
        </div>
      );
    }

    // Free user
    return (
      <div className="rounded-xl p-5 text-center"
        style={{ background: "linear-gradient(135deg, #0D1B35, #1a3060)" }}>
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#D4A017]/20 mb-3">
          <Star size={18} className="text-[#00A651]" />
        </div>
        <h4 className="text-white font-semibold mb-1.5">Accès Premium</h4>
        <p className="text-gray-400 text-xs mb-4 leading-relaxed">
          Analyses exclusives, rapports financiers et données en temps réel.
        </p>
        <div className="space-y-1.5 mb-4 text-left">
          {["Accès illimité", "Rapports exclusifs", "Données marchés live"].map((f) => (
            <div key={f} className="flex items-center gap-2">
              <CheckCircle2 size={12} className="text-[#00A651] shrink-0" />
              <span className="text-xs text-gray-300">{f}</span>
            </div>
          ))}
        </div>
        <div className="text-center mb-3">
          <span className="text-[#D4A017] font-bold text-lg">5 000</span>
          <span className="text-gray-400 text-xs"> FCFA par mois</span>
        </div>
        <Link to="/subscribe"
          className="block w-full py-2 text-sm text-white font-semibold rounded-lg text-center transition hover:opacity-90"
          style={{ background: "#C9A84C" }}>
          S'abonner maintenant
        </Link>
      </div>
    );
  }

  // ─── INLINE (paywall article) ─────────────────────────────────────────────────
  if (variant === "inline") {
    if (isStandard) {
      return (
        <div className="rounded-xl border p-6 space-y-4" style={{ borderColor: "rgba(0,0,0,0.08)", background: "#fff" }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#C9A84C]/10 rounded-full shrink-0">
              <Zap size={18} className="text-[#C9A84C]" />
            </div>
            <div>
              <h4 className="text-gray-900 font-semibold text-sm">Contenu réservé aux abonnés Premium</h4>
              <p className="text-gray-500 text-xs mt-0.5">Passez à Premium pour accéder à ce contenu exclusif.</p>
            </div>
          </div>
          <Link to="/subscribe"
            className="flex items-center justify-center gap-2 py-2.5 text-sm text-white font-semibold rounded-full transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #C9A84C, #A07830)" }}>
            <Zap size={14} /> Passer à Premium
          </Link>
        </div>
      );
    }

    // Free user
    return (
      <div className="rounded-xl border p-6 space-y-4" style={{ borderColor: "rgba(0,0,0,0.08)", background: "#fff" }}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#0D1B35]/10 rounded-full shrink-0">
            <Lock size={18} className="text-[#0D1B35]" />
          </div>
          <div>
            <h4 className="text-gray-900 font-semibold text-sm">Contenu réservé aux abonnés</h4>
            <p className="text-gray-500 text-xs mt-0.5">Accédez à l'intégralité de cette analyse.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link to="/profile"
            className="flex items-center justify-center gap-2 py-2.5 text-sm text-white font-semibold rounded-full transition hover:opacity-90"
            style={{ background: "#0D1B35" }}>
            Créer un compte gratuit
          </Link>
          <Link to="/subscribe"
            className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-full border-2 transition hover:bg-[#00A651]/5"
            style={{ borderColor: "#00A651", color: "#00A651" }}>
            Voir les abonnements
          </Link>
        </div>
        <p className="text-center text-xs text-gray-400">3 articles premium gratuits par mois avec un compte gratuit</p>
      </div>
    );
  }

  // ─── BANNER (default) ─────────────────────────────────────────────────────────
  if (isStandard) {
    return (
      <section className="py-12 sm:py-16 px-4"
        style={{ background: "linear-gradient(135deg, #0D1B35 0%, #1a3060 50%, #0D1B35 100%)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5 uppercase tracking-wider"
            style={{ background: "rgba(201,168,76,0.2)", color: "#C9A84C" }}>
            <Zap size={12} /> Offre Premium
          </div>
          <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl mb-4 leading-tight">
            Passez à la formule Premium
          </h2>
          <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-xl mx-auto">
            Vous êtes abonné(e) Standard. Passez à Premium pour débloquer les rapports exclusifs, les webinaires mensuels et l'accès API marchés.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-8">
            {["Rapports exclusifs", "Webinaires mensuels", "Accès API marchés", "Support 24/7"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-gray-300 text-sm">
                <CheckCircle2 size={14} className="text-[#C9A84C]" />
                {f}
              </div>
            ))}
          </div>
          <Link to="/subscribe"
            className="px-8 py-3.5 text-white font-semibold rounded-full transition hover:opacity-90 active:scale-95 inline-block"
            style={{ background: "linear-gradient(135deg, #C9A84C, #A07830)" }}>
            Passer à Premium — 10 000 FCFA/mois
          </Link>
          <p className="text-gray-600 text-xs mt-4">
            Sans engagement · Annulation à tout moment
          </p>
        </div>
      </section>
    );
  }

  // Free user banner
  return (
    <section className="py-12 sm:py-16 px-4"
      style={{ background: "linear-gradient(135deg, #0D1B35 0%, #1a3060 50%, #0D1B35 100%)" }}>
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5 uppercase tracking-wider"
          style={{ background: "rgba(201,168,76,0.2)", color: "#C9A84C" }}>
          <Star size={12} /> Offre Premium
        </div>
        <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl mb-4 leading-tight">
          Accédez aux analyses financières<br className="hidden sm:block" />
          qui font la différence
        </h2>
        <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-xl mx-auto">
          Rejoignez plus de 2 500 professionnels de la finance qui font confiance à NFI REPORT pour leurs décisions d'investissement.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-8">
          {[
            "Analyses exclusives",
            "Rapports trimestriels",
            "Alertes personnalisées",
            "Données en temps réel",
          ].map((f) => (
            <div key={f} className="flex items-center gap-2 text-gray-300 text-sm">
              <CheckCircle2 size={14} className="text-[#00A651]" />
              {f}
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/subscribe"
            className="px-8 py-3.5 text-white font-semibold rounded-full transition hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #C9A84C, #A07830)" }}>
            Commencer à 5 000 FCFA par mois
          </Link>
          <Link to="/subscribe"
            className="px-8 py-3.5 text-gray-300 font-medium rounded-full border border-white/20 hover:bg-white/5 transition">
            Voir tous les plans
          </Link>
        </div>
        <p className="text-gray-600 text-xs mt-4">
          Sans engagement · Annulation à tout moment
        </p>
      </div>
    </section>
  );
}
