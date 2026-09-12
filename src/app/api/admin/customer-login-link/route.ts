import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";
import { generateMagicLinkToken } from "@/lib/auth";

/**
 * Outil support (réservé au personnel) : génère un lien de connexion client
 * sans passer par l'envoi d'e-mail — utile pour aider un client qui n'a pas
 * reçu son lien, ou pour les tests avant que l'envoi d'e-mail réel soit configuré.
 */
const bodySchema = z.object({ email: z.string().email() });
const TOKEN_TTL_MINUTES = 15;

export async function POST(req: Request) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "E-mail invalide." }, { status: 400 });

  const customer = await prisma.customer.upsert({ where: { email: parsed.data.email }, update: {}, create: { email: parsed.data.email } });
  const { raw, hash } = generateMagicLinkToken();
  await prisma.magicLinkToken.create({
    data: { customerId: customer.id, tokenHash: hash, expiresAt: new Date(Date.now() + TOKEN_TTL_MINUTES * 60_000) },
  });

  await prisma.auditLog.create({
    data: { staffUserId: staff.sub, action: "customer.login_link_generated", targetType: "Customer", targetId: customer.id },
  });

  return NextResponse.json({ loginUrl: `${process.env.PUBLIC_URL ?? ""}/api/auth/magic-link/verify?token=${raw}` });
}
