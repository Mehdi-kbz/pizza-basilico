import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signOrderTrackingToken } from "@/lib/auth";

/**
 * « Suivre ma commande » — retrouver le lien de suivi sans rouvrir l'e-mail
 * de confirmation (§3.3).
 */
const bodySchema = z.object({
  email: z.string().email(),
  dailyOrderNumber: z.coerce.number().int().positive(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { guestEmail: parsed.data.email, dailyOrderNumber: parsed.data.dailyOrderNumber },
    orderBy: { createdAt: "desc" },
  });
  if (!order) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });

  const token = signOrderTrackingToken(order.id);
  return NextResponse.json({ trackingUrl: `/suivi/${order.id}?t=${token}` });
}
