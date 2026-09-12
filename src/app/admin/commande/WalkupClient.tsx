"use client";

import { useState } from "react";

interface MenuItemSize {
  id: string;
  label: string;
  priceCents: number;
}
interface MenuItem {
  id: string;
  name: string;
  sizes: MenuItemSize[];
}
interface Category {
  id: string;
  name: string;
  items: MenuItem[];
}
interface Supplement {
  id: string;
  name: string;
  priceCents: number;
}
interface CartLine {
  key: string;
  menuItemId: string;
  menuItemName: string;
  sizeId: string;
  sizeLabel: string;
  addedIngredientIds: string[];
  addedIngredientNames: string[];
  unitPriceCents: number;
}

const eur = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export function WalkupClient({
  sessions,
  categories,
  supplements,
}: {
  sessions: { id: string; label: string }[];
  categories: Category[];
  supplements: Supplement[];
}) {
  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? "");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pickupName, setPickupName] = useState("");
  const [email, setEmail] = useState("");
  const [override, setOverride] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ dailyOrderNumber: number; totalCents: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const total = cart.reduce((sum, l) => sum + l.unitPriceCents, 0);

  function addToCart(item: MenuItem, size: MenuItemSize, extras: Supplement[]) {
    setCart((prev) => [
      ...prev,
      {
        key: `${item.id}-${size.id}-${Date.now()}`,
        menuItemId: item.id,
        menuItemName: item.name,
        sizeId: size.id,
        sizeLabel: size.label,
        addedIngredientIds: extras.map((e) => e.id),
        addedIngredientNames: extras.map((e) => e.name),
        unitPriceCents: size.priceCents + extras.reduce((s, e) => s + e.priceCents, 0),
      },
    ]);
  }

  async function handleSubmit() {
    setError(null);
    if (!sessionId) return setError("Aucune session sélectionnée.");
    if (cart.length === 0) return setError("Panier vide.");
    if (!pickupName.trim()) return setError("Nom pour le retrait requis.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/walkup-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          pickupName,
          email: email || undefined,
          override,
          items: cart.map((l) => ({ menuItemId: l.menuItemId, sizeId: l.sizeId, quantity: 1, addedIngredientIds: l.addedIngredientIds })),
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "Erreur.");
      setSuccess({ dailyOrderNumber: data.order.dailyOrderNumber, totalCents: data.order.totalCents });
      setCart([]);
      setPickupName("");
      setEmail("");
      setOverride(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-basil bg-basil/10 p-6 text-center">
        <p className="text-2xl font-semibold text-basil">Commande #{success.dailyOrderNumber} enregistrée</p>
        <p className="text-cream-dim mt-1">{eur(success.totalCents)} — encaisser via le terminal/espèces</p>
        <button onClick={() => setSuccess(null)} className="btn btn-ghost mt-4">
          Nouvelle commande
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <select
        value={sessionId}
        onChange={(e) => setSessionId(e.target.value)}
        className="field"
      >
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>

      {categories.map((cat) => (
        <section key={cat.id}>
          <h2 className="text-sm font-medium text-cream-dim mb-2">{cat.name}</h2>
          <div className="flex flex-wrap gap-2">
            {cat.items.map((item) =>
              item.sizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => addToCart(item, size, [])}
                  className="text-sm border border-line rounded px-3 py-1.5 bg-char hover:border-basil"
                >
                  {item.name} {item.sizes.length > 1 ? `(${size.label})` : ""} — {eur(size.priceCents)}
                </button>
              ))
            )}
          </div>
        </section>
      ))}

      <section className="rounded-lg border border-line bg-char p-5">
        <h2 className="font-semibold mb-3">Panier</h2>
        {cart.length === 0 ? (
          <p className="text-sm text-cream-dim">Vide.</p>
        ) : (
          <ul className="flex flex-col gap-1 mb-3 text-sm">
            {cart.map((l) => (
              <li key={l.key} className="flex justify-between">
                <span>{l.menuItemName} ({l.sizeLabel})</span>
                <span className="flex gap-2">
                  {eur(l.unitPriceCents)}
                  <button onClick={() => setCart((prev) => prev.filter((x) => x.key !== l.key))} className="text-tomato underline text-xs">
                    retirer
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-2 mb-3">
          <input
            className="field"
            placeholder="Nom pour le retrait"
            value={pickupName}
            onChange={(e) => setPickupName(e.target.value)}
          />
          <input
            className="field"
            placeholder="E-mail (facultatif — pour la fidélité)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="text-xs flex items-center gap-2 text-cream-dim">
            <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} />
            Forcer même si le créneau affiche complet (je sais qu&rsquo;il y a de la marge)
          </label>
        </div>

        <div className="flex justify-between font-medium mb-3">
          <span>Total</span>
          <span>{eur(total)}</span>
        </div>
        {error && <p className="text-tomato text-sm mb-2">{error}</p>}
        <button disabled={submitting} onClick={handleSubmit} className="btn btn-primary w-full">
          {submitting ? "…" : "Valider (payé en personne)"}
        </button>
      </section>
    </div>
  );
}
