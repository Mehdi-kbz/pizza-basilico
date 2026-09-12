import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";
import { isEffectivelyAvailable, missingFixedIngredient } from "@/lib/menu-availability";

/** Vue admin du menu — disponibilité manuelle + effective (§5.4). */
export async function GET() {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const categories = await prisma.menuCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: { ingredients: { include: { ingredient: true } } },
      },
    },
  });

  const ingredients = await prisma.ingredient.findMany({ orderBy: { name: "asc" } });

  return NextResponse.json({
    categories: categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      items: cat.items.map((item) => ({
        id: item.id,
        name: item.name,
        isAvailable: item.isAvailable,
        effectivelyAvailable: isEffectivelyAvailable(item),
        missingIngredient: missingFixedIngredient(item),
      })),
    })),
    ingredients: ingredients.map((i) => ({
      id: i.id,
      name: i.name,
      isSupplement: i.isSupplement,
      isAvailable: i.isAvailable,
    })),
  });
}
