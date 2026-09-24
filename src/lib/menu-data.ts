import { prisma } from "@/lib/prisma";
import { isEffectivelyAvailable } from "@/lib/menu-availability";

/** Données de la carte au format attendu par les composants clients (accueil + /carte). */
export async function getMenuData() {
  const now = new Date();

  const [categoriesRaw, supplements, sessions] = await Promise.all([
    prisma.menuCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: { sizes: true, ingredients: { include: { ingredient: true } } },
        },
      },
    }),
    prisma.ingredient.findMany({ where: { isSupplement: true, isAvailable: true }, orderBy: { priceCents: "asc" } }),
    prisma.serviceSession.findMany({
      where: { endAt: { gt: now } },
      orderBy: { startAt: "asc" },
      take: 4,
      include: { location: true },
    }),
  ]);

  const categories = categoriesRaw
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      items: cat.items.filter(isEffectivelyAvailable).map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        isVegetarian: item.isVegetarian,
        isSpicy: item.isSpicy,
        isNew: item.isNew,
        isSpecialty: item.isSpecialty,
        ingredients: item.ingredients.map((l) => ({ id: l.ingredient.id, name: l.ingredient.name })),
        sizes: item.sizes.map((s) => ({ id: s.id, label: s.label, priceCents: s.priceCents })),
      })),
    }))
    .filter((c) => c.items.length > 0);

  const openSession = sessions.find((s) => s.isOrderingOpen && s.startAt <= now) ?? sessions.find((s) => s.isOrderingOpen);

  return {
    categories,
    supplements: supplements.map((s) => ({ id: s.id, name: s.name, priceCents: s.priceCents })),
    sessions,
    orderHref: openSession ? `/commander/${openSession.id}` : "/#nous-trouver",
    hasOpenSession: !!openSession,
  };
}
