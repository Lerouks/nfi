/**
 * ScrollReveal — Anime les sections quand elles entrent dans le viewport.
 *
 * Usage :
 *   <ScrollReveal>
 *     <MonComposant />
 *   </ScrollReveal>
 *
 *   <ScrollReveal delay={150}>   ← délai en ms (stagger)
 *     <MonComposant />
 *   </ScrollReveal>
 *
 * L'animation est désactivée automatiquement si l'utilisateur a
 * configuré "prefers-reduced-motion: reduce" dans son OS.
 */
import { useEffect, useRef, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  /** Délai avant le déclenchement de l'animation (ms). Permet le stagger. */
  delay?: number;
  /** Classes CSS supplémentaires sur le wrapper. */
  className?: string;
}

export function ScrollReveal({ children, delay = 0, className = "" }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Pas d'animation si l'utilisateur a demandé la réduction de mouvement
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (delay > 0) {
          const t = setTimeout(() => el.classList.add("is-visible"), delay);
          observer.disconnect();
          return () => clearTimeout(t);
        }
        el.classList.add("is-visible");
        observer.disconnect();
      },
      // Déclenche quand 8 % du composant est visible,
      // avec une marge négative en bas pour ne pas déclencher trop tôt.
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`nfi-reveal${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
