import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";

/** Codes promotionnels (§11.3) — type simple, pourcentage ou montant fixe. */
export async function GET() {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const codes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ codes });
}

const bodySchema = z.object({
  code: z.string().min(3).max(30).transform((s) => s.toUpperCase().trim()),
  kind: z.enum(["PERCENT", "FIXED"]),
  value: z.number().int().min(1),
  expiresAt: z.string().datetime().optional(),
  maxUses: z.number().int().min(1).optional(),
});

export async function POST(req: Request) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const body = parsed.data;

  if (body.kind === "PERCENT" && body.value > 100) {
    return NextResponse.json({ error: "Un pourcentage ne peut pas dépasser 100." }, { status: 400 });
  }

  const existing = await prisma.promoCode.findUnique({ where: { code: body.code } });
  if (existing) return NextResponse.json({ error: "Ce code existe déjà." }, { status: 409 });

  const promo = await prisma.promoCode.create({
    data: {
      code: body.code,
      kind: body.kind,
      value: body.kind === "FIXED" ? body.value * 100 : body.value, // FIXED en centimes
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      maxUses: body.maxUses,
    },
  });

  await prisma.auditLog.create({
    data: { staffUserId: staff.sub, action: "promo.created", targetType: "PromoCode", targetId: promo.id },
  });

  return NextResponse.json({ promo });
}
