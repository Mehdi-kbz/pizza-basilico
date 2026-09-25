import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/require-owner";

const schema = z.object({ stampCount: z.number().int().min(0).max(1000) });

/** Ajustement manuel des tampons de fidélité (geste commercial, correction). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Nombre de tampons invalide." }, { status: 400 });
  const { id } = await params;

  const before = await prisma.loyaltyCard.findUnique({ where: { customerId: id }, select: { stampCount: true } });
  await prisma.loyaltyCard.upsert({
    where: { customerId: id },
    update: { stampCount: parsed.data.stampCount, lastEarnedAt: new Date() },
    create: { customerId: id, stampCount: parsed.data.stampCount, lastEarnedAt: new Date() },
  });
  await prisma.auditLog.create({ data: { staffUserId: auth.staff.sub, action: "loyalty.adjusted", targetType: "Customer", targetId: id, metadata: { from: before?.stampCount ?? 0, to: parsed.data.stampCount } } });
  return NextResponse.json({ ok: true });
}
