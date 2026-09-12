import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";
import { releaseTimeSlot } from "@/lib/slots";
import { getPaymentProvider } from "@/lib/payments";
import { OrderStatus, PaymentStatus } from "@/generated/prisma/client";

/**
 * Changement de statut d'une commande par le personnel (§10.2). Le passage à
 * CANCELLED déclenche le remboursement exceptionnel manuel (§9.4) — la vente
 * est ferme par défaut, ce chemin est réservé à un incident réel côté camion.
 */

const bodySchema = z.object({
  status: z.enum(["CONFIRMED", "IN_PREP", "READY", "COMPLETED", "CANCELLED", "NO_SHOW"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const { status } = parsed.data;

  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });

  const timestamps: Record<string, Date> = {};
  if (status === "READY") timestamps.readyAt = new Date();
  if (status === "COMPLETED") timestamps.completedAt = new Date();
  if (status === "CANCELLED") timestamps.cancelledAt = new Date();

  if (status === "CANCELLED" && order.status !== "CANCELLED") {
    const units = order.items.reduce((sum, i) => sum + i.capacityWeight * i.quantity, 0);
    await releaseTimeSlot(order.timeSlotId, units).catch(() => {});

    if (order.paymentStatus === PaymentStatus.SUCCEEDED && order.paymentRef) {
      // Remboursement exceptionnel manuel — cas d'incident réel uniquement (§9.4)
      await getPaymentProvider().refund({ providerRef: order.paymentRef });
      await prisma.order.update({ where: { id }, data: { paymentStatus: PaymentStatus.REFUNDED } });
    }
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: status as OrderStatus, ...timestamps },
  });

  await prisma.auditLog.create({
    data: {
      staffUserId: staff.sub,
      action: "order.status_changed",
      targetType: "Order",
      targetId: id,
      metadata: { from: order.status, to: status },
    },
  });

  return NextResponse.json({ order: updated });
}
