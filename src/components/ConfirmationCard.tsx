"use client";

import Link from "next/link";

export interface ConfirmationItem {
  quantity: number;
  name: string;
  size?: string;
  details: string[];
  lineTotalCents: number;
}

const eur = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const hour = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

// Positions fixes (pas de hasard : identiques côté serveur et client)
const CONFETTI = [
  { e: "🍕", x: "-150px", y: "-20px", r: "-40deg", d: "0.9s" },
  { e: "🍅", x: "130px", y: "-40px", r: "60deg", d: "1s" },
  { e: "🌿", x: "-90px", y: "70px", r: "120deg", d: "1.05s" },
  { e: "🧀", x: "170px", y: "60px", r: "-80deg", d: "0.95s" },
  { e: "✨", x: "-190px", y: "40px", r: "30deg", d: "1.1s" },
  { e: "🍕", x: "60px", y: "-70px", r: "90deg", d: "1.15s" },
  { e: "✨", x: "200px", y: "10px", r: "-30deg", d: "1s" },
  { e: "🍄", x: "-40px", y: "-60px", r: "-100deg", d: "1.2s" },
];

/**
 * Carte de commande confirmée : coche animée, confettis, numéro et nom en grand,
 * puis récapitulatif façon ticket.
 */
export function ConfirmationCard({
  orderNumber,
  name,
  totalCents,
  email,
  slot,
  items,
  trackingUrl,
}: {
  orderNumber: number;
  name: string;
  totalCents: number;
  email?: string;
  slot?: { start: Date; end: Date } | null;
  items: ConfirmationItem[];
  trackingUrl: string;
}) {
  return (
    <div className="mx-auto max-w-md pop-in">
      <div className="relative overflow-hidden rounded-[36px] bg-white shadow-[0_40px_90px_-30px_rgba(160,72,30,0.55)]">
        {/* En-tête */}
        <div className="relative overflow-hidden bg-gradient-to-b from-[#f4703f] to-flame-deep px-6 pt-9 pb-8 text-center text-white">
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              aria-hidden="true"
              className="confetti"
              style={{ "--x": c.x, "--y": c.y, "--r": c.r, "--d": c.d } as React.CSSProperties}
            >
              {c.e}
            </span>
          ))}

          <div className="relative mx-auto h-[84px] w-[84px]">
            <span className="pulse-ring absolute inset-0 rounded-full bg-white/40" aria-hidden="true" />
            <svg viewBox="0 0 72 72" className="relative h-full w-full" aria-hidden="true">
              <circle cx="36" cy="36" r="30" fill="rgba(255,255,255,0.18)" />
              <circle
                className="draw-circle"
                cx="36"
                cy="36"
                r="30"
                fill="none"
                stroke="#fff"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <path
                className="draw-check"
                d="M23 37.5l9 9 17-19"
                fill="none"
                stroke="#fff"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h1 className="display text-[1.7rem] mt-5">Commande confirmée !</h1>
          <p className="text-white/85 text-sm mt-1.5">Merci {name}, on s&rsquo;occupe du reste.</p>
        </div>

        {/* Numéro + nom */}
        <div className="relative px-6 pt-7 pb-6 text-center shine">
          <p className="eyebrow">Votre numéro</p>
          <p className="display count-in text-[4.2rem] leading-none text-ember mt-2 tnum">#{orderNumber}</p>
          <p className="mt-3 text-fg-dim text-sm">
            Au nom de <span className="display text-fg text-lg">{name}</span>
          </p>
          {slot && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm">
              <span aria-hidden="true">🕒</span>
              Retrait{" "}
              <strong className="tnum">
                {hour.format(slot.start)} – {hour.format(slot.end)}
              </strong>
            </p>
          )}
        </div>

        {/* Ticket */}
        <div className="ticket-cut mx-6" />
        <div className="px-6 pt-5 pb-6">
          <ul className="flex flex-col gap-3 text-sm">
            {items.map((it, i) => (
              <li key={i} className="flex items-start justify-between gap-4">
                <span className="min-w-0">
                  <span className="tnum font-semibold">{it.quantity}× </span>
                  {it.name}
                  {it.size && <span className="text-fg-faint"> · {it.size}</span>}
                  {it.details.map((d) => (
                    <span key={d} className="block text-[0.75rem] text-fg-faint">
                      {d}
                    </span>
                  ))}
                </span>
                <span className="tnum shrink-0 text-fg-dim">{eur(it.lineTotalCents)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
            <span className="display text-lg">Total payé</span>
            <span className="display text-3xl text-ember tnum">{eur(totalCents)}</span>
          </div>

          {email && (
            <p className="mt-4 text-center text-[0.78rem] text-fg-faint">
              ✉️ Un reçu vous est envoyé à <strong className="text-fg-dim">{email}</strong>
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2.5">
            <Link href={trackingUrl} className="btn btn-primary w-full">
              Suivre ma commande
            </Link>
            <Link href="/" className="btn btn-ghost w-full">
              Retour à l&rsquo;accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
