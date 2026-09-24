"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/carte", label: "La carte" },
  { href: "/notre-histoire", label: "Notre histoire" },
  { href: "/#nous-trouver", label: "Nous trouver" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  // L'espace admin a sa propre chrome : pas de navigation vitrine par-dessus.
  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-50 px-3 sm:px-5 pt-3">
      <div
        className={`mx-auto max-w-6xl rounded-full border transition-all duration-500 ${
          scrolled
            ? "bg-white/80 backdrop-blur-xl border-white shadow-[0_18px_40px_-22px_rgba(160,72,30,0.45)]"
            : "bg-white/50 backdrop-blur-md border-white/70"
        }`}
      >
        <div className="flex items-center justify-between h-[60px] gap-4 pl-5 pr-2.5">
          <Link href="/" className="group flex items-center gap-2.5 shrink-0" aria-label="Pizza Basilico, accueil">
            <span className="grid place-items-center h-8 w-8 rounded-full bg-gradient-to-b from-flame to-flame-deep text-white text-sm shadow-sm" aria-hidden="true">
              🍕
            </span>
            <span className="display text-[1.15rem] text-fg group-hover:text-ember transition-colors">
              Pizza Basilico
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 rounded-full text-[0.9rem] font-medium text-fg-dim hover:text-fg hover:bg-surface-2 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Link href="/compte/connexion" className="px-4 py-2 rounded-full text-[0.9rem] font-medium text-fg-dim hover:text-fg transition-colors">
              Mon compte
            </Link>
            <Link href="/carte" className="btn btn-primary !py-2.5 !px-5 !text-[0.85rem]">
              Commander
            </Link>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden flex flex-col justify-center gap-[5px] w-11 h-11 items-center rounded-full bg-surface-2"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
          >
            <span
              className={`block h-[1.5px] w-5 bg-fg transition-transform duration-200 ${open ? "translate-y-[6.5px] rotate-45" : ""}`}
            />
            <span className={`block h-[1.5px] w-5 bg-fg transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
            <span
              className={`block h-[1.5px] w-5 bg-fg transition-transform duration-200 ${open ? "-translate-y-[6.5px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden mx-auto max-w-6xl mt-2 rounded-[28px] bg-white/95 backdrop-blur-xl border border-white shadow-[0_24px_50px_-24px_rgba(160,72,30,0.5)]">
          <nav className="px-5 py-3 flex flex-col">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="py-3.5 text-fg font-medium border-b border-line">
                {item.label}
              </Link>
            ))}
            <Link href="/compte/connexion" className="py-3.5 text-fg-dim border-b border-line">
              Mon compte
            </Link>
            <Link href="/carte" className="btn btn-primary my-4">
              Commander
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
