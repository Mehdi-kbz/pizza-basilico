import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/require-owner";
import { setPassword, passwordProblem } from "@/lib/customer-auth";

const schema = z.union([
  z.object({ stampCount: z.number().int().min(0).max(1000) }),
  z.object({ action: z.literal("verify") }),
  z.object({ password: z.string() }),
]);

/** Gestion d'un client par le propriétaire : tampons, confirmation manuelle de l'e-mail, mot de passe. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const { id } = await params;
  const d = parsed.data;

  if ("stampCount" in d) {
    const before = await prisma.loyaltyCard.findUnique({ where: { customerId: id }, select: { stampCount: true } });
    await prisma.loyaltyCard.upsert({
      where: { customerId: id },
      update: { stampCount: d.stampCount, lastEarnedAt: new Date() },
      create: { customerId: id, stampCount: d.stampCount, lastEarnedAt: new Date() },
    });
    await prisma.auditLog.create({ data: { staffUserId: auth.staff.sub, action: "loyalty.adjusted", targetType: "Customer", targetId: id, metadata: { from: before?.stampCount ?? 0, to: d.stampCount } } });
  } else if ("action" in d) {
    const c = await prisma.customer.findUnique({ where: { id }, select: { passwordHash: true } });
    if (!c?.passwordHash) return NextResponse.json({ error: "Ce client n'a pas de mot de passe : définissez-en un d'abord." }, { status: 409 });
    await prisma.customer.update({ where: { id }, data: { emailVerifiedAt: new Date(), hasAccount: true } });
    await prisma.auditLog.create({ data: { staffUserId: auth.staff.sub, action: "customer.email_verified_manually", targetType: "Customer", targetId: id } });
  } else {
    const problem = passwordProblem(d.password);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    // Défini par le propriétaire après vérification de l'identité : le compte est directement actif.
    await setPassword(id, d.password, true);
    await prisma.auditLog.create({ data: { staffUserId: auth.staff.sub, action: "customer.password_set_by_owner", targetType: "Customer", targetId: id } });
  }
  return NextResponse.json({ ok: true });
}
