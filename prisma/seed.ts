/**
 * Données initiales — menu réel de Pizza Basilico (cahier des spécifications, Annexe A).
 * Usage : npx tsx prisma/seed.ts
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";

const ingredientCache = new Map<string, string>();

/** Trouve ou crée un ingrédient par son nom (réutilisé à la fois comme composant de recette et comme supplément). */
async function ing(name: string, opts: { supplementPriceCents?: number } = {}) {
  const cached = ingredientCache.get(name);
  if (cached) return cached;

  const existing = await prisma.ingredient.findUnique({ where: { name } });
  if (existing) {
    ingredientCache.set(name, existing.id);
    if (opts.supplementPriceCents !== undefined && !existing.isSupplement) {
      await prisma.ingredient.update({
        where: { id: existing.id },
        data: { isSupplement: true, priceCents: opts.supplementPriceCents },
      });
    }
    return existing.id;
  }

  const created = await prisma.ingredient.create({
    data: {
      name,
      isSupplement: opts.supplementPriceCents !== undefined,
      priceCents: opts.supplementPriceCents ?? 0,
      allergenTags: [], // à compléter par le client — voir cahier des spécifications §5.5
    },
  });
  ingredientCache.set(name, created.id);
  return created.id;
}

async function category(name: string, sortOrder: number) {
  return prisma.menuCategory.upsert({
    where: { id: `seed-cat-${sortOrder}` },
    update: { name, sortOrder },
    create: { id: `seed-cat-${sortOrder}`, name, sortOrder },
  });
}

interface SizeInput {
  label: string;
  priceCents: number;
}

async function menuItem(opts: {
  categoryId: string;
  name: string;
  description?: string;
  sizes: SizeInput[];
  ingredients: string[];
  capacityWeight?: number;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isNew?: boolean;
  isSpecialty?: boolean;
  sortOrder?: number;
}) {
  const item = await prisma.menuItem.create({
    data: {
      categoryId: opts.categoryId,
      name: opts.name,
      description: opts.description,
      capacityWeight: opts.capacityWeight ?? 1,
      isVegetarian: opts.isVegetarian ?? false,
      isSpicy: opts.isSpicy ?? false,
      isNew: opts.isNew ?? false,
      isSpecialty: opts.isSpecialty ?? false,
      sortOrder: opts.sortOrder ?? 0,
      sizes: { create: opts.sizes },
    },
  });

  for (const name of opts.ingredients) {
    const ingredientId = await ing(name);
    await prisma.menuItemIngredient.create({
      data: { menuItemId: item.id, ingredientId, isFixed: true },
    });
  }

  return item;
}

async function main() {
  console.log("Nettoyage des données de menu existantes…");
  await prisma.menuItemIngredient.deleteMany();
  await prisma.menuItemSize.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.ingredient.deleteMany();

  const catTomate = await category("Pizzas base tomate", 1);
  const catCreme = await category("Pizzas base crème", 2);
  const catPanuozzo = await category("Panuozzo", 3);
  const catSpecialites = await category("Spécialités", 4);
  const catPlaque = await category("Plaque Pizza", 5);
  const catBoissons = await category("Boissons", 6);
  const catDesserts = await category("Desserts", 7);

  // ---- Suppléments universels (§5.2) ----
  await ing("Mozzarella", { supplementPriceCents: 100 });
  await ing("Burrata", { supplementPriceCents: 300 });
  await ing("Jambon", { supplementPriceCents: 200 });
  await ing("Poulet", { supplementPriceCents: 200 });
  await ing("Chorizo", { supplementPriceCents: 200 });
  await ing("Œuf", { supplementPriceCents: 100 });
  await ing("Parmesan", { supplementPriceCents: 100 });
  await ing("Légumes", { supplementPriceCents: 100 });

  // ---- Pizzas base tomate ----
  await menuItem({
    categoryId: catTomate.id,
    name: "Margherita",
    ingredients: ["Sauce tomate", "Mozzarella", "Basilic frais"],
    sizes: [{ label: "31 cm", priceCents: 1100 }],
    isVegetarian: true,
    sortOrder: 1,
  });
  await menuItem({
    categoryId: catTomate.id,
    name: "Végétarienne",
    ingredients: ["Sauce tomate", "Mozzarella", "Poivrons", "Champignons", "Tomates cerises"],
    sizes: [
      { label: "26 cm", priceCents: 1150 },
      { label: "31 cm", priceCents: 1350 },
    ],
    isVegetarian: true,
    sortOrder: 2,
  });
  await menuItem({
    categoryId: catTomate.id,
    name: "Capricciosa",
    ingredients: ["Sauce tomate", "Mozzarella", "Jambon", "Champignons", "Olives"],
    sizes: [
      { label: "26 cm", priceCents: 1150 },
      { label: "31 cm", priceCents: 1350 },
    ],
    sortOrder: 3,
  });
  await menuItem({
    categoryId: catTomate.id,
    name: "Occitanie",
    ingredients: ["Sauce tomate", "Mozzarella", "Chorizo", "Poivrons", "Olives"],
    sizes: [
      { label: "26 cm", priceCents: 1150 },
      { label: "31 cm", priceCents: 1350 },
    ],
    isSpicy: true,
    sortOrder: 4,
  });
  await menuItem({
    categoryId: catTomate.id,
    name: "Chicken",
    ingredients: ["Sauce tomate", "Mozzarella", "Poulet", "Oignons", "Poivrons"],
    sizes: [
      { label: "26 cm", priceCents: 1150 },
      { label: "31 cm", priceCents: 1350 },
    ],
    sortOrder: 5,
  });
  await menuItem({
    categoryId: catTomate.id,
    name: "Thon",
    ingredients: ["Sauce tomate", "Mozzarella", "Thon", "Câpres", "Oignon", "Olives", "Basilic frais"],
    sizes: [
      { label: "26 cm", priceCents: 1150 },
      { label: "31 cm", priceCents: 1350 },
    ],
    sortOrder: 6,
  });
  await menuItem({
    categoryId: catTomate.id,
    name: "Napolitaine",
    ingredients: ["Sauce tomate", "Mozzarella", "Anchois", "Câpres", "Olives", "Origan"],
    sizes: [
      { label: "26 cm", priceCents: 1150 },
      { label: "31 cm", priceCents: 1350 },
    ],
    sortOrder: 7,
  });
  await menuItem({
    categoryId: catTomate.id,
    name: "Calzone",
    ingredients: ["Sauce tomate", "Mozzarella", "Jambon", "Champignons", "Œuf"],
    sizes: [{ label: "31 cm", priceCents: 1200 }],
    sortOrder: 8,
  });

  // ---- Pizzas base crème ----
  await menuItem({
    categoryId: catCreme.id,
    name: "Chèvre-miel",
    ingredients: ["Crème", "Mozzarella", "Chèvre", "Miel"],
    sizes: [
      { label: "26 cm", priceCents: 1150 },
      { label: "31 cm", priceCents: 1350 },
    ],
    isVegetarian: true,
    sortOrder: 1,
  });
  await menuItem({
    categoryId: catCreme.id,
    name: "Saumon",
    ingredients: ["Crème", "Saumon", "Champignons", "Persillade citron"],
    sizes: [
      { label: "26 cm", priceCents: 1200 },
      { label: "31 cm", priceCents: 1400 },
    ],
    sortOrder: 2,
  });
  await menuItem({
    categoryId: catCreme.id,
    name: "Quatre fromages",
    ingredients: ["Crème", "Mozzarella", "Chèvre", "Reblochon", "Gorgonzola", "Parmesan"],
    sizes: [
      { label: "26 cm", priceCents: 1200 },
      { label: "31 cm", priceCents: 1400 },
    ],
    isVegetarian: true,
    sortOrder: 3,
  });
  await menuItem({
    categoryId: catCreme.id,
    name: "Roquette",
    ingredients: ["Crème", "Mozzarella", "Roquette", "Parmesan", "Tomates cerises"],
    sizes: [
      { label: "26 cm", priceCents: 1150 },
      { label: "31 cm", priceCents: 1350 },
    ],
    isVegetarian: true,
    sortOrder: 4,
  });
  await menuItem({
    categoryId: catCreme.id,
    name: "Ricotta",
    ingredients: ["Crème", "Champignons", "Tomates cerises", "Ricotta", "Parmesan"],
    sizes: [
      { label: "26 cm", priceCents: 1150 },
      { label: "31 cm", priceCents: 1350 },
    ],
    isVegetarian: true,
    sortOrder: 5,
  });
  await menuItem({
    categoryId: catCreme.id,
    name: "Lardons",
    ingredients: ["Crème", "Mozzarella", "Reblochon", "Lardons", "Oignons", "Œuf"],
    sizes: [
      { label: "26 cm", priceCents: 1150 },
      { label: "31 cm", priceCents: 1350 },
    ],
    sortOrder: 6,
  });

  // ---- Panuozzo (même four à bois que les pizzas — §6.3) ----
  await menuItem({
    categoryId: catPanuozzo.id,
    name: "Panuozzo Classique",
    ingredients: ["Mozzarella", "Jambon", "Reblochon", "Roquette"],
    sizes: [{ label: "Taille unique", priceCents: 1100 }],
    sortOrder: 1,
  });
  await menuItem({
    categoryId: catPanuozzo.id,
    name: "Panuozzo Poulet",
    ingredients: ["Mozzarella", "Poulet", "Oignons", "Poivrons", "Roquette"],
    sizes: [{ label: "Taille unique", priceCents: 1100 }],
    sortOrder: 2,
  });
  await menuItem({
    categoryId: catPanuozzo.id,
    name: "Panuozzo Végétarien",
    ingredients: ["Mozzarella", "Champignons", "Poivrons", "Tomates cerises", "Roquette"],
    sizes: [{ label: "Taille unique", priceCents: 1100 }],
    isVegetarian: true,
    sortOrder: 3,
  });
  await menuItem({
    categoryId: catPanuozzo.id,
    name: "Panuozzo Stracciatella",
    ingredients: ["Sauce pesto", "Stracciatella", "Bœuf séché", "Tomates cerises", "Pignons de pin"],
    sizes: [{ label: "Taille unique", priceCents: 1100 }],
    isNew: true,
    sortOrder: 4,
  });

  // ---- Spécialités ----
  await menuItem({
    categoryId: catSpecialites.id,
    name: "Pizza à la truffe",
    description: "La plus demandée",
    ingredients: ["Base crème", "Truffe", "Mozzarella", "Jambon", "Champignons", "Roquette", "Parmesan", "Basilic frais"],
    sizes: [
      { label: "26 cm", priceCents: 1250 },
      { label: "31 cm", priceCents: 1450 },
    ],
    isSpecialty: true,
    sortOrder: 1,
  });
  await menuItem({
    categoryId: catSpecialites.id,
    name: "Pizza Bambino",
    description: "Pour les enfants",
    ingredients: ["Sauce tomate", "Mozzarella", "Jambon"],
    sizes: [{ label: "Taille unique", priceCents: 750 }],
    sortOrder: 2,
  });
  await menuItem({
    categoryId: catSpecialites.id,
    name: "Pistacchio",
    ingredients: ["Sauce pistache", "Mozzarella", "Jambon", "Roquette", "Pistaches concassées"],
    sizes: [
      { label: "26 cm", priceCents: 1250 },
      { label: "31 cm", priceCents: 1450 },
    ],
    isNew: true,
    sortOrder: 3,
  });
  await menuItem({
    categoryId: catSpecialites.id,
    name: "Bresaola",
    ingredients: ["Sauce pesto de basilic", "Mozzarella", "Champignons", "Bœuf séché", "Roquette", "Parmesan"],
    sizes: [
      { label: "26 cm", priceCents: 1250 },
      { label: "31 cm", priceCents: 1450 },
    ],
    isNew: true,
    sortOrder: 4,
  });

  // ---- Plaque Pizza (poids de préparation = 3, cf. §6.3) ----
  await menuItem({
    categoryId: catPlaque.id,
    name: "Plaque Pizza",
    description: "60 cm — 6 à 8 personnes",
    ingredients: ["Sauce tomate", "Mozzarella"],
    sizes: [{ label: "60 cm", priceCents: 4000 }],
    capacityWeight: 3,
    sortOrder: 1,
  });

  // ---- Boissons & Desserts (hors capacité four — §6.3) ----
  const drink = async (name: string, priceCents: number, sortOrder: number) =>
    menuItem({
      categoryId: catBoissons.id,
      name,
      ingredients: [],
      sizes: [{ label: "Unique", priceCents }],
      capacityWeight: 0,
      sortOrder,
    });
  await drink("Eau minérale", 150, 1);
  await drink("Soda en canette", 200, 2);
  await drink("Limonade italienne (citron/orange/pêche)", 300, 3);

  const dessert = async (name: string, priceCents: number, sortOrder: number) =>
    menuItem({
      categoryId: catDesserts.id,
      name,
      description: "Fait maison",
      ingredients: [],
      sizes: [{ label: "Unique", priceCents }],
      capacityWeight: 0,
      sortOrder,
    });
  await dessert("Salade de fruits", 450, 1);
  await dessert("Tiramisu", 450, 2);

  console.log("Menu initial chargé avec succès.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
