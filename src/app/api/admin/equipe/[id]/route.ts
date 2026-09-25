import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { requireOwner } from "@/lib/require-owner";

const schema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["OWNER", "STAFF"]).optional(),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum.").max(100).optional(),
});

async function otherActiveOwners(exceptId: string) {
  return prisma.staffUser.count({ where: { role: "OWNER", isActive: true, id: { not: exceptId } } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });
  const d = parsed.data;

  const target = await prisma.staffUser.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });

  const losingOwner = target.role === "OWNER" && (d.isActive === false || d.role === "STAFF");
  if (losingOwner && (id === auth.staff.sub || (await otherActiveOwners(id)) === 0)) {
    return NextResponse.json({ error: "Impossible : il doit rester au moins un propriétaire actif (et vous ne pouvez pas retirer votre propre accès)." }, { status: 409 });
  }
  if (id === auth.staff.sub && d.isActive === false) return NextResponse.json({ error: "Vous ne pouvez pas désactiver votre propre compte." }, { status: 409 });

  await prisma.staffUser.update({
    where: { id },
    data: { ...(d.isActive !== undefined ? { isActive: d.isActive } : {}), ...(d.role ? { role: d.role } : {}), ...(d.password ? { passwordHash: await hashPassword(d.password) } : {}) },
  });
  await prisma.auditLog.create({ data: { staffUserId: auth.staff.sub, action: "staff.updated", targetType: "StaffUser", targetId: id, metadata: { isActive: d.isActive, role: d.role, passwordReset: !!d.password } } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const target = await prisma.staffUser.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ ok: true });
  if (id === auth.staff.sub) return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte." }, { status: 409 });
  if (target.role === "OWNER" && (await otherActiveOwners(id)) === 0) return NextResponse.json({ error: "Il doit rester au moins un propriétaire." }, { status: 409 });
  await prisma.staffUser.delete({ where: { id } });
  await prisma.auditLog.create({ data: { staffUserId: auth.staff.sub, action: "staff.deleted", targetType: "StaffUser", targetId: id, metadata: { email: target.email } } });
  return NextResponse.json({ ok: true });
}
