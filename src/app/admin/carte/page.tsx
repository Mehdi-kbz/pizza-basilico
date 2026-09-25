import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";
import { AdminShell } from "../AdminShell";
import { CarteAdmin } from "./CarteAdmin";

export const dynamic = "force-dynamic";

export default async function AdminCartePage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");

  if (staff.role !== "OWNER") {
    return (
      <AdminShell current="carte" title="Carte & prix">
        <div className="card p-7"><p className="display text-xl">Réservé au propriétaire.</p><p className="mt-2 text-sm text-fg-dim">Pour marquer une rupture, utilisez l&rsquo;onglet Disponibilité.</p></div>
      </AdminShell>
    );
  }

  const [categories, ingredients] = await Promise.all([
    prisma.menuCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: { items: { orderBy: [{ sortOrder: "asc" }, { id: "asc" }], include: { sizes: { orderBy: { priceCents: "asc" } }, ingredients: { select: { ingredientId: true } } } } },
    }),
    prisma.ingredient.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { usedIn: true } } } }),
  ]);

  return (
    <AdminShell current="carte" wide title="Carte & prix" subtitle="Articles, tailles et prix, ingrédients, suppléments et catégories. Les changements sont visibles tout de suite sur le site.">
      <CarteAdmin
        categories={categories.map((c) => ({
          id: c.id, name: c.name,
          items: c.items.map((i) => ({
            id: i.id, categoryId: i.categoryId, name: i.name, description: i.description, isAvailable: i.isAvailable,
            isVegetarian: i.isVegetarian, isSpicy: i.isSpicy, isNew: i.isNew, isSpecialty: i.isSpecialty, capacityWeight: i.capacityWeight,
            sizes: i.sizes.map((s) => ({ id: s.id, label: s.label, priceCents: s.priceCents })),
            ingredientIds: i.ingredients.map((x) => x.ingredientId),
          })),
        }))}
        ingredients={ingredients.map((g) => ({ id: g.id, name: g.name, isSupplement: g.isSupplement, priceCents: g.priceCents, allergenTags: g.allergenTags, usedIn: g._count.usedIn }))}
      />
    </AdminShell>
  );
}
