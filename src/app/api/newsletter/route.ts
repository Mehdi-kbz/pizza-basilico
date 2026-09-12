import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/**
 * Inscription newsletter (§11.4) — consentement explicite, valide 3 ans
 * (recommandation CNIL, §12.2), reconfirmation demandée ensuite.
 */
const THREE_YEARS_MS = 3 * 365 * 24 * 60 * 60 * 1000;

const bodySchema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "E-mail invalide." }, { status: 400 });

  const customer = await prisma.customer.upsert({
    where: { email: parsed.data.email },
    update: {},
    create: { email: parsed.data.email },
  });

  await prisma.newsletterConsent.upsert({
    where: { customerId: customer.id },
    update: { consentAt: new Date(), expiresAt: new Date(Date.now() + THREE_YEARS_MS), unsubscribedAt: null },
    create: { customerId: customer.id, expiresAt: new Date(Date.now() + THREE_YEARS_MS) },
  });

  return NextResponse.json({ ok: true });
}
