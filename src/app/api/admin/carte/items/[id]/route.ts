import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/require-owner";
import { itemSchema } from "@/lib/carte-schemas";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const parsed = itemSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });
  const d = parsed.data;

  const existing = await prisma.menuItem.findUnique({ where: { id }, include: { sizes: { select: { id: true } } } });
  if (!existing) return NextResponse.json({ error: "Article introuvable." }, { status: 404 });

  const keepIds = new Set(d.sizes.filter((s) => s.id && existing.sizes.some((e) => e.id === s.id)).map((s) => s.id!));

  await prisma.$transaction([
    prisma.menuItem.update({
      where: { id },
      data: {
        categoryId: d.categoryId, name: d.name, description: d.description || null,
        isAvailable: d.isAvailable, isVegetarian: d.isVegetarian, isSpicy: d.isSpicy, isNew: d.isNew, isSpecialty: d.isSpecialty,
        capacityWeight: d.capacityWeight,
      },
    }),
    // Tailles : mises à jour sur place (les commandes passées gardent leur prix figé), retrait des supprimées, création des nouvelles.
    prisma.menuItemSize.deleteMany({ where: { menuItemId: id, id: { notIn: [...keepIds] } } }),
    ...d.sizes.filter((s) => s.id && keepIds.has(s.id)).map((s) => prisma.menuItemSize.update({ where: { id: s.id! }, data: { label: s.label, priceCents: s.priceCents } })),
    ...d.sizes.filter((s) => !s.id || !keepIds.has(s.id)).map((s) => prisma.menuItemSize.create({ data: { menuItemId: id, label: s.label, priceCents: s.priceCents } })),
    // Recette : on conserve les liens existants (et leur réglage « ingrédient fixe »), on retire / ajoute seulement la différence.
    prisma.menuItemIngredient.deleteMany({ where: { menuItemId: id, ingredientId: { notIn: d.ingredientIds } } }),
    prisma.menuItemIngredient.createMany({ data: d.ingredientIds.map((ingredientId) => ({ menuItemId: id, ingredientId })), skipDuplicates: true }),
  ]);
  await prisma.auditLog.create({ data: { staffUserId: auth.staff.sub, action: "menu_item.updated", targetType: "MenuItem", targetId: id, metadata: { name: d.name } } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const used = await prisma.orderItem.count({ where: { menuItemId: id } });
  if (used > 0) {
    return NextResponse.json({ error: `Cet article figure dans ${used} ligne(s) de commande passées : désactivez-le plutôt que de le supprimer.` }, { status: 409 });
  }
  await prisma.menuItem.delete({ where: { id } }).catch(() => null);
  await prisma.auditLog.create({ data: { staffUserId: auth.staff.sub, action: "menu_item.deleted", targetType: "MenuItem", targetId: id } });
  return NextResponse.json({ ok: true });
}
