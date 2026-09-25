import { prisma } from "@/lib/prisma";
import { isEffectivelyAvailable } from "@/lib/menu-availability";

/**
 * Calcul et validation du panier — revalidation serveur systématique des prix,
 * de la disponibilité et du poids de capacité au moment du paiement (§5.4, §6.3).
 * Ne jamais faire confiance à un prix envoyé par le client.
 */

export interface CartItemInput {
  menuItemId: string;
  sizeId: string;
  quantity: number;
  addedIngredientIds?: string[];
  removedIngredientIds?: string[];
  note?: string;
}

export interface PricedLine {
  menuItemId: string;
  menuItemName: string;
  sizeId: string;
  quantity: number;
  unitPriceCents: number;
  capacityWeight: number;
  addedIngredientIds: string[];
  removedIngredientIds: string[];
  note: string | null;
  lineTotalCents: number;
}

export class CartValidationError extends Error {}

export async function priceCart(items: CartItemInput[]): Promise<{
  lines: PricedLine[];
  subtotalCents: number;
  totalUnits: number;
  pizzaCount: number;
}> {
  if (items.length === 0) throw new CartValidationError("Le panier est vide.");

  const lines: PricedLine[] = [];
  let subtotalCents = 0;
  let totalUnits = 0;
  let pizzaCount = 0;

  for (const item of items) {
    if (item.quantity < 1) throw new CartValidationError("Quantité invalide.");

    const menuItem = await prisma.menuItem.findUnique({
      where: { id: item.menuItemId },
      include: { sizes: true, ingredients: { include: { ingredient: true } } },
    });
    if (!menuItem || !isEffectivelyAvailable(menuItem)) {
      throw new CartValidationError(`« ${menuItem?.name ?? item.menuItemId} » n'est plus disponible.`);
    }

    const size = menuItem.sizes.find((s) => s.id === item.sizeId);
    if (!size) throw new CartValidationError(`Taille invalide pour « ${menuItem.name} ».`);

    let unitPriceCents = size.priceCents;

    const addedIngredientIds = item.addedIngredientIds ?? [];
    for (const ingredientId of addedIngredientIds) {
      const ingredient = await prisma.ingredient.findUnique({ where: { id: ingredientId } });
      if (!ingredient || !ingredient.isSupplement || !ingredient.isAvailable) {
        throw new CartValidationError(
          `Le supplément « ${ingredient?.name ?? ingredientId} » n'est plus disponible.`
        );
      }
      unitPriceCents += ingredient.priceCents;
    }

    // Un ingrédient retiré doit faire partie de la recette : on ne fait pas confiance au client.
    const removedIngredientIds = [...new Set(item.removedIngredientIds ?? [])];
    const recipeIds = new Set(menuItem.ingredients.map((l) => l.ingredientId));
    for (const ingredientId of removedIngredientIds) {
      if (!recipeIds.has(ingredientId)) {
        throw new CartValidationError(`Un ingrédient retiré ne fait pas partie de « ${menuItem.name} ».`);
      }
    }
    const note = item.note?.trim().slice(0, 140) || null;

    const lineTotalCents = unitPriceCents * item.quantity;
    subtotalCents += lineTotalCents;
    totalUnits += menuItem.capacityWeight * item.quantity;
    if (menuItem.capacityWeight > 0) pizzaCount += item.quantity; // boissons/desserts : poids 0

    lines.push({
      menuItemId: menuItem.id,
      menuItemName: menuItem.name,
      sizeId: size.id,
      quantity: item.quantity,
      unitPriceCents,
      capacityWeight: menuItem.capacityWeight,
      addedIngredientIds,
      removedIngredientIds,
      note,
      lineTotalCents,
    });
  }

  return { lines, subtotalCents, totalUnits, pizzaCount };
}

export async function applyPromoCode(code: string | undefined, subtotalCents: number) {
  if (!code) return { discountCents: 0, promoCodeId: null as string | null };

  const promo = await prisma.promoCode.findFirst({ where: { code: { equals: code.trim(), mode: "insensitive" } } });
  if (!promo || !promo.isActive) throw new CartValidationError("Code promo invalide.");
  if (promo.expiresAt && promo.expiresAt < new Date()) throw new CartValidationError("Code promo expiré.");
  if (promo.maxUses !== null && promo.usesCount >= promo.maxUses) {
    throw new CartValidationError("Code promo épuisé.");
  }

  const discountCents =
    promo.kind === "PERCENT" ? Math.round((subtotalCents * promo.value) / 100) : promo.value;

  return { discountCents: Math.min(discountCents, subtotalCents), promoCodeId: promo.id };
}
