import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/require-owner";
import { itemSchema } from "@/lib/carte-schemas";

export async function POST(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;

  const parsed = itemSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });
  const d = parsed.data;

  const last = await prisma.menuItem.findFirst({ where: { categoryId: d.categoryId }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  const item = await prisma.menuItem.create({
    data: {
      categoryId: d.categoryId, name: d.name, description: d.description || null,
      isAvailable: d.isAvailable, isVegetarian: d.isVegetarian, isSpicy: d.isSpicy, isNew: d.isNew, isSpecialty: d.isSpecialty,
      capacityWeight: d.capacityWeight, sortOrder: (last?.sortOrder ?? -1) + 1,
      sizes: { create: d.sizes.map((s) => ({ label: s.label, priceCents: s.priceCents })) },
      ingredients: { create: d.ingredientIds.map((ingredientId) => ({ ingredientId })) },
    },
    select: { id: true },
  });
  await prisma.auditLog.create({ data: { staffUserId: auth.staff.sub, action: "menu_item.created", targetType: "MenuItem", targetId: item.id, metadata: { name: d.name } } });
  return NextResponse.json({ id: item.id });
}
