"use client";

import { useEffect, useRef, useState } from "react";

export function pizzaSlug(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Les photos vivent dans /public/pizzas/<slug>.webp (slug = nom de l'article sans accents).
// Tant qu'une photo manque, on affiche un visuel de remplacement plutôt qu'une image cassée.
export function PizzaPhoto({
  name,
  src,
  className = "",
  fallback = "🍕",
}: {
  name: string;
  src?: string;
  className?: string;
  fallback?: string;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  const url = src ?? `/pizzas/${pizzaSlug(name)}.webp`;

  // L'erreur peut survenir avant l'hydratation : on revérifie l'état réel de l'image.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return (
      <div
        className={`grid place-items-center bg-gradient-to-br from-surface-3 to-surface-2 text-4xl ${className}`}
        role="img"
        aria-label={name}
      >
        {fallback}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={url} alt={name} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}
