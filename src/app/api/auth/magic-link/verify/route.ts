import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashMagicLinkToken, signCustomerSession } from "@/lib/auth";

/** Consomme un lien magique (usage unique, expire après 15 min) et ouvre la session client. */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const base = process.env.PUBLIC_URL ?? new URL(req.url).origin;
  if (!token) return NextResponse.redirect(`${base}/compte/connexion?erreur=lien_invalide`);

  const tokenHash = hashMagicLinkToken(token);
  const record = await prisma.magicLinkToken.findUnique({ where: { tokenHash }, include: { customer: true } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return NextResponse.redirect(`${base}/compte/connexion?erreur=lien_expire`);
  }

  await prisma.$transaction([
    prisma.magicLinkToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.customer.update({ where: { id: record.customerId }, data: { hasAccount: true } }),
  ]);

  const session = signCustomerSession({ sub: record.customer.id, email: record.customer.email });
  const res = NextResponse.redirect(`${base}/compte`);
  res.cookies.set("customer_session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
