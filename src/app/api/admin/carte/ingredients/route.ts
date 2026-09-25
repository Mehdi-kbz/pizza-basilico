import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/require-owner";
import { ingredientSchema } from "@/lib/carte-schemas";

export async function POST(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  const parsed = ingredientSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  try {
    const ing = await prisma.ingredient.create({ data: parsed.data });
    return NextResponse.json({ id: ing.id });
  } catch {
    return NextResponse.json({ error: "Un ingrédient porte déjà ce nom." }, { status: 409 });
  }
}
