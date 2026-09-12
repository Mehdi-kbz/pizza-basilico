"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

interface MenuItemSize {
  id: string;
  label: string;
  priceCents: number;
}
interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  isVegetarian: boolean;
  isSpicy: boolean;
  isNew: boolean;
  isSpecialty: boolean;
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
  quantity: number;
  addedIngredientIds: string[];
  addedIngredientNames: string[];
  unitPriceCents: number;
}

const eur = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function TAG_LABELS({ isVegetarian, isSpicy, isNew, isSpecialty }: MenuItem) {
  const tags: string[] = [];
  if (isSpecialty) tags.push("⭐ Spécialité");
  if (isNew) tags.push("Nouveau");
  if (isVegetarian) tags.push("Végétarien");
  if (isSpicy) tags.push("Épicé");
  return tags;
}

export function OrderClient({
  sessionId,
  isOrderingOpen,
  categories,
  supplements,
}: {
  sessionId: string;
  isOrderingOpen: boolean;
  categories: Category[];
  supplements: Supplement[];
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pickupName, setPickupName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [tip, setTip] = useState(0);
  const [step, setStep] = useState<"menu" | "payment">("menu");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const subtotal = useMemo(
    () => cart.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0),
    [cart]
  );
  const total = subtotal + tip;

  function addToCart(item: MenuItem, size: MenuItemSize, extras: Supplement[]) {
    const unitPriceCents = size.priceCents + extras.reduce((s, e) => s + e.priceCents, 0);
    setCart((prev) => [
      ...prev,
      {
        key: `${item.id}-${size.id}-${extras.map((e) => e.id).join(",")}-${Date.now()}`,
        menuItemId: item.id,
        menuItemName: item.name,
        sizeId: size.id,
        sizeLabel: size.label,
        quantity: 1,
        addedIngredientIds: extras.map((e) => e.id),
        addedIngredientNames: extras.map((e) => e.name),
        unitPriceCents,
      },
    ]);
  }

  function removeLine(key: string) {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }

  async function startCheckout() {
    setError(null);
    if (cart.length === 0) return setError("Votre panier est vide.");
    if (!pickupName.trim()) return setError("Merci d'indiquer un nom pour le retrait.");
    if (!email.trim()) return setError("Merci d'indiquer une adresse e-mail.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          email,
          pickupName,
          note: note || undefined,
          tipCents: tip,
          items: cart.map((l) => ({
            menuItemId: l.menuItemId,
            sizeId: l.sizeId,
            quantity: l.quantity,
            addedIngredientIds: l.addedIngredientIds,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      setClientSecret(data.clientSecret);
      setTrackingUrl(data.trackingUrl);
      setStep("payment");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOrderingOpen) {
    return (
      <p className="rounded-lg border border-[#d9d6c6] bg-white/60 p-5">
        Les commandes sont actuellement fermées pour cette session.
      </p>
    );
  }

  if (step === "payment" && clientSecret && trackingUrl && stripePromise) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentStep totalCents={total} trackingUrl={trackingUrl} />
      </Elements>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        {categories.map((cat) => (
          <section key={cat.id}>
            <h2 className="text-lg font-semibold mb-2">{cat.name}</h2>
            <ul className="flex flex-col gap-2">
              {cat.items.map((item) => (
                <MenuItemRow key={item.id} item={item} supplements={supplements} onAdd={addToCart} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="rounded-lg border border-[#d9d6c6] bg-white/70 p-5 sticky bottom-4">
        <h2 className="font-semibold mb-3">Votre commande</h2>
        {cart.length === 0 ? (
          <p className="text-sm text-[#585a4d]">Panier vide.</p>
        ) : (
          <ul className="flex flex-col gap-2 mb-4">
            {cart.map((l) => (
              <li key={l.key} className="flex justify-between text-sm gap-2">
                <span>
                  {l.menuItemName} ({l.sizeLabel})
                  {l.addedIngredientNames.length > 0 && (
                    <span className="text-[#585a4d]"> + {l.addedIngredientNames.join(", ")}</span>
                  )}
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  {eur(l.unitPriceCents)}
                  <button onClick={() => removeLine(l.key)} className="text-[#a5462d] text-xs underline">
                    retirer
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-2 mb-3">
          <input
            className="border border-[#d9d6c6] rounded px-3 py-2 text-sm bg-white"
            placeholder="Nom pour le retrait"
            value={pickupName}
            onChange={(e) => setPickupName(e.target.value)}
          />
          <input
            className="border border-[#d9d6c6] rounded px-3 py-2 text-sm bg-white"
            placeholder="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <textarea
            className="border border-[#d9d6c6] rounded px-3 py-2 text-sm bg-white"
            placeholder="Note (facultatif)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <label className="text-sm flex items-center gap-2">
            Pourboire :
            {[0, 100, 200, 300].map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setTip(c)}
                className={`px-2 py-1 rounded border text-xs ${tip === c ? "bg-[#3b5a34] text-white border-[#3b5a34]" : "border-[#d9d6c6]"}`}
              >
                {c === 0 ? "Aucun" : eur(c)}
              </button>
            ))}
          </label>
        </div>

        <div className="flex justify-between font-medium mb-3">
          <span>Total</span>
          <span>{eur(total)}</span>
        </div>

        {error && <p className="text-[#a5462d] text-sm mb-2">{error}</p>}

        <button
          onClick={startCheckout}
          disabled={submitting}
          className="w-full bg-[#3b5a34] text-white rounded py-2.5 font-medium disabled:opacity-50"
        >
          {submitting ? "…" : "Passer au paiement"}
        </button>
      </section>
    </div>
  );
}

function MenuItemRow({
  item,
  supplements,
  onAdd,
}: {
  item: MenuItem;
  supplements: Supplement[];
  onAdd: (item: MenuItem, size: MenuItemSize, extras: Supplement[]) => void;
}) {
  const [sizeId, setSizeId] = useState(item.sizes[0]?.id);
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const size = item.sizes.find((s) => s.id === sizeId) ?? item.sizes[0];

  return (
    <li className="rounded-lg border border-[#d9d6c6] bg-white/60 p-4">
      <div className="flex justify-between gap-3">
        <div>
          <p className="font-medium">{item.name}</p>
          {item.description && <p className="text-sm text-[#585a4d]">{item.description}</p>}
          {TAG_LABELS(item).length > 0 && (
            <p className="text-xs text-[#3b5a34] mt-1">{TAG_LABELS(item).join(" · ")}</p>
          )}
        </div>
        <p className="font-medium shrink-0">{size && eur(size.priceCents)}</p>
      </div>

      {item.sizes.length > 1 && (
        <div className="flex gap-2 mt-2">
          {item.sizes.map((s) => (
            <button
              key={s.id}
              onClick={() => setSizeId(s.id)}
              className={`text-xs px-2 py-1 rounded border ${s.id === sizeId ? "bg-[#3b5a34] text-white border-[#3b5a34]" : "border-[#d9d6c6]"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {supplements.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-[#585a4d] cursor-pointer">Suppléments</summary>
          <div className="flex flex-wrap gap-2 mt-2">
            {supplements.map((s) => (
              <label key={s.id} className="text-xs flex items-center gap-1 border border-[#d9d6c6] rounded px-2 py-1">
                <input
                  type="checkbox"
                  checked={extraIds.includes(s.id)}
                  onChange={(e) =>
                    setExtraIds((prev) => (e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)))
                  }
                />
                {s.name} (+{eur(s.priceCents)})
              </label>
            ))}
          </div>
        </details>
      )}

      <button
        onClick={() => size && onAdd(item, size, supplements.filter((s) => extraIds.includes(s.id)))}
        className="mt-3 text-sm bg-[#232017] text-white rounded px-3 py-1.5"
      >
        Ajouter
      </button>
    </li>
  );
}

function PaymentStep({ totalCents, trackingUrl }: { totalCents: number; trackingUrl: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    // Pour un moyen de paiement redirigeant le navigateur (ex. certains virements/3DS),
    // Stripe renvoie directement vers la page de suivi réelle de la commande.
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}${trackingUrl}` },
      redirect: "if_required",
    });
    if (confirmError) {
      setError(confirmError.message ?? "Le paiement a échoué.");
      setLoading(false);
    } else {
      router.push(trackingUrl);
    }
  }

  return (
    <form onSubmit={handlePay} className="rounded-lg border border-[#d9d6c6] bg-white/70 p-5 flex flex-col gap-4">
      <p className="font-medium">Paiement — {eur(totalCents)}</p>
      <PaymentElement />
      {error && <p className="text-[#a5462d] text-sm">{error}</p>}
      <button disabled={!stripe || loading} className="bg-[#3b5a34] text-white rounded py-2.5 font-medium disabled:opacity-50">
        {loading ? "…" : "Payer"}
      </button>
    </form>
  );
}
