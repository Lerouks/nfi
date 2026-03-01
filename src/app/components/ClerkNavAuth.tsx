/**
 * ClerkNavAuth — Boutons d'authentification Clerk pour la Navbar.
 *
 * Rendu uniquement quand le ClerkProvider est actif.
 * - Connecté    → <UserButton> (avatar + menu Clerk)
 * - Déconnecté  → icône user → dropdown → SignInButton modal
 */
import { useState, useRef, useEffect } from "react";
import { useUser, SignInButton, UserButton } from "@clerk/clerk-react";
import { Link } from "react-router";
import { User, LogIn, Star } from "lucide-react";
import { useSubscription } from "../../lib/subscription";

export function ClerkNavAuth() {
  const { isSignedIn, isLoaded } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Pendant le chargement de Clerk → icône neutre (évite le flash)
  if (!isLoaded) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
    );
  }

  // ── Connecté : UserButton Clerk (avatar + menu de déconnexion) ──────────────
  if (isSignedIn) {
    return (
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "w-8 h-8 rounded-full ring-2 ring-[#00A651]/30",
            userButtonPopoverCard: "shadow-xl border border-gray-100 rounded-xl",
          },
        }}
      />
    );
  }

  // ── Déconnecté : même icône qu'avant, dropdown avec SignInButton ────────────
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center p-1.5 rounded-full hover:bg-gray-100 transition text-gray-600"
        aria-label="Menu utilisateur"
      >
        <div className="w-8 h-8 rounded-full bg-[#0D1B35] flex items-center justify-center">
          <User size={15} className="text-white" />
        </div>
      </button>

      {menuOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border py-2 z-50"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
          onMouseLeave={() => setMenuOpen(false)}
        >
          {/* Se connecter → ouvre la modal Clerk */}
          <SignInButton mode="modal">
            <button
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition w-full text-left"
            >
              <LogIn size={15} className="text-[#00A651]" />
              Se connecter
            </button>
          </SignInButton>

          {/* S'abonner → page d'abonnement */}
          <Link
            to="/subscribe"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <Star size={15} className="text-[#00A651]" />
            S'abonner
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Bouton mobile (menu hamburger) ──────────────────────────────────────────
export function ClerkMobileAuth({ onClose }: { onClose: () => void }) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5">
        <UserButton afterSignOutUrl="/" />
        <span className="text-sm text-gray-700">Mon compte</span>
      </div>
    );
  }

  return (
    <SignInButton mode="modal">
      <button
        onClick={onClose}
        className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
      >
        <LogIn size={14} className="text-[#00A651]" />
        Se connecter
      </button>
    </SignInButton>
  );
}

// ─── Bouton "S'abonner" conditionnel selon le tier ────────────────────────────
// - premium  → masqué (déjà au meilleur plan)
// - standard → "Passer en Premium"
// - free / non connecté → "S'abonner"
export function NavSubscribeButton({ mobile = false }: { mobile?: boolean }) {
  const { isSignedIn, user, isLoaded } = useUser();
  const subscription = useSubscription(isSignedIn && user ? user.id : null);
  const tier = subscription.tier;

  // Premium → rien à afficher
  if (isLoaded && !subscription.isLoading && isSignedIn && tier === "premium") return null;

  const isPremiumUpgrade = isLoaded && !subscription.isLoading && isSignedIn && tier === "standard";
  const label = isPremiumUpgrade ? "Passer en Premium" : "S'abonner";
  const style = isPremiumUpgrade
    ? { background: "linear-gradient(135deg, #C9A84C, #b8942a)" }
    : { background: "linear-gradient(135deg, #00A651, #008c44)" };

  if (mobile) {
    return (
      <Link
        to="/subscribe"
        className="flex items-center justify-center gap-2 w-full py-2.5 text-sm text-white rounded-full font-medium"
        style={style}
      >
        <Star size={14} /> {label}
      </Link>
    );
  }

  return (
    <Link
      to="/subscribe"
      className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm text-white rounded-full font-medium transition-all hover:opacity-90 active:scale-95"
      style={style}
    >
      <Star size={13} /> {label}
    </Link>
  );
}
