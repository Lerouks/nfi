import { useState } from "react";
import { Link } from "react-router";
import { Youtube, Mail, Phone, MapPin, Loader, CheckCircle2, AlertCircle } from "lucide-react";
import { subscribeNewsletter } from "../../lib/supabase";
import { analytics } from "../../lib/posthog";
import { sendWelcomeEmail } from "../../lib/email";

function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.2-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@nfireport?_r=1&_t=ZN-94CbVRmqpzn",
    Icon: TikTokIcon,
    hoverColor: "#010101",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/1GUFN4SfHz/?mibextid=wwXIfr",
    Icon: FacebookIcon,
    hoverColor: "#1877F2",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/nfireport?igsh=Y3FmYTYyZXBrd3ph&utm_source=qr",
    Icon: InstagramIcon,
    hoverColor: "#E1306C",
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@nfireport?si=bnYKo7AVK9",
    Icon: Youtube,
    hoverColor: "#FF0000",
  },
];

function FooterNewsletter() {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    setError(null);
    try {
      const saved = await subscribeNewsletter(email);
      if (saved) {
        sendWelcomeEmail(email).catch(() => {});
      }
      analytics.newsletterSignup(email).catch(() => {});
      setSuccess(true);
      setEmail("");
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mt-5">
        <p className="text-xs text-gray-500 mb-2">Newsletter quotidienne</p>
        <div className="flex items-center gap-2 text-green-400 text-xs py-2">
          <CheckCircle2 size={14} aria-hidden="true" />
          <span>Inscription confirmée ! Vérifiez votre email.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5" aria-label="Inscription à la newsletter">
      <p className="text-xs text-gray-500 mb-2" id="footer-newsletter-label">
        Newsletter quotidienne
      </p>
      <form
        className="flex gap-2"
        onSubmit={handleSubmit}
        aria-labelledby="footer-newsletter-label"
        noValidate
      >
        <label htmlFor="footer-email" className="sr-only">Votre adresse e-mail</label>
        <input
          id="footer-email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Votre e-mail"
          autoComplete="email"
          required
          disabled={loading}
          className="flex-1 px-3 py-1.5 text-sm bg-white/10 border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#00A651] disabled:opacity-50"
          style={{ borderColor: "rgba(0,166,81,0.3)" }}
        />
        <button
          type="submit"
          disabled={loading}
          aria-label="S'inscrire à la newsletter"
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-white font-medium rounded-lg transition hover:opacity-90 disabled:opacity-60 shrink-0"
          style={{ background: "#00A651" }}
        >
          {loading
            ? <Loader size={12} className="animate-spin" aria-hidden="true" />
            : "S'inscrire"}
        </button>
      </form>
      {error && (
        <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5" role="alert">
          <AlertCircle size={11} aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-[#0D1B35] text-white" role="contentinfo" aria-label="Pied de page NFI REPORT">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex flex-col mb-4">
              <div className="text-white font-black text-xl tracking-tight leading-none">
                NFI <span className="text-[#00A651]">REPORT</span>
              </div>
              <div className="text-[10px] text-gray-400 tracking-widest uppercase mt-0.5">
                Niger Financial Insights
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-5">
              La référence africaine en information économique et financière. Analyses indépendantes, données fiables, perspectives stratégiques.
            </p>
            <div className="flex gap-2">
              {SOCIAL_LINKS.map(({ label, href, Icon, hoverColor }) => (
                <a
                  key={label}
                  href={href}
                  target={href !== "#" ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-all duration-200"
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = hoverColor;
                    (e.currentTarget as HTMLElement).style.color = "#fff";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                    (e.currentTarget as HTMLElement).style.color = "";
                  }}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Sections */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Sections
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Économie Africaine", href: "/section/economie-africaine" },
                { label: "Économie Mondiale", href: "/section/economie-mondiale" },
                { label: "Focus Niger", href: "/section/focus-niger" },
                { label: "Analyses de Marché", href: "/section/analyses-de-marche" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link to={href} className="text-gray-400 text-sm transition-colors hover:text-[#00A651]">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Entreprise
            </h4>
            <ul className="space-y-2.5">
              <li><Link to="/about" className="text-gray-400 text-sm transition-colors hover:text-[#00A651]">À propos</Link></li>
              <li><Link to="/about" className="text-gray-400 text-sm transition-colors hover:text-[#00A651]">Notre équipe</Link></li>
              <li><Link to="/subscribe" className="text-gray-400 text-sm transition-colors hover:text-[#00A651]">Abonnement</Link></li>
              <li><a href="mailto:pub@nfireport.com" className="text-gray-400 text-sm transition-colors hover:text-[#00A651]">Publicité</a></li>
              <li><a href="mailto:partenariats@nfireport.com" className="text-gray-400 text-sm transition-colors hover:text-[#00A651]">Partenariats</a></li>
              <li><a href="mailto:recrutement@nfireport.com" className="text-gray-400 text-sm transition-colors hover:text-[#00A651]">Recrutement</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">
              Contact
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="text-[#00A651] mt-0.5 shrink-0" />
                <span className="text-gray-400 text-sm">Niamey, Niger<br />Quartier Plateau</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={15} className="text-[#00A651] shrink-0" />
                <a href="mailto:contact@nfireport.com" className="text-gray-400 text-sm transition-colors hover:text-white">
                  contact@nfireport.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={15} className="text-[#00A651] shrink-0" />
                <a href="tel:+22798543837" className="text-gray-400 text-sm transition-colors hover:text-white">
                  +227 98 54 38 37
                </a>
              </li>
            </ul>
            <FooterNewsletter />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-500 text-xs text-center sm:text-left">
            © 2026 NFI REPORT. Tous droits réservés.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { label: "Mentions légales", href: "/legal/mentions-legales" },
              { label: "Confidentialité", href: "/legal/confidentialite" },
              { label: "CGU", href: "/legal/cgu" },
              { label: "Cookies", href: "/legal/cookies" },
            ].map(({ label, href }) => (
              <Link key={label} to={href} className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}