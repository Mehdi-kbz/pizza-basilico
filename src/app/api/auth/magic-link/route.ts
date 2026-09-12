import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateMagicLinkToken } from "@/lib/auth";
import { sendMagicLinkEmail } from "@/lib/email";

/**
 * Demande de lien magique (§3.1/§8) — compte client optionnel, sans mot de
 * passe. Réponse toujours identique que l'e-mail existe ou non (on ne révèle
 * jamais si une adresse a déjà commandé).
 */
const bodySchema = z.object({ email: z.string().email() });
const TOKEN_TTL_MINUTES = 15;

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "E-mail invalide." }, { status: 400 });
  const { email } = parsed.data;

  const customer = await prisma.customer.upsert({ where: { email }, update: {}, create: { email } });
  const { raw, hash } = generateMagicLinkToken();
  await prisma.magicLinkToken.create({
    data: { customerId: customer.id, tokenHash: hash, expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000) },
  });

  const loginUrl = `${process.env.PUBLIC_URL ?? ""}/api/auth/magic-link/verify?token=${raw}`;
  if (process.env.NODE_ENV !== "production") console.log("[dev] lien magique :", loginUrl);
  await sendMagicLinkEmail(email, loginUrl).catch((e) => console.error("Échec d'envoi du lien magique :", e));

  return NextResponse.json({ ok: true });
}
