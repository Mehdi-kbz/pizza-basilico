"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PizzaPhoto } from "@/components/PizzaPhoto";
import { ingredientEmoji } from "@/lib/ingredient-emoji";
import type { CartLine } from "@/lib/cart-store";

export interface SheetItem {
  id: string;
  name: string;
  description: string | null;
  ingredients: { id: string; name: string }[];
  sizes: { id: string; label: string; priceCents: number }[];
}
export interface SheetSupplement {
  id: string;
  name: string;
  priceCents: number;
}

const eur = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

/**
 * Carte de personnalisation d'un article : retirer des ingrédients, ajouter des
 * suppléments, laisser une note, choisir la taille et la quantité.
 */
export function CustomizeSheet({
  item,
  supplements,
  fallback = "🍕",
  onClose,
  onAdd,
}: {
  item: SheetItem;
  supplements: SheetSupplement[];
  fallback?: string;
  onClose: () => void;
  onAdd: (line: Omit<CartLine, "key">) => void;
}) {
  const [sizeId, setSizeId] = useState(item.sizes[0]?.id ?? "");
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);
  const dialogRef = useRef<HTMLDivElement>(null);

  const size = item.sizes.find((s) => s.id === sizeId) ?? item.sizes[0];
  const canCustomize = item.ingredients.length > 0;
  const chosenSupplements = supplements.filter((s) => added.has(s.id));
  const unitPrice = (size?.priceCents ?? 0) + chosenSupplements.reduce((n, s) => n + s.priceCents, 0);

  const description = useMemo(
    () => item.ingredients.map((i) => `${ingredientEmoji(i.name)} ${i.name}`).join("  ·  "),
    [item.ingredients]
  );

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  function toggle(set: Set<string>, id: string, apply: (s: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    apply(next);
  }

  function submit() {
    if (!size) return;
    onAdd({
      menuItemId: item.id,
      menuItemName: item.name,
      sizeId: size.id,
      sizeLabel: size.label,
      quantity,
      addedIngredientIds: chosenSupplements.map((s) => s.id),
      addedIngredientNames: chosenSupplements.map((s) => s.name),
      removedIngredientIds: item.ingredients.filter((i) => removed.has(i.id)).map((i) => i.id),
      removedIngredientNames: item.ingredients.filter((i) => removed.has(i.id)).map((i) => i.name),
      note: note.trim(),
      unitPriceCents: unitPrice,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <button
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-[#2b1710]/45 backdrop-blur-sm cursor-default"
        tabIndex={-1}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Personnaliser ${item.name}`}
        tabIndex={-1}
        className="relative w-full sm:max-w-md max-h-[92dvh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px] bg-white shadow-[0_40px_80px_-30px_rgba(120,50,20,0.6)] outline-none rise"
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-fg hover:bg-surface-3 transition-colors"
        >
          ✕
        </button>

        <div className="bg-gradient-to-b from-surface-2 to-white px-6 pt-8 pb-2 flex flex-col items-center text-center">
          <PizzaPhoto name={item.name} fallback={fallback} className="pizza-ring h-36 w-36" />
          <h2 className="display text-2xl mt-6">{item.name}</h2>
          {description && <p className="text-[0.85rem] text-fg-dim mt-2 leading-relaxed max-w-[34ch]">{description}</p>}
          {item.description && <p className="text-[0.78rem] text-fg-faint italic mt-1">{item.description}</p>}
        </div>

        <div className="px-6 pb-6 flex flex-col gap-6">
          {item.sizes.length > 1 && (
            <fieldset>
              <legend className="eyebrow mb-2.5">Taille</legend>
              <div className="grid grid-cols-2 gap-2">
                {item.sizes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSizeId(s.id)}
                    aria-pressed={sizeId === s.id}
                    className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                      sizeId === s.id
                        ? "border-flame bg-flame/10 shadow-[0_0_0_3px_rgba(242,106,61,0.15)]"
                        : "border-line-strong hover:border-flame"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-fg">{s.label}</span>
                    <span className="block tnum text-ember font-bold">{eur(s.priceCents)}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {canCustomize && (
            <fieldset>
              <legend className="eyebrow mb-1">Ingrédients</legend>
              <p className="text-xs text-fg-faint mb-2.5">Décochez ce que vous ne voulez pas.</p>
              <ul className="flex flex-wrap gap-2">
                {item.ingredients.map((ing) => {
                  const on = !removed.has(ing.id);
                  return (
                    <li key={ing.id}>
                      <button
                        type="button"
                        onClick={() => toggle(removed, ing.id, setRemoved)}
                        aria-pressed={on}
                        className={`rounded-full border px-3.5 py-2 text-[0.82rem] font-medium transition-all ${
                          on
                            ? "border-basil/40 bg-basil/10 text-basil"
                            : "border-line-strong bg-white text-fg-faint line-through"
                        }`}
                      >
                        <span aria-hidden="true">{ingredientEmoji(ing.name)} </span>
                        {ing.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          )}

          {canCustomize && supplements.length > 0 && (
            <fieldset>
              <legend className="eyebrow mb-2.5">Suppléments</legend>
              <ul className="flex flex-wrap gap-2">
                {supplements.map((sup) => {
                  const on = added.has(sup.id);
                  return (
                    <li key={sup.id}>
                      <button
                        type="button"
                        onClick={() => toggle(added, sup.id, setAdded)}
                        aria-pressed={on}
                        className={`rounded-full border px-3.5 py-2 text-[0.82rem] font-medium transition-all ${
                          on
                            ? "border-flame bg-flame/10 text-ember"
                            : "border-line-strong bg-white text-fg-dim hover:border-flame"
                        }`}
                      >
                        <span aria-hidden="true">{on ? "✓" : ingredientEmoji(sup.name)} </span>
                        {sup.name} <span className="tnum opacity-80">+{eur(sup.priceCents)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          )}

          <div>
            <label htmlFor="line-note" className="eyebrow block mb-2.5">
              Une précision ?
            </label>
            <textarea
              id="line-note"
              className="field resize-none"
              rows={2}
              maxLength={140}
              placeholder="Ex. bien cuite, coupée en 8…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="text-[0.7rem] text-fg-faint text-right mt-1 tnum">{note.length}/140</p>
          </div>

          <div className="flex items-center gap-3 sticky bottom-0 -mx-6 px-6 pt-3 pb-1 bg-gradient-to-t from-white via-white to-white/0">
            <div className="flex items-center gap-1 rounded-full bg-surface-2 p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Une de moins"
                className="h-9 w-9 rounded-full bg-white text-lg leading-none shadow-sm hover:text-ember transition-colors"
              >
                −
              </button>
              <span className="tnum w-7 text-center font-semibold" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                aria-label="Une de plus"
                className="h-9 w-9 rounded-full bg-white text-lg leading-none shadow-sm hover:text-ember transition-colors"
              >
                +
              </button>
            </div>
            <button type="button" onClick={submit} className="btn btn-primary flex-1 !px-4">
              Ajouter · <span className="tnum">{eur(unitPrice * quantity)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
