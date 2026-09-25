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

/** Lien magique de connexion (§3.1) — compte client optionnel, sans mot de passe. */
export async function sendMagicLinkEmail(to: string, loginUrl: string) {
  await getEmailProvider().send({
    to,
    subject: "Votre lien de connexion — Pizza Basilico",
    html: emailShell(
      "Votre lien de connexion",
      `<p>Cliquez pour accéder à votre compte (historique de commandes, fidélité) :</p>
       <p><a href="${loginUrl}" style="display:inline-block;background:#3b5a34;color:#fff;padding:10px 18px;border-radius:4px;text-decoration:none;">Se connecter</a></p>
       <p style="color:#585a4d;font-size:13px;">Ce lien expire dans 15 minutes et ne peut servir qu'une seule fois.</p>`
    ),
  });
}

interface OrderForEmail {
  /** Lien de confirmation de l'e-mail, si un compte vient d'être créé avec cette commande. */
  verifyUrl?: string;
  dailyOrderNumber: number;
  pickupName: string;
  totalCents: number;
  subtotalCents: number;
  discountCents: number;
  tipCents: number;
  guestEmail: string;
  note: string | null;
  timeSlot: { startAt: Date; endAt: Date };
  session: { location: { label: string; address: string } };
  items: {
    quantity: number;
    unitPriceCents: number;
    note: string | null;
    menuItem: { name: string };
    menuItemSize: { label: string } | null;
    addedIngredients: { ingredient: { name: string } }[];
    removedIngredients: { ingredient: { name: string } }[];
  }[];
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const hour = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

/** Reçu de commande (§9.3) — envoyé une fois le paiement confirmé (webhook). */
export async function sendOrderConfirmationEmail(order: OrderForEmail) {
  const itemsHtml = order.items
    .map((i) => {
      const details = [
        i.addedIngredients.length ? `+ ${i.addedIngredients.map((a) => esc(a.ingredient.name)).join(", ")}` : "",
        i.removedIngredients.length
          ? `Sans ${i.removedIngredients.map((a) => esc(a.ingredient.name.toLowerCase())).join(", ")}`
          : "",
        i.note ? `« ${esc(i.note)} »` : "",
      ].filter(Boolean);
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #f2dccd;vertical-align:top;">
          <strong>${i.quantity}× ${esc(i.menuItem.name)}</strong>${i.menuItemSize ? ` <span style="color:#866a5a;">(${esc(i.menuItemSize.label)})</span>` : ""}
          ${details.length ? `<div style="font-size:12px;color:#866a5a;margin-top:2px;">${details.join(" · ")}</div>` : ""}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f2dccd;text-align:right;vertical-align:top;white-space:nowrap;">${eur(i.unitPriceCents * i.quantity)}</td>
      </tr>`;
    })
    .join("");

  const extraRow = (label: string, value: string) =>
    `<tr><td style="padding:3px 0;color:#6a5041;">${label}</td><td style="padding:3px 0;text-align:right;color:#6a5041;">${value}</td></tr>`;

  await getEmailProvider().send({
    to: order.guestEmail,
    subject: `Commande #${order.dailyOrderNumber} confirmée — Pizza Basilico`,
    html: `
<div style="background:#fff6ef;padding:24px 12px;font-family:-apple-system,'Segoe UI',sans-serif;color:#2b1710;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(160,72,30,.15);">
    <div style="background:linear-gradient(160deg,#f4703f,#d9441a);padding:28px 24px;text-align:center;color:#fff;">
      <p style="margin:0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;opacity:.9;">Pizza Basilico</p>
      <p style="margin:10px 0 0;font-size:44px;font-weight:700;line-height:1;">#${order.dailyOrderNumber}</p>
      <p style="margin:10px 0 0;font-size:16px;">Merci ${esc(order.pickupName)}, c'est confirmé !</p>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#866a5a;">Retrait</p>
      <p style="margin:0 0 20px;font-size:16px;">
        <strong>${hour.format(order.timeSlot.startAt)} – ${hour.format(order.timeSlot.endAt)}</strong><br/>
        ${esc(order.session.location.label)}<br/>
        <span style="color:#866a5a;font-size:13px;">${esc(order.session.location.address)}</span>
      </p>
      <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#866a5a;">Votre commande</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">${itemsHtml}</table>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:10px;">
        ${order.discountCents > 0 ? extraRow("Réduction", `−${eur(order.discountCents)}`) : ""}
        ${order.tipCents > 0 ? extraRow("Pourboire", eur(order.tipCents)) : ""}
        <tr><td style="padding-top:8px;font-size:16px;font-weight:700;">Total payé</td><td style="padding-top:8px;text-align:right;font-size:20px;font-weight:700;color:#c4441a;">${eur(order.totalCents)}</td></tr>
      </table>
      ${order.note ? `<p style="margin:18px 0 0;font-size:13px;color:#6a5041;"><strong>Votre note :</strong> ${esc(order.note)}</p>` : ""}
      ${
        order.verifyUrl
          ? `<div style="margin:22px 0 0;padding:16px;border-radius:16px;background:#fff1e8;text-align:center;">
        <p style="margin:0 0 10px;font-size:14px;">Votre compte est créé. Confirmez votre e-mail pour retrouver vos commandes et utiliser vos pizzas offertes.</p>
        <a href="${order.verifyUrl}" style="display:inline-block;background:#d9441a;color:#fff;padding:11px 22px;border-radius:999px;text-decoration:none;font-weight:700;font-size:14px;">Confirmer mon e-mail</a>
      </div>`
          : ""
      }
      <p style="margin:22px 0 0;font-size:13px;color:#866a5a;">Donnez votre nom au comptoir : on vous appellera. À tout de suite !</p>
    </div>
  </div>
</div>`,
  });
}

/** Lien pour choisir (ou réinitialiser) son mot de passe — valable 1 h. */
export async function sendPasswordResetEmail(to: string, url: string) {
  await getEmailProvider().send({
    to,
    subject: "Votre mot de passe — Pizza Basilico",
    html: `
<div style="background:#fff6ef;padding:24px 12px;font-family:-apple-system,'Segoe UI',sans-serif;color:#2b1710;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(160,72,30,.15);">
    <div style="background:linear-gradient(160deg,#f4703f,#d9441a);padding:26px 24px;text-align:center;color:#fff;">
      <p style="margin:0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;opacity:.9;">Pizza Basilico</p>
      <p style="margin:10px 0 0;font-size:20px;font-weight:700;">Choisissez votre mot de passe</p>
    </div>
    <div style="padding:24px;font-size:15px;line-height:1.6;text-align:center;">
      <p style="margin:0 0 18px;">Cliquez pour définir votre mot de passe. Votre e-mail sera confirmé et vous serez connecté.</p>
      <a href="${url}" style="display:inline-block;background:#d9441a;color:#fff;padding:13px 26px;border-radius:999px;text-decoration:none;font-weight:700;">Choisir mon mot de passe</a>
      <p style="margin:18px 0 0;color:#866a5a;font-size:12px;">Ce lien est valable 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
    </div>
  </div>
</div>`,
  });
}

/** Accusé de réception d'une candidature spontanée. */
export async function sendApplicationConfirmationEmail(to: string, name: string) {
  await getEmailProvider().send({
    to,
    subject: "Nous avons bien reçu votre candidature — Pizza Basilico",
    html: `
<div style="background:#fff6ef;padding:24px 12px;font-family:-apple-system,'Segoe UI',sans-serif;color:#2b1710;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(160,72,30,.15);">
    <div style="background:linear-gradient(160deg,#f4703f,#d9441a);padding:28px 24px;text-align:center;color:#fff;">
      <p style="margin:0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;opacity:.9;">Pizza Basilico</p>
      <p style="margin:12px 0 0;font-size:22px;font-weight:700;">Merci ${esc(name)} !</p>
    </div>
    <div style="padding:24px;font-size:15px;line-height:1.6;">
      <p style="margin:0 0 12px;">Nous avons bien reçu votre candidature et votre CV.</p>
      <p style="margin:0 0 12px;">L'équipe la lit avec attention. Si votre profil correspond à ce que nous cherchons, nous vous recontactons directement par téléphone ou par e-mail.</p>
      <p style="margin:0;color:#866a5a;font-size:13px;">À très vite, l'équipe Pizza Basilico 🍕</p>
    </div>
  </div>
</div>`,
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
