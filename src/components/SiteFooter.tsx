"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="relative mt-24 border-t border-line bg-white/60 backdrop-blur">
      <div className="mx-auto max-w-6xl px-5 lg:px-8 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.webp" alt="Pizza Basilico" width={110} height={104} className="h-24 w-auto" />
            <p className="text-sm text-fg-dim mt-3 max-w-xs leading-relaxed">
              Pizzas artisanales cuites au feu de bois. Pâte maison, produits frais, cuisson à la commande.
            </p>
            <div className="flex gap-2 mt-5">
              <span className="chip chip-basil">Feu de bois</span>
              <span className="chip">Food truck itinérant</span>
            </div>
          </div>

          <nav className="flex flex-col gap-2.5 text-sm">
            <p className="eyebrow mb-1.5">Navigation</p>
            <Link href="/carte" className="text-fg-dim hover:text-fg transition-colors">La carte</Link>
            <Link href="/notre-histoire" className="text-fg-dim hover:text-fg transition-colors">Notre histoire</Link>
            <Link href="/#nous-trouver" className="text-fg-dim hover:text-fg transition-colors">Nous trouver</Link>
            <Link href="/suivi" className="text-fg-dim hover:text-fg transition-colors">Suivre ma commande</Link>
            <Link href="/compte/connexion" className="text-fg-dim hover:text-fg transition-colors">Mon compte</Link>
          </nav>

          <div className="flex flex-col gap-2.5 text-sm">
            <p className="eyebrow mb-1.5">Contact</p>
            <a href="tel:+33645230656" className="text-fg-dim hover:text-fg transition-colors tnum">
              06 45 23 06 56
            </a>
            <a
              href="https://instagram.com/pizzabasilico2020"
              target="_blank"
              rel="noreferrer"
              className="text-fg-dim hover:text-fg transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://facebook.com/PizzaBasilico"
              target="_blank"
              rel="noreferrer"
              className="text-fg-dim hover:text-fg transition-colors"
            >
              Facebook
            </a>
            <Link href="/traiteur" className="text-fg-dim hover:text-fg transition-colors">
              Traiteur & événements
            </Link>
          </div>
        </div>

        <div className="hairline my-10" />

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-fg-faint">
          <p>© {new Date().getFullYear()} Pizza Basilico</p>
          <div className="flex gap-5">
            <Link href="/mentions-legales" className="hover:text-fg-dim transition-colors">Mentions légales</Link>
            <Link href="/cgv" className="hover:text-fg-dim transition-colors">CGV</Link>
            <Link href="/confidentialite" className="hover:text-fg-dim transition-colors">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
