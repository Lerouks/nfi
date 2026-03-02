import { useState } from "react";
import { Link } from "react-router";
import { Twitter, Linkedin, Mail, Target, Eye, Shield, Globe } from "lucide-react";
import { NewsletterSignup } from "../components/NewsletterSignup";
import { sendContactMessage } from "@/lib/supabase";
import logoImg from "@/assets/logo";
// ─── Équipe fondatrice ────────────────────────────────────────────────────────
const FOUNDERS = [
  {
    id: "raouf",
    initials: "RB",
    name: "Raouf B.",
    role: "Co-Fondateur — NFI REPORT",
    bio: "Entrepreneur engagé et fin observateur des dynamiques économiques régionales, Raouf est à l’origine de la vision fondatrice de NFI REPORT. Convaincu que l’Afrique mérite une presse économique d’excellence, il œuvre à construire une plateforme indépendante capable d’éclairer investisseurs, dirigeants et institutions.",    
    color: "#0D1B35",
    accent: "#00A651",
  },
  {
    id: "ibrahim",
    initials: "IS",
    name: "Ibrahim S.",
    role: "Co-Fondateur — NFI REPORT",
    bio: "Ingénieur et entrepreneur engagé dans le développement économique africain, Ibrahim structure la vision stratégique de NFI REPORT. Son approche analytique, inspirée des standards internationaux, vise à élever le débat économique au Niger et en Afrique en proposant une information indépendante, rigoureuse et orientée vers l’action.",    
    color: "#00A651",
    accent: "#0D1B35",
  },
];

type FormState = "idle" | "sending" | "success" | "error";

function ContactForm() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus]   = useState<FormState>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject || !message.trim()) return;
    setStatus("sending");
    const ok = await sendContactMessage(name.trim(), email.trim(), subject, message.trim());
    setStatus(ok ? "success" : "error");
    if (ok) {
      setName(""); setEmail(""); setSubject(""); setMessage("");
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Nom complet</label>
          <input
            type="text"
            placeholder="Votre nom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
            style={{ borderColor: "rgba(0,0,0,0.15)" }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651]"
            style={{ borderColor: "rgba(0,0,0,0.15)" }}
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Sujet</label>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651] bg-white"
          style={{ borderColor: "rgba(0,0,0,0.15)" }}
        >
          <option value="">Choisir un sujet...</option>
          <option value="publicite">Publicité</option>
          <option value="partenariat">Partenariat</option>
          <option value="recrutement">Recrutement</option>
          <option value="redaction">Proposition d'article</option>
          <option value="autre">Autre</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Message</label>
        <textarea
          rows={4}
          placeholder="Votre message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          className="w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A651]/30 focus:border-[#00A651] resize-none"
          style={{ borderColor: "rgba(0,0,0,0.15)" }}
        />
      </div>

      {status === "success" && (
        <p className="text-sm text-[#00A651] font-medium">
          Message envoyé ! Nous vous répondrons dans les plus brefs délais.
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-500 font-medium">
          Une erreur s'est produite. Veuillez réessayer ou écrire directement à contact@nfireport.com.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="px-6 py-2.5 text-sm text-white font-medium rounded-full transition hover:opacity-90 disabled:opacity-60"
        style={{ background: "#00A651" }}
      >
        {status === "sending" ? "Envoi en cours…" : "Envoyer le message"}
      </button>
    </form>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Hero */}
      <section className="relative overflow-hidden py-14 sm:py-20 px-4"
        style={{ background: "linear-gradient(135deg, #0D1B35, #1a3060)" }}>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-xl">
              <img 
                src={logoImg} 
                alt="NFI REPORT" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5 uppercase tracking-wider"
            style={{ background: "rgba(0,166,81,0.15)", color: "#00A651" }}>
            <Globe size={12} /> Notre histoire
          </div>
          <h1 className="text-white text-3xl sm:text-4xl lg:text-5xl mb-5 leading-tight">
            La voix indépendante de <br className="hidden sm:block" />
            <span className="text-[#00A651]">l'économie nigerienne</span>
          </h1>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            NFI REPORT est né en 2025 à Niamey, de la conviction que le Niger méritait une presse économique et financière de haute qualité, indépendante et ancrée dans les réalités du continent.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5" style={{ background: "#00A651", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-5" style={{ background: "#D4A017", transform: "translate(-30%, 30%)" }} />
      </section>

      {/* Stats */}
      <section className="bg-white border-b py-8" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: "2025", label: "Fondée à Niamey" },
              { value: "100 000+", label: "Lecteurs mensuels" },
              { value: "5 000+", label: "Abonnés" },
              { value: "3+", label: "Continents couverts" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl sm:text-3xl font-black text-[#0D1B35]">{value}</div>
                <div className="text-gray-500 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-5 rounded-full bg-[#00A651]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#00A651]">Notre mission</span>
              </div>
              <h2 className="text-gray-900 text-2xl sm:text-3xl mb-4">
                Informer, analyser et éclairer les décisions économiques en Afrique
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Dans un contexte de transformation économique rapide du continent africain, NFI REPORT s'est donné pour mission de fournir une information économique et financière fiable, approfondie et accessible aux professionnels comme au grand public.
              </p>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Fondé au Niger, le pays aux immenses richesses naturelles et au potentiel économique souvent sous-estimé, nous avons étendu notre couverture à l'ensemble du continent et aux marchés internationaux qui impactent l'Afrique.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { Icon: Target, title: "Rigueur journalistique", desc: "Vérification systématique des faits et des sources" },
                  { Icon: Eye, title: "Indépendance éditoriale", desc: "Aucune influence politique ou financière sur nos contenus" },
                  { Icon: Shield, title: "Responsabilité", desc: "Corrections publiques et droit de réponse garantis" },
                  { Icon: Globe, title: "Perspective africaine", desc: "Les réalités africaines au cœur de notre analyse" },
                ].map(({ Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Icon size={15} className="text-[#00A651] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1742996111692-2d924f12a058?w=600&h=500&fit=crop"
                alt="Équipe NFI REPORT"
                className="rounded-2xl shadow-xl w-full object-cover"
                style={{ height: 380 }}
              />
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-lg border"
                style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                <p className="text-[#00A651] font-black text-2xl">2025</p>
                <p className="text-gray-600 text-xs">Fondé à Niamey</p>
              </div>
              <div className="absolute -top-4 -right-4 bg-[#D4A017] rounded-xl p-4 shadow-lg">
                <p className="text-white font-black text-sm tracking-wider">Niger</p>
                <p className="text-white text-xs opacity-80">Made in Niger</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="team" className="py-12 sm:py-16 px-4 bg-white border-y" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-1 h-5 rounded-full bg-[#00A651]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#00A651]">Notre équipe</span>
            </div>
            <h2 className="text-gray-900 text-2xl sm:text-3xl">Les fondateurs de NFI REPORT</h2>
            <p className="text-gray-500 text-sm mt-2 max-w-xl mx-auto">
              Deux co-fondateurs unis par une vision commune : bâtir la première plateforme d'information financière de référence au Niger.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {FOUNDERS.map((member) => (
              <div key={member.id} className="bg-gray-50 rounded-2xl overflow-hidden group hover:shadow-lg transition-all border" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                {/* Avatar illustratif */}
                <div
                  className="relative h-40 flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${member.color}, ${member.color}cc)` }}
                >
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-white/20 shadow-xl"
                    style={{ background: member.accent }}
                  >
                    <span className="text-white font-black" style={{ fontSize: "2rem" }}>
                      {member.initials}
                    </span>
                  </div>
                  {/* Badge co-fondateur */}
                  <div
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap"
                    style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
                  >
                    Co-Fondateur
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-gray-900 font-bold text-base" style={{ fontSize: "1.15rem" }}>
                    {member.name}
                  </h3>
                  <p className="text-xs mb-3 font-semibold" style={{ color: member.accent }}>
                    {member.role}
                  </p>
                  <p className="text-gray-500 text-xs leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experts & Collaborateurs */}
      <section className="py-12 sm:py-16 px-4 bg-[#F7F8FA]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-1 h-5 rounded-full bg-[#00A651]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#00A651]">Notre réseau d'expertise</span>
            </div>
            <h2 className="text-gray-900 text-2xl sm:text-3xl mb-3">Nous faisons appel aux meilleurs experts</h2>
            <p className="text-gray-500 text-sm max-w-2xl mx-auto leading-relaxed">
              Pour garantir la qualité et la rigueur de nos contenus, NFI REPORT collabore régulièrement avec un réseau de spécialistes indépendants issus de différents horizons professionnels.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {[
              {
                icon: "📊",
                title: "Économistes & Chercheurs",
                desc: "Nous faisons appel à des économistes africains et internationaux, chercheurs en institutions académiques ou think tanks, pour enrichir nos analyses macroéconomiques avec une profondeur scientifique.",
              },
              {
                icon: "💹",
                title: "Analystes Financiers",
                desc: "Des professionnels de la finance (gestionnaires de fonds, analystes de marchés, experts en stratégie d'investissement) contribuent à nos rapports sur les marchés financiers africains.",
              },
              {
                icon: "📰",
                title: "Journalistes Spécialisés",
                desc: "Correspondants locaux et journalistes d'investigation spécialisés en économie collaborent à nos reportages de terrain pour apporter une information ancrée dans les réalités africaines.",
              },
              {
                icon: "🏭",
                title: "Dirigeants d'Entreprises",
                desc: "Des chefs d'entreprises, entrepreneurs et décideurs du secteur privé africain partagent leur expérience et leur vision pour éclairer nos lecteurs sur les dynamiques du business.",
              },
              {
                icon: "⚖️",
                title: "Experts Juridiques & Fiscaux",
                desc: "Avocats d'affaires, fiscalistes et experts en droit des investissements nous aident à décrypter les cadres réglementaires et législatifs qui encadrent l'activité économique.",
              },
              {
                icon: "🌍",
                title: "Institutions & Organisations",
                desc: "NFI REPORT entretient des relations avec des représentants d'institutions régionales (CEDEAO, UEMOA, UA) et d'organisations internationales (FMI, Banque Mondiale) pour un éclairage institutionnel précis.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="text-gray-900 font-semibold text-sm mb-2">{title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Note éditoriale */}
          <div className="bg-[#0D1B35] rounded-2xl p-6 sm:p-8 text-white text-center">
            <p className="text-lg sm:text-xl leading-relaxed mb-3" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
              « Chaque contributeur qui signe un article sur NFI REPORT engage sa réputation professionnelle. Nous vérifions les faits, confrontons les sources et assurons l'indépendance éditoriale de chaque contenu publié. »
            </p>
            <p className="text-[#00A651] text-sm font-semibold">— La Direction éditoriale de NFI REPORT</p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-gray-900 text-2xl sm:text-3xl mb-2">Contactez-nous</h2>
            <p className="text-gray-500 text-sm">Une question, un partenariat, un article à proposer ?</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            {[
              { title: "Rédaction", email: "redaction@nfireport.com", desc: "Propositions d'articles" },
              { title: "Commercial", email: "contact@nfireport.com", desc: "Publicité & partenariats" },
              { title: "Recrutement", email: "recrutement@nfireport.com", desc: "Rejoindre l'équipe" },
            ].map(({ title, email, desc }) => (
              <div key={title} className="bg-white rounded-xl border p-5 text-center" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                <div className="w-10 h-10 bg-[#00A651]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail size={18} className="text-[#00A651]" />
                </div>
                <h3 className="text-gray-900 font-semibold text-sm mb-1">{title}</h3>
                <a href={`mailto:${email}`} className="text-[#00A651] text-xs hover:underline break-all">{email}</a>
                <p className="text-gray-500 text-xs mt-1">{desc}</p>
              </div>
            ))}
          </div>
          {/* Contact form */}
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            <h3 className="text-gray-900 font-semibold mb-4">Envoyez-nous un message</h3>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <div className="px-4 pb-12">
        <div className="max-w-3xl mx-auto">
          <NewsletterSignup />
        </div>
      </div>
    </div>
  );
}