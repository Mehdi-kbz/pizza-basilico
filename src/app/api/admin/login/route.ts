import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, verifyTotpCode, signStaffSession } from "@/lib/auth";

/**
 * Connexion personnel — mot de passe + 2FA obligatoires pour tous les comptes,
 * sans exception (§10.1). Les comptes sont créés manuellement (pas d'auto-inscription).
 */

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().length(6),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const { email, password, totpCode } = parsed.data;

  const staff = await prisma.staffUser.findUnique({ where: { email } });

  // Réponse volontairement identique en cas d'e-mail inconnu / mot de passe faux /
  // 2FA non configurée, pour ne pas révéler quel compte existe.
  const genericError = NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });

  if (!staff || !staff.isActive) return genericError;

  const passwordOk = await verifyPassword(password, staff.passwordHash);
  if (!passwordOk) return genericError;

  if (!staff.totpEnabled || !staff.totpSecret) {
    return NextResponse.json(
      { error: "La double authentification doit être activée avant la première connexion." },
      { status: 403 }
    );
  }

  const totpOk = verifyTotpCode(staff.totpSecret, totpCode);
  if (!totpOk) return genericError;

  await prisma.staffUser.update({ where: { id: staff.id }, data: { lastLoginAt: new Date() } });
  await prisma.auditLog.create({
    data: { staffUserId: staff.id, action: "staff.login", targetType: "StaffUser", targetId: staff.id },
  });

  const token = signStaffSession({ sub: staff.id, role: staff.role });

  const res = NextResponse.json({ ok: true, role: staff.role });
  res.cookies.set("staff_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
