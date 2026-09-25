"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { PizzaPhoto } from "@/components/PizzaPhoto";
import { ConfirmationCard, type ConfirmationItem } from "@/components/ConfirmationCard";
import { useCart, type CartLine } from "@/lib/cart-store";
import { UpsellPopup, type UpsellItem } from "./UpsellPopup";
import { StampsMini } from "@/components/StampsMini";
import { PasswordField } from "@/components/PasswordField";

const eur = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

interface SessionInfo {
  id: string;
  label: string;
  when: string;
}
interface Loyalty {
  stampCount: number;
  stampsRequired: number;
  eligibleForFreeItem: boolean;
  stampsUntilFree: number;
  account: "none" | "guest" | "password";
  verified: boolean;
  loggedIn: boolean;
}
interface Placed {
  clientSecret: string;
  trackingUrl: string;
  orderNumber: number;
  totalCents: number;
  slot: { start: Date; end: Date } | null;
  accountCreated: boolean;
}
interface Done {
  orderNumber: number;
  totalCents: number;
  slot: { start: Date; end: Date } | null;
  trackingUrl: string;
  items: ConfirmationItem[];
  name: string;
  email: string;
  accountPending: boolean;
}

function lineDetails(l: CartLine) {
  const out: string[] = [];
  if (l.addedIngredientNames.length) out.push(`+ ${l.addedIngredientNames.join(", ")}`);
  if (l.removedIngredientNames.length) out.push(`Sans ${l.removedIngredientNames.map((n) => n.toLowerCase()).join(", ")}`);
  if (l.note) out.push(`« ${l.note} »`);
  return out;
}

const UPSELL_DELAY_MS = 10_000;
const UPSELL_SEEN_KEY = "pb-upsell-seen";

export function CheckoutClient({ session, upsell, customerEmail }: { session: SessionInfo | null; upsell: UpsellItem[]; customerEmail: string | null }) {
  const { lines, subtotalCents, itemCount, changeQty, add, clear } = useCart();
  const [showUpsell, setShowUpsell] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState(customerEmail ?? "");
  const [password, setPassword] = useState("");
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [linkState, setLinkState] = useState<"idle" | "sending" | "sent">("idle");
  const [note, setNote] = useState("");
  const [tip, setTip] = useState(0);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; discountCents: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [loyalty, setLoyalty] = useState<Loyalty | null>(null);
  const [redeemLoyalty, setRedeemLoyalty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<Placed | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const paymentRef = useRef<HTMLElement>(null);

  const locked = placed !== null;

  // Après 10 s sur le panier : proposition d'un dessert / d'une boisson, une seule fois par visite.
  const upsellState = useRef({ empty: true, hasDessert: false, hasDrink: false, locked: false });
  useEffect(() => {
    const kinds = new Map(upsell.map((u) => [u.id, u.kind]));
    upsellState.current = {
      empty: lines.length === 0,
      hasDessert: lines.some((l) => kinds.get(l.menuItemId) === "dessert"),
      hasDrink: lines.some((l) => kinds.get(l.menuItemId) === "boisson"),
      locked,
    };
  }, [lines, upsell, locked]);

  useEffect(() => {
    if (upsell.length === 0) return;
    try {
      if (window.sessionStorage.getItem(UPSELL_SEEN_KEY)) return;
    } catch {
      // stockage indisponible : on propose quand même, une fois par affichage de la page
    }
    const timer = window.setTimeout(() => {
      const st = upsellState.current;
      if (st.empty || st.locked || (st.hasDessert && st.hasDrink)) return;
      setShowUpsell(true);
      try {
        window.sessionStorage.setItem(UPSELL_SEEN_KEY, "1");
      } catch {
        // sans conséquence
      }
    }, UPSELL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [upsell]);

  // Ne propose que ce qui manque encore au panier (pas de dessert déjà pris, etc.).
  const upsellItems = upsell.filter((u) => {
    const inCart = lines.some((l) => l.menuItemId === u.id);
    return !inCart;
  });

  // Fidélité : consultée dès qu'un e-mail valide est saisi.
  useEffect(() => {
    const valid = /^\S+@\S+\.\S{2,}$/.test(email.trim());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoyaltyLoading(valid);
    if (!valid) {
      setLoyalty(null);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/loyalty?email=${encodeURIComponent(email.trim())}`);
      if (cancelled) return;
      setLoyalty(res.ok ? await res.json() : null);
      setLoyaltyLoading(false);
      setLinkState("idle");
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [email]);

  // Une pizza offerte s'utilise avec le mot de passe du compte (ou déjà connecté) et un e-mail confirmé.
  const canRedeemNow = !!loyalty?.eligibleForFreeItem && (loyalty.loggedIn || (loyalty.account === "password" && loyalty.verified));
  const redeeming = redeemLoyalty && canRedeemNow;
  const creatingAccount = loyalty?.account === "none" || (loyalty?.account === "password" && !loyalty.verified);

  async function sendActivationLink() {
    setLinkState("sending");
    await fetch("/api/customer/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim() }) });
    setLinkState("sent");
  }

  // Le code promo appliqué est recalculé si le panier change.
  const appliedCode = promo?.code;
  useEffect(() => {
    if (!appliedCode) return;
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: appliedCode, subtotalCents }),
      });
      if (cancelled) return;
      if (res.ok) setPromo({ code: appliedCode, discountCents: (await res.json()).discountCents });
      else setPromo(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [appliedCode, subtotalCents]);

  async function applyPromo() {
    setPromoError(null);
    const code = promoInput.trim();
    if (!code) return;
    const res = await fetch("/api/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, subtotalCents }),
    });
    const data = await res.json();
    if (!res.ok) return setPromoError(data.error ?? "Code invalide.");
    setPromo({ code, discountCents: data.discountCents });
  }

  const loyaltyDiscount =
    redeeming && lines.length > 0
      ? Math.max(...lines.map((l) => l.unitPriceCents))
      : 0;
  const discount = (promo?.discountCents ?? 0) + loyaltyDiscount;
  const total = Math.max(0, subtotalCents - discount) + tip;

  const snapshot = useMemo<ConfirmationItem[]>(
    () =>
      lines.map((l) => ({
        quantity: l.quantity,
        name: l.menuItemName,
        size: l.sizeLabel,
        details: lineDetails(l),
        lineTotalCents: l.unitPriceCents * l.quantity,
      })),
    [lines]
  );

  async function confirmOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!session) return setError("Aucun service n'accepte de commande pour le moment.");
    if (lines.length === 0) return setError("Votre panier est vide.");
    if (!name.trim()) return setError("Indiquez votre prénom : c'est lui que l'on appellera.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Indiquez une adresse e-mail pour recevoir votre reçu.");
    if (redeeming && !loyalty?.loggedIn && !password) return setError("Saisissez le mot de passe de votre compte pour utiliser la pizza offerte.");
    if (!redeeming && creatingAccount && password && password.length < 8) return setError("Mot de passe : 8 caractères minimum (ou laissez le champ vide pour commander sans compte).");

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          email: email.trim(),
          pickupName: name.trim(),
          note: note.trim() || undefined,
          tipCents: tip,
          promoCode: promo?.code,
          redeemLoyalty: redeeming,
          password: password || undefined,
          items: lines.map((l) => ({
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
      if (!res.ok) return setError(data.error ?? "Une erreur est survenue.");

      setPlaced({
        clientSecret: data.clientSecret,
        trackingUrl: data.trackingUrl,
        orderNumber: data.dailyOrderNumber,
        totalCents: data.totalCents,
        slot: data.slotStart ? { start: new Date(data.slotStart), end: new Date(data.slotEnd) } : null,
        accountCreated: !!data.accountCreated,
      });
      window.setTimeout(() => paymentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } finally {
      setSubmitting(false);
    }
  }

  function onPaid() {
    if (!placed) return;
    setDone({
      orderNumber: placed.orderNumber,
      totalCents: placed.totalCents,
      slot: placed.slot,
      trackingUrl: placed.trackingUrl,
      items: snapshot,
      name: name.trim(),
      email: email.trim(),
      accountPending: placed.accountCreated,
    });
    clear();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const upsellPopup = showUpsell && !locked && upsellItems.length > 0 && (
    <UpsellPopup
      items={upsellItems}
      onSkip={() => setShowUpsell(false)}
      onPick={(line) => {
        add(line);
        setShowUpsell(false);
        setToast(`${line.menuItemName} ajouté au panier`);
        window.setTimeout(() => setToast(null), 2600);
      }}
    />
  );
  const toastEl = toast && (
    <p role="status" className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[65] rounded-full bg-fg px-5 py-2.5 text-sm text-white shadow-lg rise">
      ✓ {toast}
    </p>
  );

  /* ------------------------------ Commande payée ------------------------------ */

  if (done) {
    return (
      <div className="px-4 pb-20 pt-10 md:pt-14">
        <ConfirmationCard {...done} />
      </div>
    );
  }

  /* ------------------------------- Panier vide ------------------------------- */

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md px-5 pt-16 pb-24 text-center">
        <p className="text-6xl" aria-hidden="true">
          🛒
        </p>
        <h1 className="display text-3xl mt-5">Votre panier est vide</h1>
        <Link href="/#pizzas" className="btn btn-primary mt-8">
          Choisir mes pizzas
        </Link>
      </div>
    );
  }

  /* ---------------------------------- Panier --------------------------------- */

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-5 pt-8 md:pt-12 pb-24">
      {upsellPopup}
      {toastEl}
      <Link href="/#pizzas" className="text-sm text-fg-faint hover:text-ember transition-colors">
        ← Ajouter d&rsquo;autres articles
      </Link>
      <h1 className="display text-[clamp(2rem,6vw,3rem)] mt-3">Votre panier</h1>
      {session && (
        <p className="text-sm text-fg-dim mt-2">
          📍 {session.label} · <span className="capitalize">{session.when}</span>
        </p>
      )}

      <form onSubmit={confirmOrder} className="mt-7 flex flex-col gap-5">
        {/* Articles */}
        <section className="card p-4 sm:p-6" aria-label="Articles">
          <ul className="flex flex-col divide-y divide-line">
            {lines.map((l) => (
              <li key={l.key} className="flex items-start gap-3 sm:gap-4 py-4 first:pt-0 last:pb-0">
                <PizzaPhoto
                  name={l.menuItemName}
                  fallback="🍽️"
                  className="h-16 w-16 shrink-0 rounded-full !object-contain bg-surface-2 text-2xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">
                    {l.menuItemName} <span className="font-normal text-fg-faint">· {l.sizeLabel}</span>
                  </p>
                  {lineDetails(l).map((d) => (
                    <p key={d} className="text-[0.78rem] text-fg-dim leading-snug mt-0.5">
                      {d}
                    </p>
                  ))}
                  <div className="mt-2.5 flex items-center gap-1 rounded-full bg-surface-2 p-1 w-fit">
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => changeQty(l.key, -1)}
                      aria-label={l.quantity === 1 ? `Retirer ${l.menuItemName}` : `Une ${l.menuItemName} de moins`}
                      className="h-8 w-8 rounded-full bg-white leading-none shadow-sm hover:text-ember disabled:opacity-40 transition-colors"
                    >
                      {l.quantity === 1 ? "🗑" : "−"}
                    </button>
                    <span className="tnum w-6 text-center text-sm font-semibold">{l.quantity}</span>
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => changeQty(l.key, 1)}
                      aria-label={`Une ${l.menuItemName} de plus`}
                      className="h-8 w-8 rounded-full bg-white leading-none shadow-sm hover:text-ember disabled:opacity-40 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="tnum font-semibold shrink-0">{eur(l.unitPriceCents * l.quantity)}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Nom, e-mail, note, code promo */}
        <section className="card p-5 sm:p-6 flex flex-col gap-4" aria-label="Vos informations">
          <div>
            <label htmlFor="pickup-name" className="block text-sm font-semibold mb-1.5">
              Votre prénom <span className="text-ember">*</span>
            </label>
            <input
              id="pickup-name"
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={locked}
              required
              maxLength={80}
              autoComplete="given-name"
              placeholder="On vous appellera par ce nom"
            />
          </div>

          <div>
            <label htmlFor="order-email" className="block text-sm font-semibold mb-1.5">
              E-mail <span className="text-ember">*</span>
            </label>
            <input
              id="order-email"
              type="email"
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={locked}
              required
              autoComplete="email"
              placeholder="Pour recevoir votre reçu"
            />
          </div>

          {(loyaltyLoading || loyalty) && (
            <div className="rounded-2xl bg-flame/[0.08] p-4">
              <StampsMini stamps={loyalty?.stampCount ?? 0} required={loyalty?.stampsRequired ?? 10} loading={loyaltyLoading && !loyalty} />

              {loyalty && (
                <div className="mt-3.5 flex flex-col gap-3 text-sm">
                  {loyalty.loggedIn && <p className="text-[0.78rem] text-basil">✓ Connecté à votre compte</p>}

                  {!loyalty.eligibleForFreeItem && (
                    <p className="text-fg-dim">
                      {loyalty.stampCount === 0 ? "1 tampon par pizza commandée : la 10ᵉ est offerte." : <>Encore <strong className="tnum text-fg">{loyalty.stampsUntilFree}</strong> pizza{loyalty.stampsUntilFree > 1 ? "s" : ""} et la suivante est offerte.</>}
                    </p>
                  )}

                  {loyalty.eligibleForFreeItem && canRedeemNow && (
                    <>
                      <label className="flex cursor-pointer items-start gap-2.5">
                        <input type="checkbox" checked={redeemLoyalty} onChange={(e) => setRedeemLoyalty(e.target.checked)} disabled={locked} className="mt-0.5 accent-[#d9441a]" />
                        <span><strong className="text-ember">🎁 Une pizza offerte vous attend.</strong> L&rsquo;utiliser (la plus chère du panier).</span>
                      </label>
                      {redeemLoyalty && !loyalty.loggedIn && (
                        <div>
                          <label htmlFor="redeem-pass" className="mb-1.5 block text-xs font-semibold">Mot de passe de votre compte</label>
                          <PasswordField id="redeem-pass" value={password} onChange={setPassword} autoComplete="current-password" disabled={locked} />
                          <a href={`/compte/mot-de-passe-oublie?email=${encodeURIComponent(email.trim())}`} className="mt-1.5 inline-block text-xs text-ember underline">Mot de passe oublié ?</a>
                        </div>
                      )}
                    </>
                  )}

                  {loyalty.eligibleForFreeItem && !canRedeemNow && (
                    <div className="rounded-xl bg-white/70 p-3">
                      <p><strong className="text-ember">🎁 Une pizza offerte vous attend !</strong> Pour l&rsquo;utiliser, activez votre compte : on vous envoie un lien pour choisir un mot de passe (30 secondes).</p>
                      {linkState === "sent" ? (
                        <p className="mt-2 text-xs text-basil">✓ Lien envoyé à {email.trim()}. Vous reviendrez directement sur votre panier.</p>
                      ) : (
                        <button type="button" onClick={sendActivationLink} disabled={linkState === "sending"} className="btn btn-primary mt-2.5 !py-2 !px-4 !text-[0.8rem]">
                          {linkState === "sending" ? "Envoi…" : "Recevoir le lien"}
                        </button>
                      )}
                    </div>
                  )}

                  {creatingAccount && !loyalty.eligibleForFreeItem && (
                    <div>
                      <label htmlFor="new-pass" className="mb-1.5 block text-xs font-semibold">
                        {loyalty.account === "none" ? "Créer un mot de passe" : "Choisir un mot de passe"} <span className="font-normal text-fg-faint">(facultatif)</span>
                      </label>
                      <PasswordField id="new-pass" value={password} onChange={setPassword} autoComplete="new-password" placeholder="8 caractères minimum" disabled={locked} />
                      <p className="mt-1.5 text-[0.72rem] leading-snug text-fg-faint">Pour suivre vos commandes et protéger votre carte de fidélité. Sans mot de passe, vous commandez et gagnez vos tampons quand même.</p>
                    </div>
                  )}

                  {loyalty.account === "guest" && !loyalty.eligibleForFreeItem && !loyalty.loggedIn && (
                    <p className="text-[0.72rem] text-fg-faint">Envie de suivre vos commandes ? <a href={`/compte/mot-de-passe-oublie?email=${encodeURIComponent(email.trim())}`} className="text-ember underline">Activer mon compte</a></p>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label htmlFor="order-note" className="block text-sm font-semibold mb-1.5">
              Une note pour la commande
            </label>
            <textarea
              id="order-note"
              className="field resize-none"
              rows={2}
              maxLength={280}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={locked}
              placeholder="Facultatif"
            />
          </div>

          <div>
            <label htmlFor="promo" className="block text-sm font-semibold mb-1.5">
              Code promo
            </label>
            {promo ? (
              <div className="flex items-center justify-between rounded-2xl bg-basil/10 px-4 py-3 text-sm text-basil">
                <span>
                  ✓ <strong className="uppercase">{promo.code}</strong> · −{eur(promo.discountCents)}
                </span>
                {!locked && (
                  <button
                    type="button"
                    onClick={() => {
                      setPromo(null);
                      setPromoInput("");
                    }}
                    className="underline"
                  >
                    Retirer
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  id="promo"
                  className="field uppercase"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applyPromo();
                    }
                  }}
                  disabled={locked}
                  placeholder="Facultatif"
                />
                <button type="button" onClick={applyPromo} disabled={locked || !promoInput.trim()} className="btn btn-ghost !px-5">
                  Appliquer
                </button>
              </div>
            )}
            {promoError && <p className="text-tomato text-sm mt-2">{promoError}</p>}
          </div>

          <div>
            <p className="text-sm font-semibold mb-2">Un petit mot pour l&rsquo;équipe ? 🙌</p>
            <div className="flex flex-wrap gap-2">
              {[0, 100, 200, 300].map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={locked}
                  onClick={() => setTip(c)}
                  aria-pressed={tip === c}
                  className={`chip !text-[0.75rem] !px-4 !py-2 transition-colors ${
                    tip === c ? "!border-ember !text-ember !bg-flame/10" : ""
                  }`}
                >
                  {c === 0 ? "Pas de pourboire" : eur(c)}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Total + confirmation */}
        <section className="card p-5 sm:p-6" aria-label="Total">
          <dl className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-fg-dim">
              <dt>Sous-total · {itemCount} article{itemCount > 1 ? "s" : ""}</dt>
              <dd className="tnum">{eur(subtotalCents)}</dd>
            </div>
            {promo && (
              <div className="flex justify-between text-basil">
                <dt>Code {promo.code.toUpperCase()}</dt>
                <dd className="tnum">−{eur(promo.discountCents)}</dd>
              </div>
            )}
            {loyaltyDiscount > 0 && (
              <div className="flex justify-between text-basil">
                <dt>Pizza offerte</dt>
                <dd className="tnum">−{eur(loyaltyDiscount)}</dd>
              </div>
            )}
            {tip > 0 && (
              <div className="flex justify-between text-fg-dim">
                <dt>Pourboire</dt>
                <dd className="tnum">{eur(tip)}</dd>
              </div>
            )}
            <div className="flex justify-between items-baseline mt-2 pt-3 border-t border-line">
              <dt className="display text-xl">Total</dt>
              <dd className="display text-3xl text-ember tnum">{eur(total)}</dd>
            </div>
          </dl>

          {!session && (
            <p className="mt-4 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-fg-dim">
              Aucun service n&rsquo;accepte de commande pour le moment. Votre panier est conservé.
            </p>
          )}
          {error && <p className="text-tomato text-sm mt-4 border-l-2 border-tomato pl-3 leading-relaxed">{error}</p>}

          {locked ? (
            <button
              type="button"
              onClick={() => setPlaced(null)}
              className="btn btn-ghost w-full mt-5"
            >
              ← Modifier ma commande
            </button>
          ) : (
            <button type="submit" disabled={submitting || !session} className="btn btn-primary w-full mt-5 !py-4 !text-base">
              {submitting ? "Un instant…" : "Confirmer la commande"}
            </button>
          )}
        </section>

        {/* Paiement */}
        {placed && (
          <section ref={paymentRef} className="card p-5 sm:p-6 scroll-mt-24 rise" aria-label="Paiement">
            <p className="eyebrow">Dernière étape</p>
            <h2 className="display text-[clamp(1.5rem,4vw,2rem)] mt-2">
              Paiement · <span className="text-ember tnum">{eur(placed.totalCents)}</span>
            </h2>
            <p className="text-sm text-fg-dim mt-2">🔒 Votre créneau est réservé le temps du paiement.</p>

            {stripePromise ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: placed.clientSecret,
                  locale: "fr",
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: "#d9441a",
                      colorBackground: "#ffffff",
                      colorText: "#2b1710",
                      colorDanger: "#c53a2c",
                      borderRadius: "16px",
                      fontSizeBase: "15px",
                    },
                  },
                }}
              >
                <PaymentStep totalCents={placed.totalCents} trackingUrl={placed.trackingUrl} onPaid={onPaid} />
              </Elements>
            ) : (
              <p className="mt-5 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-fg-dim">
                Le paiement en ligne n&rsquo;est pas encore activé sur ce site. Votre commande n&rsquo;est pas
                confirmée.
              </p>
            )}
          </section>
        )}
      </form>
    </div>
  );
}

function PaymentStep({
  totalCents,
  trackingUrl,
  onPaid,
}: {
  totalCents: number;
  trackingUrl: string;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pay() {
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      // Les moyens de paiement avec redirection reviennent sur la page de suivi, qui affiche la confirmation.
      confirmParams: { return_url: `${window.location.origin}${trackingUrl}&paid=1` },
      redirect: "if_required",
    });
    if (confirmError) {
      setError(confirmError.message ?? "Le paiement a échoué.");
      setLoading(false);
    } else {
      onPaid();
    }
  }

  return (
    <div className="mt-6">
      <PaymentElement options={{ layout: { type: "tabs" } }} />
      {error && <p className="text-tomato text-sm mt-4 border-l-2 border-tomato pl-3">{error}</p>}
      <button type="button" onClick={pay} disabled={!stripe || loading} className="btn btn-primary w-full mt-6 !py-4 !text-base">
        {loading ? "Paiement en cours…" : `Payer ${eur(totalCents)}`}
      </button>
    </div>
  );
}
