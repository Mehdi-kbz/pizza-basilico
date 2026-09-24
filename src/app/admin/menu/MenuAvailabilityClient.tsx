"use client";

import { useEffect, useState, useCallback } from "react";

interface ItemView {
  id: string;
  name: string;
  isAvailable: boolean;
  effectivelyAvailable: boolean;
  missingIngredient: string | null;
}
interface CategoryView {
  id: string;
  name: string;
  items: ItemView[];
}
interface IngredientView {
  id: string;
  name: string;
  isSupplement: boolean;
  isAvailable: boolean;
}

export function MenuAvailabilityClient() {
  const [categories, setCategories] = useState<CategoryView[]>([]);
  const [ingredients, setIngredients] = useState<IngredientView[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/menu");
    if (res.ok) {
      const data = await res.json();
      setCategories(data.categories);
      setIngredients(data.ingredients);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(kind: "item" | "ingredient", id: string, isAvailable: boolean) {
    await fetch("/api/admin/menu/toggle", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id, isAvailable }),
    });
    load();
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="font-semibold mb-3">Ingrédients & suppléments</h2>
        <div className="flex flex-wrap gap-2">
          {ingredients.map((ing) => (
            <button
              key={ing.id}
              onClick={() => toggle("ingredient", ing.id, !ing.isAvailable)}
              className={`text-sm rounded-full border px-3 py-1.5 ${
                ing.isAvailable ? "border-line bg-surface-3" : "border-tomato bg-tomato text-fg"
              }`}
            >
              {ing.name}
              {ing.isSupplement && <span className="opacity-60"> (supplément)</span>}
              {!ing.isAvailable && " — en rupture"}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Articles du menu</h2>
        <div className="flex flex-col gap-5">
          {categories.map((cat) => (
            <div key={cat.id}>
              <h3 className="text-sm font-medium text-fg-dim mb-2">{cat.name}</h3>
              <ul className="flex flex-col gap-1.5">
                {cat.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between border border-line rounded px-3 py-2 bg-surface text-sm"
                  >
                    <span>
                      {item.name}
                      {!item.effectivelyAvailable && item.isAvailable && item.missingIngredient && (
                        <span className="text-tomato text-xs ml-2">
                          masqué automatiquement — {item.missingIngredient} indisponible
                        </span>
                      )}
                    </span>
                    <button
                      onClick={() => toggle("item", item.id, !item.isAvailable)}
                      className={`text-xs rounded px-2.5 py-1 border ${
                        item.isAvailable ? "border-line" : "border-tomato bg-tomato text-fg"
                      }`}
                    >
                      {item.isAvailable ? "Désactiver" : "Réactiver"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
