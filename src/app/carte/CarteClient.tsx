"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PizzaPhoto } from "@/components/PizzaPhoto";
import { CustomizeSheet } from "@/components/CustomizeSheet";
import { useCart } from "@/lib/cart-store";
import { ingredientEmoji } from "@/lib/ingredient-emoji";

interface Item {
  id: string;
  name: string;
  description: string | null;
  isVegetarian: boolean;
  isSpicy: boolean;
  isNew: boolean;
  isSpecialty: boolean;
  ingredients: { id: string; name: string }[];
  sizes: { id: string; label: string; priceCents: number }[];
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
  showExtras = true,
}: {
  categories: Category[];
  supplements: { id: string; name: string; priceCents: number }[];
  orderHref: string;
  showExtras?: boolean;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [cat, setCat] = useState<string>("all");
  const [customizing, setCustomizing] = useState<{ item: Item; category: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const cart = useCart();

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

            {item.ingredients.length > 0 && (
              <p className="text-[0.78rem] text-fg-dim mt-2 leading-relaxed line-clamp-3">
                {item.ingredients.map((i) => `${ingredientEmoji(i.name)} ${i.name}`).join("  ·  ")}
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

            <div className="mt-auto pt-4 w-full flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-0.5 tnum">
                {item.sizes.map((s) => (
                  <span key={s.label} className="text-[0.95rem] leading-tight">
                    <span className="text-ember font-bold">{eur(s.priceCents)}</span>
                    {item.sizes.length > 1 && (
                      <span className="ml-1 text-[0.62rem] uppercase tracking-wider text-fg-faint">{s.label}</span>
                    )}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setCustomizing({ item, category })}
                className="btn btn-primary w-full !py-2.5 !px-3 !text-[0.82rem]"
              >
                Ajouter au panier
              </button>
            </div>
          </article>
        ))}
      </div>

      {customizing && (
        <CustomizeSheet
          item={customizing.item}
          supplements={supplements}
          fallback={CATEGORY_EMOJI[customizing.category] ?? "🍕"}
          onClose={() => setCustomizing(null)}
          onAdd={(line) => {
            cart.add(line);
            setToast(`${line.menuItemName} ajouté au panier`);
            window.setTimeout(() => setToast(null), 2600);
          }}
        />
      )}

      {toast && (
        <p
          role="status"
          className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[65] rounded-full bg-fg text-white text-sm px-5 py-2.5 shadow-lg rise"
        >
          ✓ {toast}
        </p>
      )}

      {cart.itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:px-5 sm:pb-5 pointer-events-none">
          <div className="mx-auto max-w-xl pointer-events-auto flex items-center justify-between gap-3 rounded-full bg-white/90 backdrop-blur-xl border border-white shadow-[0_24px_50px_-20px_rgba(160,72,30,0.6)] pl-6 pr-2 py-2 rise">
            <p className="text-sm">
              <span className="font-bold tnum">{cart.itemCount}</span> article{cart.itemCount > 1 ? "s" : ""} ·{" "}
              <span className="tnum font-bold text-ember">{eur(cart.subtotalCents)}</span>
            </p>
            <Link href={orderHref} className="btn btn-primary !py-2.5 !px-6 !text-[0.85rem]">
              Continuer <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      )}

      {showExtras && supplements.length > 0 && (
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

      {showExtras && (
        <p className="text-xs text-fg-faint mt-10 leading-relaxed">
          Allergènes : liste détaillée bientôt ici. En attendant, demandez-nous au comptoir.
        </p>
      )}
    </div>
  );
}
