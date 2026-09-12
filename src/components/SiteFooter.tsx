"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="relative mt-24 border-t border-line bg-char">
      <div className="mx-auto max-w-6xl px-5 lg:px-8 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="text-[0.6rem] tracking-[0.3em] uppercase text-ember/80">Pizza</p>
            <p className="display text-3xl text-cream mt-0.5">BASILICO</p>
            <p className="text-sm text-cream-dim mt-3 max-w-xs leading-relaxed">
              Pizzas artisanales cuites au feu de bois. Pâte maison, produits frais, cuisson à la commande.
            </p>
            <div className="flex gap-2 mt-5">
              <span className="chip chip-basil">Feu de bois</span>
              <span className="chip">Food truck itinérant</span>
            </div>
          </div>

          <nav className="flex flex-col gap-2.5 text-sm">
            <p className="eyebrow mb-1.5">Navigation</p>
            <Link href="/carte" className="text-cream-dim hover:text-cream transition-colors">La carte</Link>
            <Link href="/notre-histoire" className="text-cream-dim hover:text-cream transition-colors">Notre histoire</Link>
            <Link href="/#nous-trouver" className="text-cream-dim hover:text-cream transition-colors">Nous trouver</Link>
            <Link href="/suivi" className="text-cream-dim hover:text-cream transition-colors">Suivre ma commande</Link>
            <Link href="/compte/connexion" className="text-cream-dim hover:text-cream transition-colors">Mon compte</Link>
          </nav>

          <div className="flex flex-col gap-2.5 text-sm">
            <p className="eyebrow mb-1.5">Contact</p>
            <a href="tel:+33645230656" className="text-cream-dim hover:text-cream transition-colors tnum">
              06 45 23 06 56
            </a>
            <a
              href="https://instagram.com/pizzabasilico2020"
              target="_blank"
              rel="noreferrer"
              className="text-cream-dim hover:text-cream transition-colors"
            >
              Instagram
            </a>
            <a
              href="https://facebook.com/PizzaBasilico"
              target="_blank"
              rel="noreferrer"
              className="text-cream-dim hover:text-cream transition-colors"
            >
              Facebook
            </a>
            <Link href="/traiteur" className="text-cream-dim hover:text-cream transition-colors">
              Traiteur & événements
            </Link>
          </div>
        </div>

        <div className="hairline my-10" />

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-cream-faint">
          <p>© {new Date().getFullYear()} Pizza Basilico</p>
          <div className="flex gap-5">
            <Link href="/mentions-legales" className="hover:text-cream-dim transition-colors">Mentions légales</Link>
            <Link href="/cgv" className="hover:text-cream-dim transition-colors">CGV</Link>
            <Link href="/confidentialite" className="hover:text-cream-dim transition-colors">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
