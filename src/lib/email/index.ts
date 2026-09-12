import type { EmailProvider } from "./types";
import { ResendEmailProvider } from "./resend";
import { NoopEmailProvider } from "./noop";

export type { EmailProvider, SendEmailInput } from "./types";

let provider: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (!provider) {
    provider = process.env.EMAIL_API_KEY ? new ResendEmailProvider() : new NoopEmailProvider();
  }
  return provider;
}

const eur = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

const emailShell = (title: string, bodyHtml: string) => `
<div style="font-family:-apple-system,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;color:#232017;">
  <p style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#a5462d;font-weight:600;margin:0 0 4px;">Pizza Basilico</p>
  <h1 style="font-size:20px;margin:0 0 16px;">${title}</h1>
  ${bodyHtml}
</div>`;

interface OrderForEmail {
  dailyOrderNumber: number;
  pickupName: string;
  totalCents: number;
  guestEmail: string;
  items: { quantity: number; menuItem: { name: string }; menuItemSize: { label: string } | null }[];
}

/** Reçu de commande (§9.3) — envoyé une fois le paiement confirmé (webhook). */
export async function sendOrderConfirmationEmail(order: OrderForEmail) {
  const itemsHtml = order.items
    .map((i) => `<li>${i.quantity}× ${i.menuItem.name}${i.menuItemSize ? ` (${i.menuItemSize.label})` : ""}</li>`)
    .join("");

  await getEmailProvider().send({
    to: order.guestEmail,
    subject: `Commande #${order.dailyOrderNumber} confirmée — Pizza Basilico`,
    html: emailShell(
      `Commande #${order.dailyOrderNumber} confirmée`,
      `<p>Merci ${order.pickupName} ! Voici le récapitulatif :</p>
       <ul style="padding-left:18px;">${itemsHtml}</ul>
       <p style="font-weight:600;">Total : ${eur(order.totalCents)}</p>`
    ),
  });
}

interface DigestData {
  ordersCount: number;
  totalCents: number;
  topItems: { name: string; count: number }[];
  periodLabel: string;
}

/** Synthèse au propriétaire (§10.4) — quotidienne et hebdomadaire. */
export async function sendOwnerDigestEmail(to: string, data: DigestData) {
  const topItemsHtml = data.topItems.map((i) => `<li>${i.name} — ${i.count}</li>`).join("");
  await getEmailProvider().send({
    to,
    subject: `Synthèse ${data.periodLabel} — ${data.ordersCount} commandes`,
    html: emailShell(
      `Synthèse ${data.periodLabel}`,
      `<p><strong>${data.ordersCount}</strong> commandes — <strong>${eur(data.totalCents)}</strong> de chiffre d'affaires</p>
       <p>Articles les plus vendus :</p>
       <ul style="padding-left:18px;">${topItemsHtml || "<li>Aucune vente sur la période</li>"}</ul>`
    ),
  });
}
