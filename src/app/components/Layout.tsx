import { useEffect, useRef, Suspense } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

const SESSION_KEY = "nfi_last_path";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

/** Sauvegarde le chemin courant et le restaure après un rechargement. */
function PersistRoute() {
  const location = useLocation();
  const navigate  = useNavigate();
  const restored  = useRef(false);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved && saved !== "/" && location.pathname === "/") {
        navigate(saved, { replace: true });
      }
    } catch {
      // sessionStorage indisponible (navigation privée / stockage désactivé)
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, location.pathname);
    } catch {
      // sessionStorage indisponible
    }
  }, [location.pathname]);

  return null;
}

// Spinner de chargement entre les pages (lazy routes)
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-full border-4 border-gray-200 animate-spin"
          style={{ borderTopColor: "#00A651" }}
        />
        <span className="text-sm text-gray-400">Chargement…</span>
      </div>
    </div>
  );
}

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <PersistRoute />
      <ScrollToTop />
      <Navbar />
      <main id="main-content" className="flex-1" role="main">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
