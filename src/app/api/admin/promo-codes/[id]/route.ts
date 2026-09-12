import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";

const bodySchema = z.object({ isActive: z.boolean() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const promo = await prisma.promoCode.update({ where: { id }, data: { isActive: parsed.data.isActive } });
  await prisma.auditLog.create({
    data: {
      staffUserId: staff.sub,
      action: parsed.data.isActive ? "promo.activated" : "promo.deactivated",
      targetType: "PromoCode",
      targetId: id,
    },
  });

  return NextResponse.json({ promo });
}
