import webpush from "web-push";
import { prisma } from "@/lib/prisma";

/**
 * Notifications push (PWA) — §11.4. Gratuites (contrairement au SMS, non
 * retenu — aucun numéro de téléphone n'est collecté). Clés VAPID générées une
 * fois pour ce déploiement, aucun compte tiers nécessaire.
 */

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) throw new Error("Clés VAPID manquantes (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).");
  webpush.setVapidDetails(`mailto:${process.env.EMAIL_FROM || "contact@pizza.mehdi.website"}`, pub, priv);
  configured = true;
}

export function isPushConfigured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

async function sendToSubscription(sub: { id: string; endpoint: string; p256dh: string; auth: string }, payload: PushPayload) {
  ensureConfigured();
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      // Abonnement expiré/révoqué côté navigateur — on le retire silencieusement.
      await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
    } else {
      console.error("[push] échec d'envoi :", err);
    }
  }
}

/** Alerte "commande prête" (§11.4) — envoyée au client concerné uniquement. */
export async function sendPushToCustomer(customerId: string, payload: PushPayload) {
  if (!isPushConfigured()) return;
  const subs = await prisma.pushSubscription.findMany({ where: { customerId } });
  await Promise.all(subs.map((s) => sendToSubscription(s, payload)));
}

/** Campagne promotionnelle (§11.4) — à tous les abonnés. */
export async function sendPushBroadcast(payload: PushPayload) {
  if (!isPushConfigured()) return 0;
  const subs = await prisma.pushSubscription.findMany();
  await Promise.all(subs.map((s) => sendToSubscription(s, payload)));
  return subs.length;
}
