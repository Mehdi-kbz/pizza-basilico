import { NextResponse } from "next/server";
import { z } from "zod";
import { getLoyaltyStatus } from "@/lib/loyalty";

const querySchema = z.object({ email: z.string().email() });

/** Statut de fidélité, consulté par le parcours de commande pour proposer la rédemption (§8). */
export async function GET(req: Request) {
  const parsed = querySchema.safeParse({ email: new URL(req.url).searchParams.get("email") });
  if (!parsed.success) return NextResponse.json({ error: "E-mail invalide." }, { status: 400 });

  const status = await getLoyaltyStatus(parsed.data.email);
  return NextResponse.json(status);
}
