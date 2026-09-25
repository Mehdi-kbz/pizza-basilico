import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { requireOwner } from "@/lib/require-owner";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Mot de passe : 8 caractères minimum.").max(100),
  role: z.enum(["OWNER", "STAFF"]),
});

export async function POST(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });
  const { email, password, role } = parsed.data;

  if (await prisma.staffUser.findFirst({ where: { email: { equals: email, mode: "insensitive" } } })) {
    return NextResponse.json({ error: "Un compte existe déjà avec cet e-mail." }, { status: 409 });
  }
  const u = await prisma.staffUser.create({ data: { email, role, passwordHash: await hashPassword(password) }, select: { id: true } });
  await prisma.auditLog.create({ data: { staffUserId: auth.staff.sub, action: "staff.created", targetType: "StaffUser", targetId: u.id, metadata: { email, role } } });
  return NextResponse.json({ id: u.id });
}
