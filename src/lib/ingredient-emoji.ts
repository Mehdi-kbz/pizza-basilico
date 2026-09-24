/**
 * Un emoji par ingrédient, pour rendre la carte et la personnalisation plus lisibles.
 * Recherche par mot-clé (sans accents) : un nouvel ingrédient ajouté en admin
 * tombe sur 🍽️ tant qu'on ne lui a pas donné de mot-clé ici.
 */
const RULES: [RegExp, string][] = [
  [/pesto|basilic|origan|persil|herbe/, "🌿"],
  [/tomate|sauce tomate/, "🍅"],
  [/mozzarella|burrata|stracciatella|ricotta|fromage/, "🧀"],
  [/parmesan|gorgonzola|reblochon|chevre|emmental/, "🧀"],
  [/creme/, "🥛"],
  [/miel/, "🍯"],
  [/jambon|lardon|bresaola|boeuf|chorizo|saucisse|charcuterie|pepperoni/, "🥓"],
  [/poulet|chicken/, "🍗"],
  [/thon|saumon|anchois|poisson/, "🐟"],
  [/champignon/, "🍄"],
  [/truffe/, "🍄"],
  [/olive/, "🫒"],
  [/oignon/, "🧅"],
  [/poivron|piment/, "🫑"],
  [/roquette|salade|legume|epinard/, "🥬"],
  [/\boeuf/, "🥚"],
  [/capre/, "🫒"],
  [/pistache|pignon|noix/, "🥜"],
  [/citron/, "🍋"],
  [/orange/, "🍊"],
  [/peche/, "🍑"],
];

const normalize = (s: string) =>
  s
    .replace(/œ/gi, "oe")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function ingredientEmoji(name: string): string {
  const n = normalize(name);
  for (const [re, emoji] of RULES) if (re.test(n)) return emoji;
  return "🍽️";
}
