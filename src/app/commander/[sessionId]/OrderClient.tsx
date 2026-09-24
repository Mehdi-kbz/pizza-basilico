"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { PizzaPhoto } from "@/components/PizzaPhoto";
import { CustomizeSheet } from "@/components/CustomizeSheet";
import { useCart } from "@/lib/cart-store";

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
  ingredients: { id: string; name: string }[];
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
interface Loyalty {
  stampCount: number;
  eligibleForFreeItem: boolean;
  stampsUntilFree: number;
}

const eur = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function tags(item: MenuItem) {
  const out: { label: string; cls: string }[] = [];
  if (item.isSpecialty) out.push({ label: "Spécialité", cls: "chip-brass" });
  if (item.isNew) out.push({ label: "Nouveau", cls: "chip-flame" });
  if (item.isVegetarian) out.push({ label: "Végétarien", cls: "chip-basil" });
  if (item.isSpicy) out.push({ label: "Épicé", cls: "chip-flame" });
  return out;
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
  const { lines: cart, changeQty, add: addLine, clear: clearCart } = useCart();
  const [customizing, setCustomizing] = useState<{ item: MenuItem; category: string } | null>(null);
  const [pickupName, setPickupName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [tip, setTip] = useState(0);
  const [step, setStep] = useState<"menu" | "payment">("menu");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loyalty, setLoyalty] = useState<Loyalty | null>(null);
  const [redeemLoyalty, setRedeemLoyalty] = useState(false);

  const subtotal = useMemo(() => cart.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0), [cart]);

  // Estimation d'affichage : le montant exact est recalculé côté serveur.
  const freeItemEstimate =
    redeemLoyalty && loyalty?.eligibleForFreeItem && cart.length > 0
      ? Math.max(...cart.map((l) => l.unitPriceCents))
      : 0;
  const total = Math.max(0, subtotal - freeItemEstimate) + tip;
  const itemCount = cart.reduce((n, l) => n + l.quantity, 0);

  useEffect(() => {
    if (!email.includes("@")) {
      setLoyalty(null);
      return;
    }
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/loyalty?email=${encodeURIComponent(email)}`);
      if (res.ok) setLoyalty(await res.json());
    }, 500);
    return () => clearTimeout(handle);
  }, [email]);

  async function startCheckout() {
    setError(null);
    if (cart.length === 0) return setError("Votre panier est vide.");
    if (!pickupName.trim()) return setError("Indiquez un nom pour le retrait.");
    if (!email.trim()) return setError("Indiquez une adresse e-mail.");

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
          promoCode: promoCode || undefined,
          redeemLoyalty: redeemLoyalty && loyalty?.eligibleForFreeItem,
          items: cart.map((l) => ({
            menuItemId: l.menuItemId,
            sizeId: l.sizeId,
            quantity: l.quantity,
            addedIngredientIds: l.addedIngredientIds,
            removedIngredientIds: l.removedIngredientIds,
            note: l.note || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      clearCart();
      setClientSecret(data.clientSecret);
      setTrackingUrl(data.trackingUrl);
      setStep("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  }

  /* ------------------------------- États bloqués ------------------------------ */

  if (!isOrderingOpen) {
    return (
      <div className="mx-auto max-w-6xl px-5 lg:px-8 pb-20">
        <div className="card p-8 max-w-xl">
          <p className="display text-2xl">Les commandes sont fermées.</p>
          <p className="text-fg-dim mt-3 leading-relaxed">
            Le service en cours n&rsquo;accepte plus de nouvelles commandes. Passez directement au
            camion ou consultez les prochains emplacements.
          </p>
        </div>
      </div>
    );
  }

  if (step === "payment" && clientSecret && trackingUrl && stripePromise) {
    return (
      <div className="mx-auto max-w-xl px-5 lg:px-8 pb-24">
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
              variables: {
                colorPrimary: "#d9441a",
                colorBackground: "#ffffff",
                colorText: "#2b1710",
                colorDanger: "#c53a2c",
                borderRadius: "10px",
                fontSizeBase: "15px",
              },
            },
          }}
        >
          <PaymentStep totalCents={total} trackingUrl={trackingUrl} />
        </Elements>
      </div>
    );
  }

  if (step === "payment" && !stripePromise) {
    return (
      <div className="mx-auto max-w-xl px-5 lg:px-8 pb-24">
        <div className="card p-8 border-l-2 border-l-tomato">
          <p className="display text-xl">Paiement indisponible</p>
          <p className="text-fg-dim mt-3 text-sm leading-relaxed">
            Le module de paiement n&rsquo;est pas encore configuré sur ce site. Votre commande
            n&rsquo;a pas été enregistrée.
          </p>
        </div>
      </div>
    );
  }

  /* --------------------------------- Menu + panier -------------------------------- */

  return (
    <div className="mx-auto max-w-6xl px-5 lg:px-8 pb-32 lg:pb-20">
      <div className="grid lg:grid-cols-[1fr_380px] gap-10 items-start">
        {/* -------- Carte -------- */}
        <div className="flex flex-col gap-12 min-w-0">
          {categories.map((cat) => (
            <section key={cat.id}>
              <div className="flex items-center gap-4 mb-5">
                <h2 className="display text-[clamp(1.35rem,3.2vw,1.8rem)] whitespace-nowrap">{cat.name}</h2>
                <span className="hairline flex-1" />
              </div>

              <ul className="flex flex-col gap-2.5">
                {cat.items.map((item) => (
                  <li key={item.id} className="card p-4 sm:p-5">
                    <div className="flex items-start gap-4">
                      <PizzaPhoto
                        name={item.name}
                        fallback={cat.name === "Boissons" ? "🥤" : cat.name === "Desserts" ? "🍰" : "🍕"}
                        className="h-16 w-16 shrink-0 rounded-full !object-contain bg-surface-2 text-2xl"
                      />
                      <div className="min-w-0">
                        <h3 className="display text-[1.2rem] text-fg leading-snug">{item.name}</h3>
                        {item.ingredients.length > 0 && (
                          <p className="text-[0.82rem] text-fg-dim mt-1.5 leading-relaxed">
                            {item.ingredients.map((i) => i.name).join(" · ")}
                          </p>
                        )}
                        {item.description && (
                          <p className="text-[0.78rem] text-fg-faint italic mt-1">{item.description}</p>
                        )}
                        {tags(item).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {tags(item).map((t) => (
                              <span key={t.label} className={`chip ${t.cls}`}>
                                {t.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                      <p className="tnum text-ember font-bold">
                        {item.sizes.length > 1 ? "dès " : ""}
                        {eur(Math.min(...item.sizes.map((z) => z.priceCents)))}
                      </p>
                      <button
                        onClick={() => setCustomizing({ item, category: cat.name })}
                        className="btn btn-primary !py-2.5 !px-5 !text-[0.82rem]"
                      >
                        Ajouter au panier
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* -------- Panier -------- */}
        <aside className="lg:sticky lg:top-[88px]">
          <div className="card p-5 md:p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="display text-xl">Votre commande</h2>
              {itemCount > 0 && <span className="chip chip-flame tnum">{itemCount} article(s)</span>}
            </div>

            {cart.length === 0 ? (
              <p className="text-sm text-fg-faint mt-4">
                Votre panier est vide. Choisissez une pizza pour commencer.
              </p>
            ) : (
              <ul className="flex flex-col gap-3 mt-5">
                {cart.map((l) => (
                  <li key={l.key} className="flex items-start gap-3 text-sm">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => changeQty(l.key, -1)}
                        className="w-6 h-6 rounded-md border border-line text-fg-dim hover:border-ember hover:text-ember transition-colors leading-none"
                        aria-label={`Retirer un ${l.menuItemName}`}
                      >
                        −
                      </button>
                      <span className="tnum w-4 text-center text-fg">{l.quantity}</span>
                      <button
                        onClick={() => changeQty(l.key, 1)}
                        className="w-6 h-6 rounded-md border border-line text-fg-dim hover:border-ember hover:text-ember transition-colors leading-none"
                        aria-label={`Ajouter un ${l.menuItemName}`}
                      >
                        +
                      </button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-fg leading-snug">
                        {l.menuItemName}
                        <span className="text-fg-faint"> · {l.sizeLabel}</span>
                      </p>
                      {l.addedIngredientNames.length > 0 && (
                        <p className="text-[0.75rem] text-ember">+ {l.addedIngredientNames.join(", ")}</p>
                      )}
                      {l.removedIngredientNames.length > 0 && (
                        <p className="text-[0.75rem] text-fg-faint">
                          Sans {l.removedIngredientNames.map((n) => n.toLowerCase()).join(", ")}
                        </p>
                      )}
                      {l.note && <p className="text-[0.75rem] italic text-fg-faint">« {l.note} »</p>}
                    </div>
                    <span className="tnum text-fg shrink-0">{eur(l.unitPriceCents * l.quantity)}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="hairline my-5" />

            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor="pickup-name" className="block text-xs text-fg-dim mb-1.5">
                  Nom pour le retrait
                </label>
                <input
                  id="pickup-name"
                  className="field"
                  value={pickupName}
                  onChange={(e) => setPickupName(e.target.value)}
                  placeholder="Ex. Mehdi"
                />
              </div>

              <div>
                <label htmlFor="order-email" className="block text-xs text-fg-dim mb-1.5">
                  E-mail
                </label>
                <input
                  id="order-email"
                  type="email"
                  className="field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.fr"
                />
              </div>

              {loyalty && (
                <div className="rounded-lg border border-line-strong/70 bg-flame/5 px-3.5 py-3">
                  {loyalty.eligibleForFreeItem ? (
                    <label className="flex items-start gap-2.5 text-[0.82rem] text-fg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={redeemLoyalty}
                        onChange={(e) => setRedeemLoyalty(e.target.checked)}
                        className="mt-0.5 accent-[#d9441a]"
                      />
                      <span>
                        <strong className="text-ember">Une pizza offerte vous attend.</strong> L&rsquo;utiliser
                        sur cette commande (la plus chère du panier).
                      </span>
                    </label>
                  ) : (
                    <p className="text-[0.8rem] text-fg-dim tnum">
                      {loyalty.stampCount} tampon{loyalty.stampCount > 1 ? "s" : ""} — encore{" "}
                      {loyalty.stampsUntilFree} pour une pizza offerte.
                    </p>
                  )}
                </div>
              )}

              <details className="text-sm">
                <summary className="cursor-pointer text-fg-faint hover:text-fg-dim transition-colors text-[0.82rem]">
                  Note, code promo, pourboire
                </summary>
                <div className="flex flex-col gap-3 mt-3">
                  <textarea
                    className="field resize-y"
                    rows={2}
                    placeholder="Note (ex. bien cuite)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <input
                    className="field uppercase"
                    placeholder="Code promo"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <div>
                    <p className="text-xs text-fg-dim mb-2">Pourboire pour l&rsquo;équipe</p>
                    <div className="flex gap-2">
                      {[0, 100, 200, 300].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setTip(c)}
                          aria-pressed={tip === c}
                          className={`chip !text-[0.72rem] transition-colors ${
                            tip === c ? "!border-ember !text-ember !bg-flame/10" : ""
                          }`}
                        >
                          {c === 0 ? "Aucun" : eur(c)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </details>
            </div>

            <div className="hairline my-5" />

            <dl className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between text-fg-dim">
                <dt>Sous-total</dt>
                <dd className="tnum">{eur(subtotal)}</dd>
              </div>
              {freeItemEstimate > 0 && (
                <div className="flex justify-between text-basil">
                  <dt>Pizza offerte (fidélité)</dt>
                  <dd className="tnum">−{eur(freeItemEstimate)}</dd>
                </div>
              )}
              {tip > 0 && (
                <div className="flex justify-between text-fg-dim">
                  <dt>Pourboire</dt>
                  <dd className="tnum">{eur(tip)}</dd>
                </div>
              )}
              <div className="flex justify-between items-baseline mt-1.5">
                <dt className="display text-lg text-fg">Total</dt>
                <dd className="display text-2xl text-ember tnum">{eur(total)}</dd>
              </div>
            </dl>

            {error && (
              <p className="text-tomato text-sm mt-4 border-l-2 border-tomato pl-3 leading-relaxed">{error}</p>
            )}

            <button
              onClick={startCheckout}
              disabled={submitting || cart.length === 0}
              className="btn btn-primary w-full mt-5"
            >
              {submitting ? "…" : "Passer au paiement"}
            </button>

            <p className="text-[0.7rem] text-fg-faint mt-3 leading-relaxed">
              Le créneau de retrait vous est confirmé juste après le paiement. Vente à emporter
              uniquement, retrait au camion.
            </p>
          </div>
        </aside>
      </div>

      {customizing && (
        <CustomizeSheet
          item={customizing.item}
          supplements={supplements}
          fallback={customizing.category === "Boissons" ? "🥤" : customizing.category === "Desserts" ? "🍰" : "🍕"}
          onClose={() => setCustomizing(null)}
          onAdd={addLine}
        />
      )}

      {/* Barre de résumé mobile */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-line bg-bg/95 backdrop-blur-md px-5 py-3.5">
          <div className="flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-[0.7rem] text-fg-faint tnum">{itemCount} article(s)</p>
              <p className="display text-xl text-ember tnum leading-none">{eur(total)}</p>
            </div>
            <button
              onClick={() => document.getElementById("pickup-name")?.scrollIntoView({ behavior: "smooth", block: "center" })}
              className="btn btn-primary flex-1 !py-3"
            >
              Finaliser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ Sous-composants ----------------------------- */

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
    <form onSubmit={handlePay} className="card p-6 md:p-8">
      <p className="eyebrow">Dernière étape</p>
      <h2 className="display text-[clamp(1.6rem,4vw,2.2rem)] mt-3">
        Paiement · <span className="text-ember tnum">{eur(totalCents)}</span>
      </h2>
      <p className="text-sm text-fg-dim mt-2 leading-relaxed">
        Votre créneau est réservé le temps du paiement. Les données de carte ne passent jamais par
        nos serveurs.
      </p>

      <div className="mt-7">
        <PaymentElement />
      </div>

      {error && <p className="text-tomato text-sm mt-4 border-l-2 border-tomato pl-3">{error}</p>}

      <button disabled={!stripe || loading} className="btn btn-primary w-full mt-6">
        {loading ? "Paiement en cours…" : `Payer ${eur(totalCents)}`}
      </button>
    </form>
  );
}
