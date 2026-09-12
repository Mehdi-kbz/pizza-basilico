import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/lib/payments";
import { releaseTimeSlot } from "@/lib/slots";
import { settleLoyaltyForOrder } from "@/lib/loyalty";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { notifyOrdersChanged } from "@/lib/realtime";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/client";

/**
 * Point d'entrée webhook du prestataire de paiement (§9.1). La confirmation
 * d'une commande ne repose jamais uniquement sur la redirection navigateur
 * côté client : seul ce webhook, signé par le prestataire, fait foi.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  const event = getPaymentProvider().parseWebhookEvent(rawBody, signature);
  if (!event) return NextResponse.json({ error: "Signature invalide." }, { status: 400 });

  const order = await prisma.order.findFirst({ where: { paymentRef: event.providerRef } });
  if (!order) return NextResponse.json({ received: true }); // évènement hors périmètre, ignoré

  switch (event.type) {
    case "payment_succeeded": {
      if (order.status === OrderStatus.PENDING_PAYMENT) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CONFIRMED,
            paymentStatus: PaymentStatus.SUCCEEDED,
            confirmedAt: new Date(),
            holdExpiresAt: null,
          },
        });

        // Fidélité réglée seulement maintenant, jamais avant un paiement confirmé (§8).
        if (order.customerId) {
          await settleLoyaltyForOrder(order.customerId, order.loyaltyStampsAwarded, order.loyaltyRedeemed).catch(
            (e) => console.error("Échec du règlement de fidélité :", e)
          );
        }

        const full = await prisma.order.findUnique({
          where: { id: order.id },
          include: { items: { include: { menuItem: true, menuItemSize: true } } },
        });
        if (full) {
          await sendOrderConfirmationEmail(full).catch((e) => console.error("Échec d'envoi du reçu :", e));
        }
        await notifyOrdersChanged(order.sessionId).catch((e) => console.error("[realtime] notify :", e));
      }
      break;
    }
    case "payment_failed": {
      if (order.status === OrderStatus.PENDING_PAYMENT) {
        const units = await prisma.orderItem
          .findMany({ where: { orderId: order.id } })
          .then((items) => items.reduce((sum, i) => sum + i.capacityWeight * i.quantity, 0));
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.FAILED, cancelledAt: new Date() },
          }),
        ]);
        await releaseTimeSlot(order.timeSlotId, units);
      }
      break;
    }
    case "refunded": {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.REFUNDED, paymentStatus: PaymentStatus.REFUNDED },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
