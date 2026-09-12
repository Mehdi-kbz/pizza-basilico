/**
 * Disponibilité en cascade du menu (§5.4). `MenuItem.isAvailable` est le
 * bouton manuel du personnel ; la disponibilité *effective* combine ce bouton
 * avec l'état de chaque ingrédient "fixe" (composant non retirable) de la
 * recette — calculée à la lecture, jamais écrite en dur sur l'article, pour
 * qu'une réactivation d'ingrédient ne réactive jamais un article désactivé
 * pour une autre raison, et inversement.
 */

interface IngredientLink {
  isFixed: boolean;
  ingredient: { isAvailable: boolean; name: string };
}

interface AvailabilityInput {
  isAvailable: boolean;
  ingredients: IngredientLink[];
}

export function isEffectivelyAvailable(item: AvailabilityInput): boolean {
  if (!item.isAvailable) return false;
  return item.ingredients.every((link) => !link.isFixed || link.ingredient.isAvailable);
}

/** Nom du premier ingrédient fixe manquant, pour affichage admin ("masqué car : Mozzarella"). */
export function missingFixedIngredient(item: AvailabilityInput): string | null {
  const missing = item.ingredients.find((link) => link.isFixed && !link.ingredient.isAvailable);
  return missing?.ingredient.name ?? null;
}
