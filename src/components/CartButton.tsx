"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";

/** Icône panier de l'en-tête, avec pastille rouge du nombre d'articles. */
export function CartButton() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/panier"
      aria-label={itemCount > 0 ? `Panier, ${itemCount} article${itemCount > 1 ? "s" : ""}` : "Panier vide"}
      className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/70 text-fg hover:text-ember hover:bg-white transition-colors"
    >
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 4h2.2l2.1 10.2a1.6 1.6 0 0 0 1.6 1.3h8.2a1.6 1.6 0 0 0 1.6-1.2L20.4 8H6.1" />
        <circle cx="9.5" cy="19.5" r="1.4" />
        <circle cx="17" cy="19.5" r="1.4" />
      </svg>
      {itemCount > 0 && (
        <span
          key={itemCount}
          className="pop-in absolute -right-0.5 -top-0.5 grid min-w-[20px] h-5 place-items-center rounded-full bg-tomato px-1 text-[0.68rem] font-bold leading-none text-white tnum ring-2 ring-white"
        >
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
