import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";

const schema = z.object({ status: z.enum(["NEW", "CONTACTED", "CLOSED"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const { id } = await params;
  const r = await prisma.cateringInquiry.update({ where: { id }, data: { status: parsed.data.status }, select: { id: true } }).catch(() => null);
  if (!r) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
