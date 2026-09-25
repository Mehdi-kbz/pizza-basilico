import { NextResponse } from "next/server";
import { z } from "zod";
import { getLoyaltyStatus, STAMPS_REQUIRED_FOR_FREE_ITEM } from "@/lib/loyalty";
import { accountState } from "@/lib/customer-auth";
import { getCustomerSession } from "@/lib/require-customer";
import { tooManyAttempts, recordAttempt } from "@/lib/rate-limit";

const querySchema = z.object({ email: z.string().trim().email() });

/**
 * Tampons + état du compte pour un e-mail saisi dans le tunnel de commande.
 * Le nombre de tampons est visible pour n'importe quel e-mail (choix assumé) ;
 * on limite le débit par adresse IP pour éviter le moissonnage d'adresses.
 */
export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `loyalty:${ip}`;
  if (tooManyAttempts(key, 40, 60_000)) return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  recordAttempt(key);

  const parsed = querySchema.safeParse({ email: new URL(req.url).searchParams.get("email") });
  if (!parsed.success) return NextResponse.json({ error: "E-mail invalide." }, { status: 400 });
  const email = parsed.data.email;

  const [status, acct, session] = await Promise.all([getLoyaltyStatus(email), accountState(email), getCustomerSession()]);
  const loggedIn = !!session && !!acct.customer && session.sub === acct.customer.id && acct.verified;

  return NextResponse.json({
    ...status,
    stampsRequired: STAMPS_REQUIRED_FOR_FREE_ITEM,
    account: acct.state, // "none" (jamais commandé) | "guest" (a commandé, sans mot de passe) | "password"
    verified: acct.verified,
    loggedIn,
  });
}
