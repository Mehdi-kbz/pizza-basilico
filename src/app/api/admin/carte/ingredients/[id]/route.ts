import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/require-owner";
import { ingredientSchema } from "@/lib/carte-schemas";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  const parsed = ingredientSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  const { id } = await params;
  try {
    await prisma.ingredient.update({ where: { id }, data: parsed.data });
    await prisma.auditLog.create({ data: { staffUserId: auth.staff.sub, action: "ingredient.updated", targetType: "Ingredient", targetId: id, metadata: { name: parsed.data.name, priceCents: parsed.data.priceCents } } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Un ingrédient porte déjà ce nom." }, { status: 409 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const [recipes, orders] = await Promise.all([
    prisma.menuItemIngredient.count({ where: { ingredientId: id } }),
    prisma.orderItemIngredient.count({ where: { ingredientId: id } }),
  ]);
  if (recipes > 0) return NextResponse.json({ error: `Cet ingrédient est utilisé dans ${recipes} recette(s) : retirez-le des articles d'abord.` }, { status: 409 });
  if (orders > 0) return NextResponse.json({ error: "Cet ingrédient figure dans des commandes passées : marquez-le en rupture plutôt que de le supprimer." }, { status: 409 });
  await prisma.ingredient.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
