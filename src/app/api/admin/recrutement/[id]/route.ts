import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";

const bodySchema = z.object({ status: z.enum(["NEW", "REVIEWED", "CONTACTED", "ARCHIVED"]) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const { id } = await params;
  const updated = await prisma.jobApplication
    .update({ where: { id }, data: { status: parsed.data.status }, select: { id: true, status: true } })
    .catch(() => null);
  if (!updated) return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (staff.role !== "OWNER") return NextResponse.json({ error: "Réservé au propriétaire." }, { status: 403 });

  const { id } = await params;
  await prisma.jobApplication.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
