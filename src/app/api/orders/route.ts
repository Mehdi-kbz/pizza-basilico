import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { priceCart, applyPromoCode, CartValidationError } from "@/lib/cart";
import {
  findNextAvailableSlot,
  reserveTimeSlot,
  releaseTimeSlot,
  computeHoldExpiry,
  nextDailyOrderNumber,
  SlotFullError,
} from "@/lib/slots";
import { getPaymentProvider } from "@/lib/payments";
import { signOrderTrackingToken } from "@/lib/auth";
import { getLoyaltyStatus } from "@/lib/loyalty";
import { OrderChannel } from "@/generated/prisma/client";

/**
 * Création d'une commande (parcours client — §3, §6). Revalide tout côté
 * serveur (prix, disponibilité, capacité) : le corps de la requête n'est
 * jamais une source de vérité.
 */

const bodySchema = z.object({
  sessionId: z.string(),
  timeSlotId: z.string().optional(),
  email: z.string().email(),
  pickupName: z.string().min(1).max(80),
  note: z.string().max(280).optional(),
  tipCents: z.number().int().min(0).max(5000).default(0),
  promoCode: z.string().optional(),
  redeemLoyalty: z.boolean().default(false),
  channel: z.enum(["ONLINE", "WALKUP_QR", "WALKUP_STAFF"]).default("ONLINE"),
  items: z
    .array(
      z.object({
        menuItemId: z.string(),
        sizeId: z.string(),
        quantity: z.number().int().min(1).max(20),
        addedIngredientIds: z.array(z.string()).max(10).optional(),
        removedIngredientIds: z.array(z.string()).max(30).optional(),
        note: z.string().max(140).optional(),
      })
    )
    .min(1),
});

// Signalement (non bloquant) d'une commande inhabituellement volumineuse — §10.5
const LARGE_ORDER_UNIT_THRESHOLD = 10;

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide.", details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const session = await prisma.serviceSession.findUnique({ where: { id: body.sessionId } });
  if (!session) return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
  if (!session.isOrderingOpen) {
    return NextResponse.json({ error: "Les commandes sont actuellement fermées pour cette session." }, { status: 409 });
  }

  let priced: Awaited<ReturnType<typeof priceCart>>;
  let discount: Awaited<ReturnType<typeof applyPromoCode>>;
  let loyaltyDiscountCents = 0;
  try {
    priced = await priceCart(body.items);
    discount = await applyPromoCode(body.promoCode, priced.subtotalCents);

    if (body.redeemLoyalty) {
      const loyalty = await getLoyaltyStatus(body.email);
      if (!loyalty.eligibleForFreeItem) {
        throw new CartValidationError("Pas assez de tampons de fidélité pour un article offert.");
      }
      // La pizza offerte est la plus chère du panier (le plus avantageux pour le client).
      const pizzaLines = priced.lines.filter((l) => l.capacityWeight > 0);
      loyaltyDiscountCents = Math.max(0, ...pizzaLines.map((l) => l.unitPriceCents));
    }
  } catch (e) {
    if (e instanceof CartValidationError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    throw e;
  }

  // Créneau : explicite (déjà choisi par le client) ou auto-assigné au prochain disponible.
  const timeSlot = body.timeSlotId
    ? await prisma.timeSlot.findUnique({ where: { id: body.timeSlotId } })
    : await findNextAvailableSlot(body.sessionId, priced.totalUnits);

  if (!timeSlot || timeSlot.sessionId !== body.sessionId) {
    return NextResponse.json({ error: "Créneau introuvable." }, { status: 404 });
  }

  try {
    await reserveTimeSlot(timeSlot.id, priced.totalUnits);
  } catch (e) {
    if (e instanceof SlotFullError) {
      return NextResponse.json(
        { error: "Ce créneau vient d'être complété, merci de choisir le suivant." },
        { status: 409 }
      );
    }
    throw e;
  }

  try {
    const customer = await prisma.customer.upsert({
      where: { email: body.email },
      update: {},
      create: { email: body.email },
    });

    const totalDiscountCents = discount.discountCents + loyaltyDiscountCents;
    const totalCents = Math.max(0, priced.subtotalCents - totalDiscountCents + body.tipCents);
    const dailyOrderNumber = await nextDailyOrderNumber(body.sessionId);

    const order = await prisma.order.create({
      data: {
        sessionId: body.sessionId,
        timeSlotId: timeSlot.id,
        customerId: customer.id,
        guestEmail: body.email,
        channel: body.channel as OrderChannel,
        dailyOrderNumber,
        pickupName: body.pickupName,
        note: body.note,
        subtotalCents: priced.subtotalCents,
        tipCents: body.tipCents,
        discountCents: totalDiscountCents,
        totalCents,
        promoCodeId: discount.promoCodeId,
        flaggedLarge: priced.totalUnits >= LARGE_ORDER_UNIT_THRESHOLD,
        holdExpiresAt: computeHoldExpiry(),
        // Fidélité (§8) : figée à la commande, réglée seulement au paiement confirmé (voir webhook)
        loyaltyRedeemed: body.redeemLoyalty,
        loyaltyStampsAwarded: priced.totalUnits,
        items: {
          create: priced.lines.map((line) => ({
            menuItemId: line.menuItemId,
            menuItemSizeId: line.sizeId,
            quantity: line.quantity,
            unitPriceCents: line.unitPriceCents,
            capacityWeight: line.capacityWeight,
            note: line.note,
            addedIngredients: {
              create: line.addedIngredientIds.map((ingredientId) => ({ ingredientId })),
            },
            removedIngredients: {
              create: line.removedIngredientIds.map((ingredientId) => ({ ingredientId })),
            },
          })),
        },
      },
    });

    if (discount.promoCodeId) {
      await prisma.promoCode.update({
        where: { id: discount.promoCodeId },
        data: { usesCount: { increment: 1 } },
      });
    }

    let payment: Awaited<ReturnType<ReturnType<typeof getPaymentProvider>["createPaymentIntent"]>>;
    try {
      payment = await getPaymentProvider().createPaymentIntent({
        amountCents: totalCents,
        currency: "eur",
        orderId: order.id,
        customerEmail: body.email,
      });
    } catch (paymentError) {
      // Compensation : la commande créée juste au-dessus et le créneau réservé
      // en tout début de fonction doivent tous deux être défaits, pour ne pas
      // laisser une commande orpheline ni une capacité fantôme.
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      await releaseTimeSlot(timeSlot.id, priced.totalUnits).catch(() => {});
      console.error("Échec de création du paiement :", paymentError);
      return NextResponse.json(
        { error: "Le paiement n'a pas pu être initialisé. Merci de réessayer." },
        { status: 502 }
      );
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { paymentProvider: payment.provider, paymentRef: payment.providerRef },
    });

    const trackingToken = signOrderTrackingToken(order.id);

    return NextResponse.json({
      orderId: order.id,
      dailyOrderNumber: order.dailyOrderNumber,
      totalCents,
      slotStart: timeSlot.startAt,
      slotEnd: timeSlot.endAt,
      clientSecret: payment.clientSecret,
      trackingUrl: `/suivi/${order.id}?t=${trackingToken}`,
    });
  } catch (e) {
    // Compensation : la commande n'a pas pu être créée/payée, on libère le créneau réservé.
    await releaseTimeSlot(timeSlot.id, priced.totalUnits).catch(() => {});
    throw e;
  }
}
