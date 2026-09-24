"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PizzaPhoto } from "@/components/PizzaPhoto";

interface Item {
  id: string;
  name: string;
  description: string | null;
  isVegetarian: boolean;
  isSpicy: boolean;
  isNew: boolean;
  isSpecialty: boolean;
  composition: string[];
  sizes: { label: string; priceCents: number }[];
}
interface Category {
  id: string;
  name: string;
  items: Item[];
}

const eur = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

const FILTERS = [
  { key: "all", label: "Tout" },
  { key: "veg", label: "Végétarien" },
  { key: "spicy", label: "Épicé" },
  { key: "new", label: "Nouveau" },
  { key: "specialty", label: "Spécialité" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function matches(item: Item, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "veg") return item.isVegetarian;
  if (filter === "spicy") return item.isSpicy;
  if (filter === "new") return item.isNew;
  return item.isSpecialty;
}

const CATEGORY_EMOJI: Record<string, string> = { Boissons: "🥤", Desserts: "🍰", Panuozzo: "🥖" };

export function CarteClient({
  categories,
  supplements,
  orderHref,
}: {
  categories: Category[];
  supplements: { name: string; priceCents: number }[];
  orderHref: string;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [cat, setCat] = useState<string>("all");

  const cards = useMemo(
    () =>
      categories
        .filter((c) => cat === "all" || c.id === cat)
        .flatMap((c) => c.items.map((item) => ({ item, category: c.name })))
        .filter(({ item }) => matches(item, filter)),
    [categories, cat, filter]
  );

  return (
    <div className="mx-auto max-w-6xl px-5 lg:px-8 pb-8">
      {/* Catégories, puis badges de la carte papier (végétarien, épicé…) */}
      <div className="sticky top-[84px] z-30 -mx-5 lg:-mx-8 px-5 lg:px-8 py-4 bg-bg/85 backdrop-blur-md mb-10">
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Catégories">
          {[{ id: "all", name: "Tout" }, ...categories.map((c) => ({ id: c.id, name: c.name }))].map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              aria-pressed={cat === c.id}
              className={`chip !text-[0.75rem] !px-4 !py-2 transition-colors shrink-0 ${
                cat === c.id
                  ? "!bg-gradient-to-b !from-flame !to-flame-deep !border-transparent !text-white shadow-md"
                  : "hover:!text-fg hover:!border-flame"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pt-3" role="group" aria-label="Filtres">
          {FILTERS.filter((f) => f.key !== "all").map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(filter === f.key ? "all" : f.key)}
              aria-pressed={filter === f.key}
              className={`chip transition-colors shrink-0 ${
                filter === f.key ? "!border-ember !text-ember !bg-flame/10" : "hover:!text-fg"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {cards.length === 0 && (
        <p className="text-fg-dim py-10 text-center">Aucun article ne correspond à ce filtre pour le moment.</p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 md:grid-cols-3 gap-x-3 sm:gap-x-5 gap-y-8">
        {cards.map(({ item, category }) => (
          <article
            key={item.id}
            className="card arch !rounded-b-[24px] px-3 sm:px-5 pb-4 sm:pb-5 pt-5 sm:pt-7 flex flex-col items-center text-center transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]"
          >
            <PizzaPhoto
              name={item.name}
              fallback={CATEGORY_EMOJI[category] ?? "🍕"}
              className="pizza-ring w-[78%] aspect-square"
            />

            <h3 className="display text-[1.05rem] sm:text-[1.2rem] text-fg leading-tight mt-6">{item.name}</h3>

            {item.composition.length > 0 && (
              <p className="text-[0.78rem] text-fg-dim mt-2 leading-relaxed line-clamp-3">
                {item.composition.join(" · ")}
              </p>
            )}

            {(item.isSpecialty || item.isNew || item.isVegetarian || item.isSpicy) && (
              <div className="flex flex-wrap justify-center gap-1 mt-2.5">
                {item.isSpecialty && <span className="chip chip-brass">Spécialité</span>}
                {item.isNew && <span className="chip chip-flame">Nouveau</span>}
                {item.isVegetarian && <span className="chip chip-basil">Végé</span>}
                {item.isSpicy && <span className="chip chip-flame">Épicé</span>}
              </div>
            )}

            <div className="mt-auto pt-4 w-full flex items-end justify-between gap-2">
              <div className="flex flex-col gap-0.5 text-left tnum">
                {item.sizes.map((s) => (
                  <span key={s.label} className="text-[0.95rem] leading-tight">
                    <span className="text-ember font-bold">{eur(s.priceCents)}</span>
                    {item.sizes.length > 1 && (
                      <span className="ml-1.5 text-[0.62rem] uppercase tracking-wider text-fg-faint">{s.label}</span>
                    )}
                  </span>
                ))}
              </div>
              <Link
                href={orderHref}
                aria-label={`Commander — ${item.name}`}
                className="grid place-items-center h-10 w-10 shrink-0 rounded-full bg-gradient-to-b from-flame to-flame-deep text-white text-lg shadow-[0_10px_18px_-8px_rgba(217,68,26,0.8)] hover:scale-105 active:scale-95 transition-transform"
              >
                ↗
              </Link>
            </div>
          </article>
        ))}
      </div>

      {supplements.length > 0 && (
        <section className="mt-16">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="display text-[clamp(1.5rem,3.6vw,2.1rem)] whitespace-nowrap">Suppléments</h2>
            <span className="hairline flex-1" />
          </div>
          <div className="card p-6">
            <p className="text-sm text-fg-dim mb-5">
              À ajouter sur n&rsquo;importe quelle pizza, panuozzo ou spécialité.
            </p>
            <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {supplements.map((s) => (
                <li key={s.name} className="flex items-baseline gap-3 text-[0.92rem]">
                  <span className="text-fg">{s.name}</span>
                  <span className="flex-1 border-b border-dotted border-line-strong/50 translate-y-[-3px]" aria-hidden="true" />
                  <span className="tnum text-ember font-semibold">+{eur(s.priceCents)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <p className="text-xs text-fg-faint mt-10 leading-relaxed">
        Allergènes : la liste détaillée par recette est en cours de finalisation et sera affichée ici.
        En attendant, demandez-nous au comptoir — on connaît nos pâtes par cœur.
      </p>
    </div>
  );
}
