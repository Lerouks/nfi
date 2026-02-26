import { Link } from "react-router";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl font-black mb-4" style={{ color: "#e5e7eb" }}>404</div>
        <div className="text-4xl mb-4">🇳🇪</div>
        <h1 className="text-gray-900 text-2xl font-bold mb-3">Page introuvable</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          La page que vous recherchez n'existe pas ou a été déplacée. Revenez à l'accueil pour continuer votre lecture.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/"
            className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm text-white font-medium rounded-full transition hover:opacity-90"
            style={{ background: "#00A651" }}>
            <Home size={15} /> Accueil
          </Link>
          <Link to="/search"
            className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm text-[#00A651] font-medium rounded-full border-2 border-[#00A651] hover:bg-[#00A651] hover:text-white transition-all">
            <Search size={15} /> Rechercher
          </Link>
        </div>
      </div>
    </div>
  );
}
