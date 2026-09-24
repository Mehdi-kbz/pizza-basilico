"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/** Bouton discret en bas à droite : remonte en haut de la page (visible après un peu de défilement). */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/admin")) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Remonter en haut de la page"
      tabIndex={visible ? 0 : -1}
      className={`fixed right-4 bottom-24 md:bottom-8 md:right-6 z-[55] grid h-11 w-11 place-items-center rounded-full bg-white/90 backdrop-blur border border-white text-fg shadow-[0_14px_30px_-12px_rgba(160,72,30,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:text-ember ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
