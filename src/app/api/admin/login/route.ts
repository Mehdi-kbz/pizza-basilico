import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, verifyTotpCode, signStaffSession } from "@/lib/auth";
import { tooManyAttempts, recordAttempt, clearAttempts } from "@/lib/rate-limit";

/**
 * Connexion personnel : e-mail + mot de passe. La double authentification est
 * désactivée par défaut ; elle se réactive en définissant ADMIN_REQUIRE_2FA=true
 * (les comptes créés avec un secret 2FA devront alors fournir leur code).
 * Les comptes sont créés manuellement ou depuis l'onglet Équipe (pas d'auto-inscription).
 */

const REQUIRE_2FA = process.env.ADMIN_REQUIRE_2FA === "true";
const MAX_FAILS = 8;
const WINDOW_MS = 15 * 60 * 1000;

const bodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  totpCode: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  const { password, totpCode } = parsed.data;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const keys = [`login:ip:${ip}`, `login:mail:${email}`];
  if (keys.some((k) => tooManyAttempts(k, MAX_FAILS * (k.includes(":ip:") ? 2 : 1), WINDOW_MS))) {
    return NextResponse.json({ error: "Trop d'essais. Réessayez dans quelques minutes." }, { status: 429 });
  }

  const fail = () => {
    keys.forEach(recordAttempt);
    // Réponse identique en cas d'e-mail inconnu ou de mot de passe faux, pour ne pas révéler quels comptes existent.
    return NextResponse.json({ error: "E-mail ou mot de passe incorrect." }, { status: 401 });
  };

  const staff = await prisma.staffUser.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (!staff || !staff.isActive) return fail();
  if (!(await verifyPassword(password, staff.passwordHash))) return fail();

  if (REQUIRE_2FA) {
    if (!staff.totpEnabled || !staff.totpSecret) {
      return NextResponse.json({ error: "La double authentification doit être activée pour ce compte." }, { status: 403 });
    }
    if (!totpCode || !verifyTotpCode(staff.totpSecret, totpCode)) return fail();
  }

  keys.forEach(clearAttempts);
  await prisma.staffUser.update({ where: { id: staff.id }, data: { lastLoginAt: new Date() } });
  await prisma.auditLog.create({
    data: { staffUserId: staff.id, action: "staff.login", targetType: "StaffUser", targetId: staff.id },
  });

  const res = NextResponse.json({ ok: true, role: staff.role });
  res.cookies.set("staff_session", signStaffSession({ sub: staff.id, role: staff.role }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
