import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";
import { priceCart, applyPromoCode, CartValidationError } from "@/lib/cart";
import { findNextAvailableSlot, reserveTimeSlot, nextDailyOrderNumber, SlotFullError } from "@/lib/slots";
import { getLoyaltyStatus, settleLoyaltyForOrder } from "@/lib/loyalty";
import { notifyOrdersChanged } from "@/lib/realtime";
import { OrderChannel, OrderStatus, PaymentStatus } from "@/generated/prisma/client";

/**
 * Commande assistée par le personnel (§7) — QR code walk-up mis à part (même
 * parcours que les clients à distance), ceci couvre le cas d'un client sans
 * smartphone ou préférant de l'aide au comptoir. Paiement marqué "en
 * personne" (terminal existant / espèces) — aucune intégration matérielle.
 */
const bodySchema = z.object({
  sessionId: z.string(),
  timeSlotId: z.string().optional(),
  pickupName: z.string().min(1).max(80),
  email: z.string().email().optional(), // optionnel — le client peut décliner
  note: z.string().max(280).optional(),
  tipCents: z.number().int().min(0).max(5000).default(0),
  promoCode: z.string().optional(),
  redeemLoyalty: z.boolean().default(false),
  override: z.boolean().default(false), // dépassement manuel du créneau, §6.4
  items: z
    .array(
      z.object({
        menuItemId: z.string(),
        sizeId: z.string(),
        quantity: z.number().int().min(1).max(20),
        addedIngredientIds: z.array(z.string()).max(10).optional(),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide.", details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const session = await prisma.serviceSession.findUnique({ where: { id: body.sessionId } });
  if (!session) return NextResponse.json({ error: "Session introuvable." }, { status: 404 });

  let priced: Awaited<ReturnType<typeof priceCart>>;
  let discount: Awaited<ReturnType<typeof applyPromoCode>>;
  let loyaltyDiscountCents = 0;
  try {
    priced = await priceCart(body.items);
    discount = await applyPromoCode(body.promoCode, priced.subtotalCents);
    if (body.redeemLoyalty && body.email) {
      const loyalty = await getLoyaltyStatus(body.email);
      if (loyalty.eligibleForFreeItem) {
        loyaltyDiscountCents = Math.max(0, ...priced.lines.filter((l) => l.capacityWeight > 0).map((l) => l.unitPriceCents));
      }
    }
  } catch (e) {
    if (e instanceof CartValidationError) return NextResponse.json({ error: e.message }, { status: 409 });
    throw e;
  }

  const timeSlot = body.timeSlotId
    ? await prisma.timeSlot.findUnique({ where: { id: body.timeSlotId } })
    : await findNextAvailableSlot(body.sessionId, priced.totalUnits);
  if (!timeSlot || timeSlot.sessionId !== body.sessionId) {
    return NextResponse.json({ error: "Créneau introuvable." }, { status: 404 });
  }

  try {
    await reserveTimeSlot(timeSlot.id, priced.totalUnits, { override: body.override });
  } catch (e) {
    if (e instanceof SlotFullError) {
      return NextResponse.json({ error: "Créneau complet (cochez « forcer » si vous savez avoir de la marge)." }, { status: 409 });
    }
    throw e;
  }

  const customer = body.email
    ? await prisma.customer.upsert({ where: { email: body.email }, update: {}, create: { email: body.email } })
    : null;

  const totalDiscountCents = discount.discountCents + loyaltyDiscountCents;
  const totalCents = Math.max(0, priced.subtotalCents - totalDiscountCents + body.tipCents);
  const dailyOrderNumber = await nextDailyOrderNumber(body.sessionId);

  const order = await prisma.order.create({
    data: {
      sessionId: body.sessionId,
      timeSlotId: timeSlot.id,
      customerId: customer?.id,
      guestEmail: body.email ?? "walk-up@pizza-basilico.local",
      channel: OrderChannel.WALKUP_STAFF,
      status: OrderStatus.CONFIRMED,
      dailyOrderNumber,
      pickupName: body.pickupName,
      note: body.note,
      subtotalCents: priced.subtotalCents,
      tipCents: body.tipCents,
      discountCents: totalDiscountCents,
      totalCents,
      promoCodeId: discount.promoCodeId,
      paidInPerson: true,
      paymentProvider: "in_person",
      paymentStatus: PaymentStatus.SUCCEEDED,
      confirmedAt: new Date(),
      createdByStaffId: staff.sub,
      loyaltyRedeemed: body.redeemLoyalty && loyaltyDiscountCents > 0,
      loyaltyStampsAwarded: priced.totalUnits,
      items: {
        create: priced.lines.map((line) => ({
          menuItemId: line.menuItemId,
          menuItemSizeId: line.sizeId,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          capacityWeight: line.capacityWeight,
          addedIngredients: { create: line.addedIngredientIds.map((ingredientId) => ({ ingredientId })) },
        })),
      },
    },
  });

  if (discount.promoCodeId) {
    await prisma.promoCode.update({ where: { id: discount.promoCodeId }, data: { usesCount: { increment: 1 } } });
  }

  // Paiement déjà encaissé en personne : la fidélité est réglée immédiatement,
  // il n'y aura pas de webhook de confirmation pour cette commande.
  if (customer) {
    await settleLoyaltyForOrder(customer.id, order.loyaltyStampsAwarded, order.loyaltyRedeemed);
  }

  await prisma.auditLog.create({
    data: {
      staffUserId: staff.sub,
      action: "order.created_walkup",
      targetType: "Order",
      targetId: order.id,
      metadata: { override: body.override },
    },
  });

  await notifyOrdersChanged(body.sessionId).catch((e) => console.error("[realtime] notify :", e));

  return NextResponse.json({ order });
}
