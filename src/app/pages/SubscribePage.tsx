import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Star, CheckCircle2, CreditCard, Lock, Shield,
  ChevronRight, ChevronDown, BarChart2, Globe, Bell, Download,
  Users, Award, Loader, Clock, Tag, X,
} from "lucide-react";
import { SUBSCRIPTION_PLANS, formatPrice } from "../data/mockData";
import { savePaymentRequest } from "../../lib/supabase";
import { useUser } from "@clerk/clerk-react";
import { useClerkActive } from "../../lib/clerkActive";
import { useSubscription, type SubscriptionTier } from "../../lib/subscription";

const FAQ = [
  {
    q: "Comment fonctionne l'abonnement ?",
    a: "Votre abonnement vous donne accès immédiat à tout le contenu premium de NFI REPORT. Choisissez entre la facturation mensuelle, trimestrielle (−10%) ou annuelle (−17%, 2 mois offerts). Vous pouvez annuler à tout moment.",
  },
  {
    q: "Quels moyens de paiement acceptez-vous ?",
    a: "Nous acceptons les paiements via Orange Money, Wave, Moov Money, NITA Transfert d'Argent, AMANA Transfert d'Argent, ainsi que les cartes bancaires Visa/Mastercard. Pour les transferts NITA et AMANA, effectuez le dépôt au +227 98 54 38 37 puis contactez-nous avec votre référence.",
  },
  {
    q: "Puis-je partager mon abonnement ?",
    a: "L'abonnement est personnel et lié à un compte. Pour les équipes et entreprises, nous proposons des tarifs groupe. Contactez-nous à contact@nfireport.com.",
  },
  {
    q: "Comment annuler mon abonnement ?",
    a: "Vous pouvez annuler à tout moment depuis votre espace profil, section 'Abonnement'. L'accès reste actif jusqu'à la fin de la période payée.",
  },
  {
    q: "Quelle est la différence entre les périodes de facturation ?",
    a: "Mensuel : payez mois par mois sans engagement. Trimestriel : économisez 10% en payant tous les 3 mois. Annuel : économisez 17% (2 mois offerts) en payant une fois par an. Les prix s'affichent directement sur la page en sélectionnant la période souhaitée.",
  },
];

// ─── Wrapper Clerk — lit l'utilisateur uniquement quand ClerkProvider est actif ─
function SubscribePageWithClerk() {
  const { user, isSignedIn } = useUser();
  const subscription = useSubscription(isSignedIn && user ? user.id : null);
  return <SubscribePageContent user={user} isSignedIn={!!isSignedIn} currentTier={subscription.tier} tierLoading={subscription.isLoading} />;
}

export default function SubscribePage() {
  const clerkActive = useClerkActive();
  if (clerkActive) return <SubscribePageWithClerk />;
  return <SubscribePageContent user={null} isSignedIn={false} currentTier="free" tierLoading={false} />;
}

function SubscribePageContent({
  user,
  isSignedIn,
  currentTier,
  tierLoading,
}: {
  user: ReturnType<typeof useUser>["user"];
  isSignedIn: boolean;
  currentTier: SubscriptionTier;
  tierLoading: boolean;
}) {

  useEffect(() => {
    document.title = "Abonnement NFI REPORT — Accédez aux analyses financières premium | Niger";
    document.querySelector('meta[name="description"]')?.setAttribute("content", "Abonnez-vous à NFI REPORT et accédez à toutes les analyses financières, rapports exclusifs et données de marché sur l'économie du Niger et de l'Afrique.");
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", "https://www.nfireport.com/subscribe");
    return () => {
      document.title = "NFI REPORT - La référence financière et économique au Niger";
      document.querySelector('meta[name="description"]')?.setAttribute("content", "NFI REPORT — Actualités économiques et financières en Afrique. Analyses indépendantes, données de marché, focus Niger, BCEAO, UEMOA et économie mondiale.");
      const can = document.querySelector('link[rel="canonical"]');
      if (can) can.setAttribute("href", "https://www.nfireport.com/");
    };
  }, []);

  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("orange-money");
  // "idle" | "submitting" | "pending" | "error"
  const [paymentState, setPaymentState] = useState<"idle" | "submitting" | "pending" | "error">("idle");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [cardData, setCardData] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Codes promo disponibles : code → réduction (0.15 = -15%)
  const PROMO_CODES: Record<string, number> = { "NFIREPORT1": 0.15 };

  const basePlanId = selectedPlan?.replace(/-(yearly|quarterly)$/, "") ?? null;
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === basePlanId);
  const isQuarterlySelected = selectedPlan?.endsWith("-quarterly") ?? false;
  const isYearlySelected = selectedPlan?.endsWith("-yearly") ?? false;
  // Prix dégressifs : mensuel → trimestriel (-10%) → annuel (-17%, 2 mois offerts)
  const basePrice = plan
    ? isYearlySelected    ? plan.price * 10
    : isQuarterlySelected ? Math.round(plan.price * 3 * 0.9)
    : plan.price
    : 0;
  const discount = promoApplied ? (PROMO_CODES[promoInput.toUpperCase()] ?? 0) : 0;
  const finalPrice = plan ? Math.round(basePrice * (1 - discount)) : 0;

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (PROMO_CODES[code] !== undefined) {
      setPromoApplied(true);
      setPromoError(null);
    } else {
      setPromoError("Code promo invalide.");
      setPromoApplied(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoApplied(false);
    setPromoInput("");
    setPromoError(null);
  };

  const handleSubscribe = (planId: string) => {
    if (planId === "free") return;
    const effectiveId =
      billingPeriod === "yearly"    ? `${planId}-yearly`
      : billingPeriod === "quarterly" ? `${planId}-quarterly`
      : planId;
    setSelectedPlan(effectiveId);
    setShowPayment(true);
    setPaymentState("idle");
    setPaymentError(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || paymentState === "submitting") return;

    // Validation côté client avant envoi
    const mobileMoneyMethods = ["orange-money", "wave", "moov"];
    if (mobileMoneyMethods.includes(paymentMethod) && !phoneNumber.trim()) {
      setPaymentError("Veuillez entrer votre numéro de téléphone.");
      return;
    }
    const refMethods = ["nita", "amana"];
    if (refMethods.includes(paymentMethod) && !referenceNumber.trim()) {
      setPaymentError("Veuillez entrer la référence de votre reçu.");
      return;
    }

    setPaymentState("submitting");
    setPaymentError(null);

    const saved = await savePaymentRequest({
      userId:          isSignedIn && user ? user.id          : "anonymous",
      userEmail:       isSignedIn && user ? (user.primaryEmailAddress?.emailAddress ?? "") : "",
      userName:        isSignedIn && user ? (user.fullName ?? user.firstName ?? null) : null,
      planId:          selectedPlan ?? plan.id,
      planName:        `${plan.name}${isYearlySelected ? " (Annuel)" : ""}`,
      amount:          finalPrice,
      paymentMethod,
      phoneNumber:     phoneNumber || undefined,
      referenceNumber: referenceNumber || undefined,
      promoCode:       promoApplied ? promoInput.toUpperCase() : undefined,
    });

    if (saved) {
      setPaymentState("pending");
      window.scrollTo({ top: 0, behavior: "instant" });
    } else {
      setPaymentState("error");
      setPaymentError("Une erreur est survenue. Vérifiez votre connexion et réessayez.");
    }
  };

  const [searchParams] = useSearchParams();
  const upgradeMode = searchParams.get("upgrade") === "1";

  // ── Spinner pendant le chargement du tier (évite le flash de la page plans) ─
  if (isSignedIn && tierLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#00A651] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Abonné Standard → écran dédié (sauf si mode upgrade explicite) ───────────
  if (!tierLoading && isSignedIn && currentTier === "standard" && !upgradeMode) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border p-8 sm:p-12 max-w-md w-full text-center shadow-lg"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "#EFF6FF" }}>
            <Star size={28} style={{ color: "#3B82F6" }} />
          </div>
          <p className="font-bold text-gray-900 mb-2" style={{ fontSize: "1.4rem", fontFamily: "var(--font-sans)" }}>
            Vous avez déjà l'abonnement Standard
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Vous bénéficiez de l'accès Standard NFI REPORT avec accès à tout le contenu inclus dans ce plan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/"
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 transition text-center">
              Retour à l'accueil
            </Link>
            <Link to="/profile?tab=subscription"
              className="flex-1 py-2.5 text-sm font-medium text-white rounded-full transition text-center"
              style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)" }}>
              Mon abonnement
            </Link>
          </div>
          <div className="mt-5 pt-5 border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            <p className="text-xs text-gray-400 mb-3">Passez en Premium pour accéder aux outils exclusifs et à tout le contenu</p>
            <Link
              to="/subscribe?upgrade=1"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #C9A84C, #b8942a)" }}
            >
              <Star size={14} /> Passer en Premium
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Abonné Premium → écran dédié ─────────────────────────────────────────────
  if (!tierLoading && isSignedIn && currentTier === "premium") {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border p-8 sm:p-12 max-w-md w-full text-center shadow-lg"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "linear-gradient(135deg, #C9A84C22, #C9A84C44)" }}>
            <Star size={28} style={{ color: "#C9A84C" }} />
          </div>
          <p className="font-bold text-gray-900 mb-2" style={{ fontSize: "1.4rem", fontFamily: "var(--font-sans)" }}>
            Vous êtes déjà Premium
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Vous bénéficiez du meilleur plan NFI REPORT avec un accès illimité à tout le contenu.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/"
              className="flex-1 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 transition text-center">
              Retour à l'accueil
            </Link>
            <Link to="/profile?tab=subscription"
              className="flex-1 py-2.5 text-sm font-medium text-white rounded-full transition text-center"
              style={{ background: "linear-gradient(135deg, #C9A84C, #b8942a)" }}>
              Mon abonnement
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (paymentState === "pending" && plan) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border p-8 sm:p-12 max-w-lg w-full text-center shadow-lg"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock size={32} className="text-amber-500" />
          </div>
          <h1 className="text-gray-900 text-2xl mb-2">Demande enregistrée</h1>
          <p className="text-gray-600 mb-1">
            Votre demande d'abonnement <strong>NFI REPORT {plan.name}</strong> a été reçue.
          </p>
          <p className="text-gray-500 text-sm mb-4">
            Notre équipe va vérifier votre paiement et activer votre accès sous <strong>24h</strong>.<br />
            Vous recevrez une confirmation par email.
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 text-left text-sm text-amber-800">
            <p className="font-semibold mb-1">Que se passe-t-il maintenant ?</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Notre équipe vérifie votre paiement</li>
              <li>Votre compte est mis à jour manuellement</li>
              <li>Vous recevez un email de confirmation</li>
            </ol>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/"
              className="flex-1 py-2.5 text-sm font-medium text-[#00A651] border-2 border-[#00A651] rounded-full hover:bg-[#00A651] hover:text-white transition-all text-center">
              Retour à l'accueil
            </Link>
            <Link to="/profile"
              className="flex-1 py-2.5 text-sm font-medium text-white rounded-full transition text-center"
              style={{ background: "#00A651" }}>
              Mon profil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (showPayment && plan) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Link to="/" className="hover:text-[#00A651]">Accueil</Link>
            <ChevronRight size={14} />
            <button onClick={() => setShowPayment(false)} className="hover:text-[#00A651]">
              Abonnement
            </button>
            <ChevronRight size={14} />
            <span className="text-gray-900">Paiement</span>
          </nav>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Payment form */}
            <div className="sm:col-span-2">
              <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                <h2 className="text-gray-900 font-bold text-lg mb-5 flex items-center gap-2">
                  <CreditCard size={18} className="text-[#00A651]" /> Finaliser votre abonnement
                </h2>

                {/* Payment methods */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Méthode de paiement</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      { id: "orange-money", label: "Orange Money", color: "#FF6600" },
                      { id: "wave", label: "Wave", color: "#1A73E8" },
                      { id: "moov", label: "Moov Money", color: "#00A651" },
                      { id: "nita", label: "NITA Transfert", color: "#8B1A1A" },
                      { id: "amana", label: "AMANA Transfert", color: "#1a5c8a" },
                      { id: "card", label: "Carte bancaire", color: "#1a3060" },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                          paymentMethod === method.id
                            ? "border-[#00A651] bg-green-50 text-[#00A651]"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: method.color }} />
                        <span className="text-xs">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form fields */}
                <form onSubmit={handlePayment} className="space-y-4">
                  {paymentMethod === "card" ? (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Nom sur la carte</label>
                        <input
                          type="text"
                          value={cardData.name}
                          onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                          placeholder="OUMAROU SANDA"
                          className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
                          style={{ borderColor: "rgba(0,0,0,0.15)" }}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Numéro de carte</label>
                        <input
                          type="text"
                          value={cardData.number}
                          onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
                          style={{ borderColor: "rgba(0,0,0,0.15)" }}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">Expiration</label>
                          <input
                            type="text"
                            value={cardData.expiry}
                            onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                            placeholder="MM/AA"
                            maxLength={5}
                            className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
                            style={{ borderColor: "rgba(0,0,0,0.15)" }}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">CVV</label>
                          <input
                            type="text"
                            value={cardData.cvv}
                            onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                            placeholder="123"
                            maxLength={4}
                            className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
                            style={{ borderColor: "rgba(0,0,0,0.15)" }}
                            required
                          />
                        </div>
                      </div>
                    </>
                  ) : paymentMethod === "nita" || paymentMethod === "amana" ? (
                    <div className="space-y-3">
                      {/* Instructions dépôt */}
                      <div className="rounded-xl border p-4" style={{ background: "#f0fdf4", borderColor: "#00A65133" }}>
                        <p className="text-xs font-semibold text-[#00A651] mb-2 uppercase tracking-wide">
                          Instructions de paiement — {paymentMethod === "nita" ? "NITA Transfert" : "AMANA Transfert"}
                        </p>
                        <ol className="text-xs text-gray-700 space-y-1.5 list-decimal list-inside">
                          <li>Rendez-vous dans une agence {paymentMethod === "nita" ? "NITA" : "AMANA"} près de chez vous</li>
                          <li>
                            Effectuez un dépôt au nom de <strong>NFI REPORT</strong> au numéro{" "}
                            <a href="tel:+22798543837" className="text-[#00A651] font-bold underline">
                              +227 98 54 38 37
                            </a>
                          </li>
                          <li>Conservez votre reçu et entrez votre numéro de référence ci-dessous</li>
                        </ol>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Votre numéro de téléphone</label>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+227 90 00 00 00"
                          className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
                          style={{ borderColor: "rgba(0,0,0,0.15)" }}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Numéro de référence du reçu</label>
                        <input
                          type="text"
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          placeholder="Ex : NIT-2026-XXXXX"
                          className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
                          style={{ borderColor: "rgba(0,0,0,0.15)" }}
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1.5">
                          Votre abonnement sera activé dans les 24h après vérification.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Numéro de téléphone</label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+227 90 00 00 00"
                        className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
                        style={{ borderColor: "rgba(0,0,0,0.15)" }}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        Notre équipe vérifiera et activera votre accès sous 24h.
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {paymentState === "error" && paymentError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                      <span className="text-xs text-red-600">{paymentError}</span>
                    </div>
                  )}

                  {/* Security note */}
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Shield size={14} className="text-[#00A651] shrink-0" />
                    <p className="text-xs text-gray-500">
                      Vos informations sont transmises de manière sécurisée.
                    </p>
                  </div>

                  {/* Code promo */}
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Tag size={12} className="text-[#00A651]" /> Code promo
                    </p>
                    {promoApplied ? (
                      <div className="flex items-center justify-between px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg">
                        <span className="text-sm text-green-700 font-medium">{promoInput.toUpperCase()} — −{Math.round(discount * 100)}% appliqué</span>
                        <button type="button" onClick={handleRemovePromo} className="text-green-600 hover:text-green-800">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => { setPromoInput(e.target.value); setPromoError(null); }}
                          placeholder="Entrer votre code"
                          className="flex-1 px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651] uppercase"
                          style={{ borderColor: "rgba(0,0,0,0.15)" }}
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          disabled={!promoInput.trim()}
                          className="px-4 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                          style={{ background: "#00A651" }}
                        >
                          Appliquer
                        </button>
                      </div>
                    )}
                    {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={paymentState === "submitting"}
                    className="w-full py-3 text-white font-semibold rounded-full transition hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-70"
                    style={{ background: "linear-gradient(135deg, #00A651, #008c44)" }}>
                    {paymentState === "submitting" ? (
                      <><Loader size={14} className="animate-spin" /> Envoi en cours…</>
                    ) : (
                      <><Lock size={14} /> Envoyer ma demande — {formatPrice(finalPrice)} {plan.currency}</>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Order summary */}
            <div>
              <div className="bg-[#0D1B35] rounded-xl p-5 text-white sticky top-20">
                <h3 className="text-sm font-semibold mb-4 text-gray-300 uppercase tracking-wider">Récapitulatif</h3>
                <div className="mb-4">
                  <p className="text-[#D4A017] font-bold text-lg">{plan.name}</p>
                  <p className="text-gray-400 text-xs">
                    {isYearlySelected ? "par an · 2 mois offerts" : isQuarterlySelected ? "par trimestre · −10%" : plan.period.replace(/^\/\s*/, "par ")}
                  </p>
                </div>
                <div className="border-t border-white/10 pt-4 mb-4">
                  <div className="space-y-2">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-start gap-2">
                        <CheckCircle2 size={12} className="text-[#00A651] mt-0.5 shrink-0" />
                        <span className="text-xs text-gray-300">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-white/10 pt-4 space-y-2">
                  {promoApplied && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Prix normal</span>
                      <span className="text-gray-500 text-sm line-through">{formatPrice(plan.price)}</span>
                    </div>
                  )}
                  {promoApplied && (
                    <div className="flex justify-between items-center">
                      <span className="text-[#00A651] text-sm">{promoInput.toUpperCase()} (−{Math.round(discount * 100)}%)</span>
                      <span className="text-[#00A651] text-sm">−{formatPrice(plan.price - finalPrice)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Total</span>
                    <div className="text-right">
                      <p className="text-white font-bold text-xl">{formatPrice(finalPrice)}</p>
                      <p className="text-gray-500 text-xs">
                        {plan.currency} {isYearlySelected ? "par an" : isQuarterlySelected ? "par trimestre" : plan.period.replace(/^\/\s*/, "par ")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Hero */}
      <section className="py-12 sm:py-16 px-4"
        style={{ background: "linear-gradient(135deg, #0D1B35 0%, #1a3060 100%)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5 uppercase tracking-wider"
            style={{ background: "rgba(0,166,81,0.15)", color: "#00A651" }}>
            <Star size={12} /> Abonnement NFI REPORT
          </div>
          <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl mb-4 leading-tight">
            L'information financière africaine<br className="hidden sm:block" />
            <span style={{ color: "#00A651" }}>qui vous donne l'avantage</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
            Analyses exclusives, rapports financiers, données de marché et alertes personnalisées pour les professionnels de la finance en Afrique.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-12 mt-8">
            {[
              { icon: Users, value: "2 500+", label: "Abonnés actifs" },
              { icon: Award, value: "200+", label: "Articles publiés" },
              { icon: BarChart2, value: "12+", label: "Rapports annuels" },
              { icon: Globe, value: "3+", label: "Continents couverts" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="text-center">
                <Icon size={20} className="text-[#00A651] mx-auto mb-1.5" />
                <div className="text-white font-bold text-xl">{value}</div>
                <div className="text-gray-400 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-gray-900 text-2xl sm:text-3xl mb-2">Choisissez votre plan</h2>
            <p className="text-gray-500 text-sm">Sans engagement · Annulation à tout moment</p>

            {/* Billing toggle — 3 périodes */}
            <div className="inline-flex items-center mt-6 p-1 rounded-full bg-gray-100">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all ${
                  billingPeriod === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBillingPeriod("quarterly")}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all flex items-center gap-1.5 ${
                  billingPeriod === "quarterly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Trimestriel
                <span className="bg-[#C9A84C] text-white text-xs px-1.5 py-0.5 rounded-full font-semibold leading-none">
                  −10%
                </span>
              </button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-all flex items-center gap-1.5 ${
                  billingPeriod === "yearly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Annuel
                <span className="bg-[#00A651] text-white text-xs px-1.5 py-0.5 rounded-full font-semibold leading-none">
                  −17%
                </span>
              </button>
            </div>
            {billingPeriod === "yearly" && (
              <p className="text-[#00A651] text-xs mt-2 font-medium">2 mois offerts avec l'abonnement annuel</p>
            )}
            {billingPeriod === "quarterly" && (
              <p className="text-[#C9A84C] text-xs mt-2 font-medium">10% d'économie par rapport au tarif mensuel</p>
            )}
          </div>

          {/* Standard → message de montée en gamme */}
          {/* Non connecté → créer un compte d'abord */}
          {!tierLoading && !isSignedIn && (
            <div className="mb-8 bg-[#0D1B35] rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5">
              <div className="flex-1 text-center sm:text-left">
                <p className="text-white font-bold text-base mb-1">Première étape : créez votre compte gratuit</p>
                <p className="text-gray-400 text-sm">
                  Un compte gratuit vous donne accès à 3 articles premium par mois. Abonnez-vous ensuite pour un accès illimité.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link
                  to="/profile"
                  className="px-5 py-2.5 text-sm text-white font-semibold rounded-full transition hover:opacity-90 text-center"
                  style={{ background: "#00A651" }}
                >
                  Créer un compte gratuit
                </Link>
                <Link
                  to="/profile?mode=signin"
                  className="px-5 py-2.5 text-sm font-medium rounded-full border border-white/20 text-gray-300 hover:bg-white/5 transition text-center"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          )}

          {!tierLoading && isSignedIn && currentTier === "standard" && (
            <div className="mb-8 p-4 rounded-xl text-sm text-center font-medium text-white"
              style={{ background: "linear-gradient(135deg, #C9A84C, #b8942a)" }}>
              ✦ Vous êtes sur le plan Standard — passez en Premium pour débloquer tout le contenu exclusif.
            </div>
          )}

          {/* isStandardUpgradeView : l'utilisateur standard ne voit que le plan Premium */}
          {(() => {
            const isStandardUpgradeView = !tierLoading && isSignedIn && currentTier === "standard";
            const visiblePlans = SUBSCRIPTION_PLANS.filter((p) =>
              isStandardUpgradeView ? p.id === "premium" : true
            );

            return (
              <div className={`grid gap-5 ${isStandardUpgradeView ? "grid-cols-1 max-w-sm mx-auto" : "grid-cols-1 sm:grid-cols-3"}`}>
                {visiblePlans.map((plan) => {
                  // Pour l'utilisateur standard, le plan premium est mis en avant (style doré)
                  const isUpgradeTarget = isStandardUpgradeView && plan.id === "premium";
                  // highlighted = standard selon les données ; on force "highlighted" pour le plan cible montée
                  const effectiveHighlight = plan.highlighted || isUpgradeTarget;

                  const badgeBg = isUpgradeTarget
                    ? "linear-gradient(135deg, #C9A84C, #b8942a)"
                    : effectiveHighlight
                    ? "#00A651"
                    : "#D4A017";

                  const cardClass = `relative bg-white rounded-2xl border overflow-hidden transition-all ${
                    effectiveHighlight
                      ? "shadow-xl scale-105"
                      : "border-gray-200 hover:shadow-md"
                  }`;
                  const cardBorderColor = isUpgradeTarget
                    ? "#C9A84C"
                    : effectiveHighlight
                    ? "#00A651"
                    : undefined;

                  const btnClass = `w-full py-3 text-sm font-semibold rounded-full transition-all ${
                    plan.id === "free"
                      ? "bg-gray-100 text-gray-500 cursor-default"
                      : "text-white hover:opacity-90 active:scale-95"
                  }`;
                  const btnStyle =
                    plan.id !== "free"
                      ? isUpgradeTarget
                        ? { background: "linear-gradient(135deg, #C9A84C, #b8942a)" }
                        : effectiveHighlight
                        ? { background: "linear-gradient(135deg, #00A651, #008c44)" }
                        : { background: "linear-gradient(135deg, #00A651, #008c44)" }
                      : {};

                  const btnLabel =
                    plan.id === "free"
                      ? "Plan actuel"
                      : isUpgradeTarget
                      ? "✦ Passer en Premium"
                      : "Choisir ce plan";

                  return (
                    <div
                      key={plan.id}
                      className={cardClass}
                      style={cardBorderColor ? { borderColor: cardBorderColor, borderWidth: 2 } : {}}
                    >
                      {plan.badge && (
                        <div
                          className="px-4 py-2 text-center text-xs font-bold text-white uppercase tracking-wider"
                          style={{ background: badgeBg }}
                        >
                          {plan.badge}
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-gray-900 font-bold text-lg mb-1">{plan.name}</h3>
                        <div className="flex items-end gap-1 mb-1">
                          <span className="text-3xl font-black text-gray-900">
                            {formatPrice(
                              plan.id === "free" ? 0
                              : billingPeriod === "yearly"    ? plan.price * 10
                              : billingPeriod === "quarterly" ? Math.round(plan.price * 3 * 0.9)
                              : plan.price
                            )}
                          </span>
                          <span className="text-gray-400 text-sm pb-0.5">{plan.currency}</span>
                        </div>
                        <p className="text-gray-500 text-xs mb-1">
                          {plan.id === "free" ? plan.period
                            : billingPeriod === "yearly"    ? "par an"
                            : billingPeriod === "quarterly" ? "par trimestre"
                            : plan.period.replace(/^\/\s*/, "par ")}
                        </p>
                        {billingPeriod === "yearly" && plan.id !== "free" && (
                          <p className="text-[#00A651] text-xs mb-4 font-medium">
                            soit {formatPrice(plan.price)} {plan.currency} par mois · 2 mois offerts
                          </p>
                        )}
                        {billingPeriod === "quarterly" && plan.id !== "free" && (
                          <p className="text-[#C9A84C] text-xs mb-4 font-medium">
                            soit {formatPrice(Math.round(plan.price * 0.9))} {plan.currency} par mois · −10%
                          </p>
                        )}
                        {(billingPeriod === "monthly" || plan.id === "free") && <div className="mb-4" />}

                        <ul className="space-y-2.5 mb-6 mt-0">
                          {plan.features.map((f) => (
                            <li key={f} className="flex items-start gap-2">
                              <CheckCircle2
                                size={14}
                                className="shrink-0 mt-0.5"
                                style={{ color: isUpgradeTarget ? "#C9A84C" : "#00A651" }}
                              />
                              <span className="text-sm text-gray-700">{f}</span>
                            </li>
                          ))}
                        </ul>

                        <button
                          onClick={() => handleSubscribe(plan.id)}
                          disabled={plan.id === "free"}
                          className={btnClass}
                          style={btnStyle}
                        >
                          {btnLabel}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* Features comparison */}
          <div className="mt-12">
            <h3 className="text-gray-900 font-bold text-xl text-center mb-6">Ce que vous obtenez</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { Icon: BarChart2, title: "Analyses de marché", desc: "Rapports détaillés sur les marchés financiers africains et mondiaux" },
                { Icon: Bell, title: "Alertes personnalisées", desc: "Notifications en temps réel sur les sujets qui vous intéressent" },
                { Icon: Download, title: "Rapports PDF", desc: "Téléchargez les rapports exclusifs pour consultation hors-ligne" },
                { Icon: Globe, title: "Couverture globale", desc: "30+ pays africains et les marchés internationaux les plus impactants" },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="bg-white rounded-xl border p-5" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: "rgba(0,166,81,0.1)" }}>
                    <Icon size={18} className="text-[#00A651]" />
                  </div>
                  <h4 className="text-gray-900 font-semibold text-sm mb-1">{title}</h4>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-10 px-4 bg-white border-y" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-gray-900 text-xl text-center mb-8">Ce que disent nos abonnés</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                quote: "NFI REPORT est devenu indispensable pour ma veille financière sur l'Afrique de l'Ouest. Les analyses BCEAO sont particulièrement précieuses.",
                name: "Ibrahim K.",
                role: "Directeur financier, Niamey",
              },
              {
                quote: "Les rapports trimestriels sur les bourses africaines m'aident à prendre de meilleures décisions d'investissement. Excellent rapport qualité-prix.",
                name: "Aïcha M.",
                role: "Analyste investissements, Dakar",
              },
              {
                quote: "En tant qu'étudiant en économie, j'accède à des analyses de niveau professionnel qui complètent parfaitement ma formation.",
                name: "Moussa T.",
                role: "Étudiant Master Finance, Abidjan",
              },
            ].map(({ quote, name, role }) => (
              <div key={name} className="bg-gray-50 rounded-xl p-5">
                <p className="text-gray-700 text-sm italic leading-relaxed mb-4"
                  style={{ fontFamily: "var(--font-serif)" }}>
                  "{quote}"
                </p>
                <div>
                  <p className="text-gray-900 font-semibold text-sm">{name}</p>
                  <p className="text-gray-500 text-xs">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-gray-900 text-2xl text-center mb-8">Questions fréquentes</h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                <button
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-gray-900">{item.q}</span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 shrink-0 ml-3 transition-transform ${openFAQ === i ? "rotate-180" : ""}`}
                  />
                </button>
                {openFAQ === i && (
                  <div className="px-5 pb-4 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <p className="text-sm text-gray-600 leading-relaxed pt-3">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}