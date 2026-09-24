"use client";

import { useSyncExternalStore } from "react";

/**
 * Panier client partagé entre la carte et la page de commande, conservé dans le
 * navigateur. Ce n'est qu'une commodité d'affichage : le serveur revalide
 * chaque prix, disponibilité et ingrédient au moment de la commande.
 */

export interface CartLine {
  key: string;
  menuItemId: string;
  menuItemName: string;
  sizeId: string;
  sizeLabel: string;
  quantity: number;
  addedIngredientIds: string[];
  addedIngredientNames: string[];
  removedIngredientIds: string[];
  removedIngredientNames: string[];
  note: string;
  unitPriceCents: number;
}

const STORAGE_KEY = "pb-cart-v1";
const EMPTY: CartLine[] = [];

let cache: CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    cache = EMPTY;
  }
}

function commit(next: CartLine[]) {
  cache = next.length ? next : EMPTY;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // stockage indisponible (navigation privée…) : le panier reste en mémoire pour la page
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    loaded = false;
    load();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  load();
  return cache;
}

export function useCart() {
  const lines = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  return {
    lines,
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    subtotalCents: lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0),
    add(line: Omit<CartLine, "key">) {
      // Deux lignes identiques (même pizza, taille, ingrédients et note) se cumulent.
      const key = [
        line.menuItemId,
        line.sizeId,
        [...line.addedIngredientIds].sort().join(","),
        [...line.removedIngredientIds].sort().join(","),
        line.note.trim().toLowerCase(),
      ].join("|");
      const current = getSnapshot();
      const existing = current.find((l) => l.key === key);
      commit(
        existing
          ? current.map((l) => (l.key === key ? { ...l, quantity: l.quantity + line.quantity } : l))
          : [...current, { ...line, key }]
      );
    },
    changeQty(key: string, delta: number) {
      commit(
        getSnapshot()
          .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
          .filter((l) => l.quantity > 0)
      );
    },
    clear() {
      commit([]);
    },
  };
}
