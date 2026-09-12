"use client";

import { useMemo, useState } from "react";

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

export function CarteClient({
  categories,
  supplements,
}: {
  categories: Category[];
  supplements: { name: string; priceCents: number }[];
}) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(
    () =>
      categories
        .map((c) => ({ ...c, items: c.items.filter((i) => matches(i, filter)) }))
        .filter((c) => c.items.length > 0),
    [categories, filter]
  );

  return (
    <div className="mx-auto max-w-4xl px-5 lg:px-8 pb-8">
      {/* Filtres (les badges de la carte papier deviennent actifs) */}
      <div className="sticky top-[68px] z-30 -mx-5 lg:-mx-8 px-5 lg:px-8 py-4 bg-ink/92 backdrop-blur-md border-b border-line mb-10">
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`chip transition-colors shrink-0 ${
                filter === f.key ? "!border-ember !text-ember !bg-flame/10" : "hover:!text-cream"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-cream-dim py-10 text-center">Aucun article ne correspond à ce filtre pour le moment.</p>
      )}

      <div className="flex flex-col gap-14">
        {filtered.map((cat) => (
          <section key={cat.id}>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="display text-[clamp(1.5rem,3.6vw,2.1rem)] text-cream whitespace-nowrap">{cat.name}</h2>
              <span className="hairline flex-1" />
            </div>

            <ul className="flex flex-col">
              {cat.items.map((item) => (
                <li key={item.id} className="py-4 border-b border-line/70 last:border-0">
                  <div className="flex items-baseline gap-3">
                    <h3 className="display text-[1.22rem] text-cream leading-snug">{item.name}</h3>

                    <span className="flex-1 border-b border-dotted border-line-warm/60 translate-y-[-3px]" aria-hidden="true" />

                    <div className="flex gap-4 shrink-0 tnum text-[0.95rem]">
                      {item.sizes.map((s) => (
                        <span key={s.label} className="text-right">
                          {item.sizes.length > 1 && (
                            <span className="block text-[0.6rem] uppercase tracking-wider text-cream-faint">
                              {s.label}
                            </span>
                          )}
                          <span className="text-ember font-semibold">{eur(s.priceCents)}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {item.composition.length > 0 && (
                    <p className="text-[0.85rem] text-cream-dim mt-1.5 leading-relaxed">
                      {item.composition.join(" · ")}
                    </p>
                  )}
                  {item.description && (
                    <p className="text-[0.8rem] text-cream-faint mt-1 italic">{item.description}</p>
                  )}

                  {(item.isSpecialty || item.isNew || item.isVegetarian || item.isSpicy) && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {item.isSpecialty && <span className="chip chip-brass">Spécialité</span>}
                      {item.isNew && <span className="chip chip-flame">Nouveau</span>}
                      {item.isVegetarian && <span className="chip chip-basil">Végétarien</span>}
                      {item.isSpicy && <span className="chip chip-flame">Épicé</span>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {supplements.length > 0 && (
        <section className="mt-16">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="display text-[clamp(1.5rem,3.6vw,2.1rem)] whitespace-nowrap">Suppléments</h2>
            <span className="hairline flex-1" />
          </div>
          <div className="card p-6">
            <p className="text-sm text-cream-dim mb-5">
              À ajouter sur n&rsquo;importe quelle pizza, panuozzo ou spécialité.
            </p>
            <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {supplements.map((s) => (
                <li key={s.name} className="flex items-baseline gap-3 text-[0.92rem]">
                  <span className="text-cream">{s.name}</span>
                  <span className="flex-1 border-b border-dotted border-line-warm/50 translate-y-[-3px]" aria-hidden="true" />
                  <span className="tnum text-ember font-semibold">+{eur(s.priceCents)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <p className="text-xs text-cream-faint mt-10 leading-relaxed">
        Allergènes : la liste détaillée par recette est en cours de finalisation et sera affichée ici.
        En attendant, demandez-nous au comptoir — on connaît nos pâtes par cœur.
      </p>
    </div>
  );
}
