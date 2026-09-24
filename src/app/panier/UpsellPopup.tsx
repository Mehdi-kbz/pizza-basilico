"use client";

import { useEffect } from "react";
import { PizzaPhoto } from "@/components/PizzaPhoto";
import type { CartLine } from "@/lib/cart-store";

export interface UpsellItem {
  id: string;
  name: string;
  kind: "dessert" | "boisson";
  sizeId: string;
  sizeLabel: string;
  priceCents: number;
}

const eur = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

/** Proposition de dessert / boisson : on en choisit un, ou on passe. */
export function UpsellPopup({
  items,
  onPick,
  onSkip,
}: {
  items: UpsellItem[];
  onPick: (line: Omit<CartLine, "key">) => void;
  onSkip: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onSkip();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSkip]);

  const desserts = items.filter((i) => i.kind === "dessert");
  const drinks = items.filter((i) => i.kind === "boisson");

  function pick(item: UpsellItem) {
    onPick({
      menuItemId: item.id,
      menuItemName: item.name,
      sizeId: item.sizeId,
      sizeLabel: item.sizeLabel,
      quantity: 1,
      addedIngredientIds: [],
      addedIngredientNames: [],
      removedIngredientIds: [],
      removedIngredientNames: [],
      note: "",
      unitPriceCents: item.priceCents,
    });
  }

  const row = (item: UpsellItem) => (
    <li key={item.id}>
      <button
        type="button"
        onClick={() => pick(item)}
        className="group flex w-full items-center gap-3 rounded-2xl border border-line-strong bg-white p-2.5 pr-4 text-left transition-all hover:border-flame hover:shadow-[0_10px_24px_-14px_rgba(217,68,26,0.6)] active:scale-[0.99]"
      >
        <PizzaPhoto
          name={item.name}
          fallback={item.kind === "dessert" ? "🍰" : "🥤"}
          className="h-14 w-14 shrink-0 rounded-xl !object-contain bg-surface-2 text-2xl"
        />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold leading-tight">{item.name}</span>
          {item.kind === "dessert" && (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-basil/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-basil">
              🏠 Fait maison
            </span>
          )}
        </span>
        <span className="shrink-0 text-right">
          <span className="block tnum font-bold text-ember">{eur(item.priceCents)}</span>
          <span className="block text-[0.72rem] font-semibold text-flame-deep group-hover:underline">Ajouter +</span>
        </span>
      </button>
    </li>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <button aria-label="Fermer" onClick={onSkip} tabIndex={-1} className="absolute inset-0 cursor-default bg-[#2b1710]/45 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Un petit extra ?"
        className="pop-in relative max-h-[90dvh] w-full overflow-y-auto rounded-t-[32px] bg-white p-6 shadow-[0_40px_80px_-30px_rgba(120,50,20,0.6)] sm:max-w-md sm:rounded-[32px]"
      >
        <div className="text-center">
          <p className="text-4xl" aria-hidden="true">
            😋
          </p>
          <h2 className="display mt-2 text-2xl">Un petit extra ?</h2>
          <p className="mt-1.5 text-sm text-fg-dim">Nos desserts sont faits maison. Une boisson fraîche, peut-être ?</p>
        </div>

        {desserts.length > 0 && (
          <section className="mt-5">
            <h3 className="eyebrow mb-2">Desserts</h3>
            <ul className="flex flex-col gap-2">{desserts.map(row)}</ul>
          </section>
        )}
        {drinks.length > 0 && (
          <section className="mt-5">
            <h3 className="eyebrow mb-2">Boissons</h3>
            <ul className="flex flex-col gap-2">{drinks.map(row)}</ul>
          </section>
        )}

        <button type="button" onClick={onSkip} className="btn btn-ghost mt-6 w-full">
          Non merci
        </button>
      </div>
    </div>
  );
}
