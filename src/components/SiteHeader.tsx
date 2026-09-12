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
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-ink/92 backdrop-blur-md border-b border-line" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <div className="flex items-center justify-between h-[68px] gap-4">
          <Link href="/" className="group flex items-center gap-3 shrink-0" aria-label="Pizza Basilico, accueil">
            <span className="flex h-[26px] w-[5px] overflow-hidden rounded-full" aria-hidden="true">
              <span className="w-[5px] bg-basil-deep" />
            </span>
            <span className="leading-none">
              <span className="block text-[0.6rem] tracking-[0.3em] uppercase text-ember/80">Pizza</span>
              <span className="display block text-xl text-cream group-hover:text-ember transition-colors">
                BASILICO
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[0.92rem] text-cream-dim hover:text-cream transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/compte/connexion" className="text-[0.92rem] text-cream-dim hover:text-cream transition-colors">
              Mon compte
            </Link>
            <Link href="/carte" className="btn btn-primary !py-2.5 !px-5 !text-[0.85rem]">
              Commander
            </Link>
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden flex flex-col justify-center gap-[5px] w-10 h-10 items-center rounded-lg border border-line"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
          >
            <span
              className={`block h-[1.5px] w-5 bg-cream transition-transform duration-200 ${open ? "translate-y-[6.5px] rotate-45" : ""}`}
            />
            <span className={`block h-[1.5px] w-5 bg-cream transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
            <span
              className={`block h-[1.5px] w-5 bg-cream transition-transform duration-200 ${open ? "-translate-y-[6.5px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-line bg-ink/97 backdrop-blur-md">
          <nav className="mx-auto max-w-6xl px-5 py-4 flex flex-col gap-1">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="py-3 text-cream border-b border-line/60">
                {item.label}
              </Link>
            ))}
            <Link href="/compte/connexion" className="py-3 text-cream-dim border-b border-line/60">
              Mon compte
            </Link>
            <Link href="/carte" className="btn btn-primary mt-4">
              Commander
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
