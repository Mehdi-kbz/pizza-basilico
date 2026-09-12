import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOrderTrackingToken } from "@/lib/auth";
import { getCustomerSession } from "@/lib/require-customer";

/**
 * Abonnement aux notifications push — proposé après la première commande
 * réussie plutôt qu'à la première visite (§11.4, meilleur taux d'acceptation).
 * Le client est identifié soit via son compte, soit via le jeton de suivi de
 * la commande qu'il vient de passer (aucune connexion requise pour un invité).
 */
const bodySchema = z.object({
  orderId: z.string().optional(),
  trackingToken: z.string().optional(),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({ p256dh: z.string(), auth: z.string() }),
  }),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const body = parsed.data;

  let customerId: string | null = null;

  const customerSession = await getCustomerSession();
  if (customerSession) customerId = customerSession.sub;

  if (!customerId && body.orderId && body.trackingToken) {
    const payload = verifyOrderTrackingToken(body.trackingToken);
    if (payload?.sub === body.orderId) {
      const order = await prisma.order.findUnique({ where: { id: body.orderId } });
      customerId = order?.customerId ?? null;
    }
  }

  if (!customerId) return NextResponse.json({ error: "Client non identifié." }, { status: 401 });

  await prisma.pushSubscription.upsert({
    where: { endpoint: body.subscription.endpoint },
    update: { customerId, p256dh: body.subscription.keys.p256dh, auth: body.subscription.keys.auth },
    create: {
      customerId,
      endpoint: body.subscription.endpoint,
      p256dh: body.subscription.keys.p256dh,
      auth: body.subscription.keys.auth,
    },
  });

  return NextResponse.json({ ok: true });
}
