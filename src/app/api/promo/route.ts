import { NextResponse } from "next/server";
import { z } from "zod";
import { applyPromoCode, CartValidationError } from "@/lib/cart";

const bodySchema = z.object({ code: z.string().trim().min(1).max(40), subtotalCents: z.number().int().min(0) });

/**
 * Aperçu d'un code promo dans le panier. Purement indicatif : la remise réellement
 * appliquée est recalculée côté serveur à la création de la commande.
 */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Code invalide." }, { status: 400 });

  try {
    const { discountCents } = await applyPromoCode(parsed.data.code, parsed.data.subtotalCents);
    return NextResponse.json({ discountCents });
  } catch (e) {
    if (e instanceof CartValidationError) return NextResponse.json({ error: e.message }, { status: 409 });
    throw e;
  }
}
