"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Size { id?: string; label: string; priceCents: number }
interface Item {
  id: string; categoryId: string; name: string; description: string | null; isAvailable: boolean;
  isVegetarian: boolean; isSpicy: boolean; isNew: boolean; isSpecialty: boolean; capacityWeight: number;
  sizes: Size[]; ingredientIds: string[];
}
interface Category { id: string; name: string; items: Item[] }
interface Ingredient { id: string; name: string; isSupplement: boolean; priceCents: number; allergenTags: string[]; usedIn: number }

const eur = (c: number) => (c / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const toEuroInput = (c: number) => (c / 100).toFixed(2).replace(".", ",");
const parseEuro = (v: string) => {
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
};
const ALLERGENS: [string, string][] = [
  ["GLUTEN", "Gluten"], ["CRUSTACES", "Crustacés"], ["OEUFS", "Œufs"], ["POISSON", "Poisson"], ["ARACHIDES", "Arachides"], ["SOJA", "Soja"], ["LAIT", "Lait"],
  ["FRUITS_A_COQUE", "Fruits à coque"], ["CELERI", "Céleri"], ["MOUTARDE", "Moutarde"], ["SESAME", "Sésame"], ["SULFITES", "Sulfites"], ["LUPIN", "Lupin"], ["MOLLUSQUES", "Mollusques"],
];

async function call(method: string, url: string, body?: unknown): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  if (res.ok) return { ok: true };
  return { ok: false, error: (await res.json().catch(() => ({}))).error ?? "Une erreur est survenue." };
}

export function CarteAdmin({ categories, ingredients }: { categories: Category[]; ingredients: Ingredient[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"items" | "ingredients" | "categories">("items");
  const [editing, setEditing] = useState<{ item?: Item; categoryId: string } | null>(null);
  const [editingIng, setEditingIng] = useState<{ ing?: Ingredient } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const done = () => router.refresh();
  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setMsg(null);
    const r = await fn();
    if (!r.ok) setMsg(r.error ?? "Erreur.");
    else done();
    return r;
  }

  return (
    <div>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1" role="tablist">
        {([["items", "Articles"], ["ingredients", "Ingrédients & suppléments"], ["categories", "Catégories"]] as const).map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`chip !text-[0.78rem] !px-4 !py-2 shrink-0 ${tab === k ? "!border-transparent !bg-gradient-to-b !from-flame !to-flame-deep !text-white" : ""}`}>{l}</button>
        ))}
      </div>
      {msg && <p role="alert" className="mb-4 rounded-2xl border-l-4 border-tomato bg-tomato/5 p-3 text-sm text-tomato">{msg}</p>}

      {tab === "items" && (
        <div className="flex flex-col gap-8">
          {categories.map((c) => (
            <section key={c.id}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="display text-xl">{c.name}</h2>
                <button onClick={() => setEditing({ categoryId: c.id })} className="btn btn-ghost !py-2 !px-4 !text-[0.8rem]">+ Article</button>
              </div>
              {c.items.length === 0 ? (
                <p className="text-sm text-fg-faint">Aucun article dans cette catégorie.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {c.items.map((i, idx) => (
                    <li key={i.id} className="card flex items-center gap-3 !rounded-2xl p-3 sm:p-4">
                      <div className="flex flex-col">
                        <button aria-label="Monter" disabled={idx === 0} onClick={() => run(() => call("POST", "/api/admin/carte/reorder", { kind: "item", id: i.id, direction: "up" }))} className="px-1 text-fg-faint enabled:hover:text-ember disabled:opacity-25">▲</button>
                        <button aria-label="Descendre" disabled={idx === c.items.length - 1} onClick={() => run(() => call("POST", "/api/admin/carte/reorder", { kind: "item", id: i.id, direction: "down" }))} className="px-1 text-fg-faint enabled:hover:text-ember disabled:opacity-25">▼</button>
                      </div>
                      <button onClick={() => setEditing({ item: i, categoryId: c.id })} className="min-w-0 flex-1 text-left">
                        <span className="block truncate font-semibold">{i.name}{!i.isAvailable && <span className="ml-2 chip !text-[0.6rem]">Masqué</span>}</span>
                        <span className="block truncate text-xs text-fg-faint">
                          {i.sizes.map((s) => `${s.label} ${eur(s.priceCents)}`).join(" · ")}
                        </span>
                      </button>
                      <button onClick={() => setEditing({ item: i, categoryId: c.id })} className="btn btn-ghost !py-2 !px-4 !text-[0.78rem]">Modifier</button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      {tab === "ingredients" && (
        <div>
          <div className="mb-4 flex justify-end">
            <button onClick={() => setEditingIng({})} className="btn btn-primary !py-2.5 !px-5 !text-[0.85rem]">+ Ingrédient</button>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {ingredients.map((g) => (
              <li key={g.id}>
                <button onClick={() => setEditingIng({ ing: g })} className="card flex w-full items-center gap-3 !rounded-2xl p-3.5 text-left transition-transform hover:-translate-y-0.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{g.name}</span>
                    <span className="block text-xs text-fg-faint">Dans {g.usedIn} recette{g.usedIn > 1 ? "s" : ""}{g.allergenTags.length ? ` · ${g.allergenTags.length} allergène(s)` : ""}</span>
                  </span>
                  {g.isSupplement && <span className="chip chip-flame !text-[0.62rem]">Supplément +{eur(g.priceCents)}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "categories" && (
        <div>
          <ul className="flex flex-col gap-2">
            {categories.map((c, idx) => (
              <li key={c.id} className="card flex items-center gap-3 !rounded-2xl p-3.5">
                <div className="flex flex-col">
                  <button aria-label="Monter" disabled={idx === 0} onClick={() => run(() => call("POST", "/api/admin/carte/reorder", { kind: "category", id: c.id, direction: "up" }))} className="px-1 text-fg-faint enabled:hover:text-ember disabled:opacity-25">▲</button>
                  <button aria-label="Descendre" disabled={idx === categories.length - 1} onClick={() => run(() => call("POST", "/api/admin/carte/reorder", { kind: "category", id: c.id, direction: "down" }))} className="px-1 text-fg-faint enabled:hover:text-ember disabled:opacity-25">▼</button>
                </div>
                <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{c.name}</span><span className="text-xs text-fg-faint">{c.items.length} article{c.items.length > 1 ? "s" : ""}</span></span>
                <button onClick={() => { const name = window.prompt("Nouveau nom de la catégorie", c.name)?.trim(); if (name && name !== c.name) run(() => call("PUT", `/api/admin/carte/categories/${c.id}`, { name })); }} className="text-sm text-ember hover:underline">Renommer</button>
                <button onClick={() => { if (window.confirm(`Supprimer la catégorie « ${c.name} » ?`)) run(() => call("DELETE", `/api/admin/carte/categories/${c.id}`)); }} className="text-sm text-tomato hover:underline">Supprimer</button>
              </li>
            ))}
          </ul>
          <button onClick={() => { const name = window.prompt("Nom de la nouvelle catégorie")?.trim(); if (name) run(() => call("POST", "/api/admin/carte/categories", { name })); }} className="btn btn-primary mt-5 !py-2.5 !px-5 !text-[0.85rem]">+ Catégorie</button>
        </div>
      )}

      {editing && (
        <ItemEditor
          key={editing.item?.id ?? `new-${editing.categoryId}`}
          item={editing.item}
          categoryId={editing.categoryId}
          categories={categories}
          ingredients={ingredients}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); done(); }}
        />
      )}
      {editingIng && (
        <IngredientEditor key={editingIng.ing?.id ?? "new"} ing={editingIng.ing} onClose={() => setEditingIng(null)} onSaved={() => { setEditingIng(null); done(); }} />
      )}
    </div>
  );
}

/* ------------------------------ Fenêtre modale ------------------------------ */

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Fermer" tabIndex={-1} onClick={onClose} className="absolute inset-0 cursor-default bg-[#2b1710]/45 backdrop-blur-sm" />
      <div className="pop-in relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[32px] bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-[32px] sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="display text-2xl">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="grid h-9 w-9 place-items-center rounded-full bg-surface-2">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" aria-pressed={checked} onClick={() => onChange(!checked)} className={`chip !text-[0.75rem] !px-3.5 !py-2 ${checked ? "!border-ember !bg-flame/10 !text-ember" : ""}`}>
      {checked ? "✓ " : ""}{label}
    </button>
  );
}

/* --------------------------------- Article --------------------------------- */

function ItemEditor({ item, categoryId, categories, ingredients, onClose, onSaved }: {
  item?: Item; categoryId: string; categories: Category[]; ingredients: Ingredient[]; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [cat, setCat] = useState(item?.categoryId ?? categoryId);
  const [flags, setFlags] = useState({
    isAvailable: item?.isAvailable ?? true, isVegetarian: item?.isVegetarian ?? false, isSpicy: item?.isSpicy ?? false,
    isNew: item?.isNew ?? false, isSpecialty: item?.isSpecialty ?? false,
  });
  const [weight, setWeight] = useState(String(item?.capacityWeight ?? 1));
  const [sizes, setSizes] = useState<{ id?: string; label: string; price: string }[]>(
    item?.sizes.length ? item.sizes.map((s) => ({ id: s.id, label: s.label, price: toEuroInput(s.priceCents) })) : [{ label: "Taille unique", price: "" }]
  );
  const [selected, setSelected] = useState<Set<string>>(new Set(item?.ingredientIds ?? []));
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const shown = useMemo(() => ingredients.filter((g) => g.name.toLowerCase().includes(filter.toLowerCase())), [ingredients, filter]);

  async function save() {
    setError(null);
    const parsedSizes = sizes.map((s) => ({ id: s.id, label: s.label.trim(), priceCents: parseEuro(s.price) }));
    if (!name.trim()) return setError("Donnez un nom à l'article.");
    if (parsedSizes.some((s) => !s.label || s.priceCents === null)) return setError("Chaque taille doit avoir un nom et un prix valide (ex. 11,50).");
    setSaving(true);
    const body = { categoryId: cat, name: name.trim(), description: description.trim() || null, ...flags, capacityWeight: Number(weight) || 0, sizes: parsedSizes, ingredientIds: [...selected] };
    const r = await call(item ? "PUT" : "POST", item ? `/api/admin/carte/items/${item.id}` : "/api/admin/carte/items", body);
    setSaving(false);
    if (!r.ok) return setError(r.error ?? "Erreur.");
    onSaved();
  }

  async function remove() {
    if (!item || !window.confirm(`Supprimer « ${item.name} » définitivement ?`)) return;
    const r = await call("DELETE", `/api/admin/carte/items/${item.id}`);
    if (!r.ok) return setError(r.error ?? "Erreur.");
    onSaved();
  }

  return (
    <Modal title={item ? "Modifier l'article" : "Nouvel article"} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="i-name" className="mb-1.5 block text-sm font-semibold">Nom</label>
          <input id="i-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </div>
        <div>
          <label htmlFor="i-desc" className="mb-1.5 block text-sm font-semibold">Description <span className="font-normal text-fg-faint">(facultatif)</span></label>
          <input id="i-desc" className="field" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="i-cat" className="mb-1.5 block text-sm font-semibold">Catégorie</label>
            <select id="i-cat" className="field" value={cat} onChange={(e) => setCat(e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="i-w" className="mb-1.5 block text-sm font-semibold">Poids au four</label>
            <input id="i-w" type="number" min={0} max={5} className="field" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <p className="mt-1 text-[0.7rem] text-fg-faint">Pizza/panuozzo : 1 · plaque : 3 · boisson/dessert : 0</p>
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Tailles et prix</legend>
          <ul className="flex flex-col gap-2">
            {sizes.map((s, n) => (
              <li key={n} className="flex gap-2">
                <input aria-label="Nom de la taille" className="field" placeholder="ex. 26 cm" value={s.label} onChange={(e) => setSizes(sizes.map((x, k) => (k === n ? { ...x, label: e.target.value } : x)))} />
                <div className="relative w-32 shrink-0">
                  <input aria-label="Prix en euros" inputMode="decimal" className="field pr-8 text-right tnum" placeholder="11,50" value={s.price} onChange={(e) => setSizes(sizes.map((x, k) => (k === n ? { ...x, price: e.target.value } : x)))} />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint">€</span>
                </div>
                <button type="button" aria-label="Retirer cette taille" disabled={sizes.length === 1} onClick={() => setSizes(sizes.filter((_, k) => k !== n))} className="px-2 text-tomato disabled:opacity-30">✕</button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setSizes([...sizes, { label: "", price: "" }])} className="mt-2 text-sm text-ember hover:underline">+ Ajouter une taille</button>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Affichage</legend>
          <div className="flex flex-wrap gap-2">
            <Toggle label="Visible sur le site" checked={flags.isAvailable} onChange={(v) => setFlags({ ...flags, isAvailable: v })} />
            <Toggle label="Végétarien" checked={flags.isVegetarian} onChange={(v) => setFlags({ ...flags, isVegetarian: v })} />
            <Toggle label="Épicé" checked={flags.isSpicy} onChange={(v) => setFlags({ ...flags, isSpicy: v })} />
            <Toggle label="Nouveau" checked={flags.isNew} onChange={(v) => setFlags({ ...flags, isNew: v })} />
            <Toggle label="Spécialité" checked={flags.isSpecialty} onChange={(v) => setFlags({ ...flags, isSpecialty: v })} />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Ingrédients <span className="font-normal text-fg-faint">({selected.size} choisis)</span></legend>
          <input className="field mb-2.5" placeholder="Rechercher un ingrédient…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto">
            {shown.map((g) => {
              const on = selected.has(g.id);
              return (
                <button key={g.id} type="button" aria-pressed={on} onClick={() => { const n = new Set(selected); if (on) n.delete(g.id); else n.add(g.id); setSelected(n); }} className={`chip !text-[0.72rem] !px-3 !py-1.5 ${on ? "!border-basil/50 !bg-basil/10 !text-basil" : ""}`}>
                  {on ? "✓ " : ""}{g.name}
                </button>
              );
            })}
          </div>
        </fieldset>

        {error && <p role="alert" className="rounded-2xl border-l-4 border-tomato bg-tomato/5 p-3 text-sm text-tomato">{error}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={save} disabled={saving} className="btn btn-primary flex-1 !py-3.5">{saving ? "Enregistrement…" : "Enregistrer"}</button>
          {item && <button onClick={remove} className="text-sm text-tomato hover:underline">Supprimer</button>}
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------------- Ingrédient -------------------------------- */

function IngredientEditor({ ing, onClose, onSaved }: { ing?: Ingredient; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(ing?.name ?? "");
  const [isSupplement, setSupp] = useState(ing?.isSupplement ?? false);
  const [price, setPrice] = useState(toEuroInput(ing?.priceCents ?? 0));
  const [tags, setTags] = useState<Set<string>>(new Set(ing?.allergenTags ?? []));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    const cents = isSupplement ? parseEuro(price) : 0;
    if (!name.trim()) return setError("Donnez un nom à l'ingrédient.");
    if (cents === null) return setError("Prix invalide (ex. 1,50).");
    setSaving(true);
    const r = await call(ing ? "PUT" : "POST", ing ? `/api/admin/carte/ingredients/${ing.id}` : "/api/admin/carte/ingredients", { name: name.trim(), isSupplement, priceCents: cents, allergenTags: [...tags] });
    setSaving(false);
    if (!r.ok) return setError(r.error ?? "Erreur.");
    onSaved();
  }
  async function remove() {
    if (!ing || !window.confirm(`Supprimer « ${ing.name} » ?`)) return;
    const r = await call("DELETE", `/api/admin/carte/ingredients/${ing.id}`);
    if (!r.ok) return setError(r.error ?? "Erreur.");
    onSaved();
  }

  return (
    <Modal title={ing ? "Modifier l'ingrédient" : "Nouvel ingrédient"} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="g-name" className="mb-1.5 block text-sm font-semibold">Nom</label>
          <input id="g-name" className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Toggle label="Proposé en supplément payant" checked={isSupplement} onChange={setSupp} />
          {isSupplement && (
            <div className="relative w-32">
              <input aria-label="Prix du supplément" inputMode="decimal" className="field pr-8 text-right tnum" value={price} onChange={(e) => setPrice(e.target.value)} />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint">€</span>
            </div>
          )}
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Allergènes</legend>
          <div className="flex flex-wrap gap-1.5">
            {ALLERGENS.map(([code, label]) => (
              <Toggle key={code} label={label} checked={tags.has(code)} onChange={(v) => { const n = new Set(tags); if (v) n.add(code); else n.delete(code); setTags(n); }} />
            ))}
          </div>
        </fieldset>
        {error && <p role="alert" className="rounded-2xl border-l-4 border-tomato bg-tomato/5 p-3 text-sm text-tomato">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={save} disabled={saving} className="btn btn-primary flex-1 !py-3.5">{saving ? "Enregistrement…" : "Enregistrer"}</button>
          {ing && <button onClick={remove} className="text-sm text-tomato hover:underline">Supprimer</button>}
        </div>
      </div>
    </Modal>
  );
}
