"use client";

import { useEffect, useState, useCallback } from "react";

interface Promo {
  id: string;
  code: string;
  kind: "PERCENT" | "FIXED";
  value: number;
  isActive: boolean;
  expiresAt: string | null;
  maxUses: number | null;
  usesCount: number;
}

const eur = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export function PromosClient() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [value, setValue] = useState(10);
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/promo-codes");
    if (res.ok) setPromos((await res.json()).codes);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          kind,
          value,
          maxUses: maxUses ? Number(maxUses) : undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "Erreur.");
      setCode("");
      setMaxUses("");
      setExpiresAt("");
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch(`/api/admin/promo-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    load();
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-char p-5 flex flex-col gap-3">
        <h2 className="font-semibold">Nouveau code</h2>
        <input
          className="field uppercase"
          placeholder="CODE (ex. BIENVENUE10)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-2">
          <select value={kind} onChange={(e) => setKind(e.target.value as "PERCENT" | "FIXED")} className="field">
            <option value="PERCENT">Pourcentage</option>
            <option value="FIXED">Montant fixe (€)</option>
          </select>
          <input
            type="number"
            min={1}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="field"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-cream-dim">
            Limite d&rsquo;utilisation (facultatif)
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="field w-full mt-1"
            />
          </label>
          <label className="text-xs text-cream-dim">
            Expiration (facultatif)
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="field w-full mt-1"
            />
          </label>
        </div>
        {error && <p className="text-tomato text-sm">{error}</p>}
        <button disabled={submitting} className="btn btn-primary">
          {submitting ? "…" : "Créer le code"}
        </button>
      </form>

      <ul className="flex flex-col gap-2">
        {promos.map((p) => (
          <li key={p.id} className="flex items-center justify-between border border-line rounded p-3 bg-char text-sm">
            <div>
              <p className="font-medium font-mono">{p.code}</p>
              <p className="text-cream-dim text-xs">
                {p.kind === "PERCENT" ? `${p.value}%` : eur(p.value)}
                {p.maxUses ? ` · ${p.usesCount}/${p.maxUses} utilisations` : ` · ${p.usesCount} utilisations`}
                {p.expiresAt ? ` · expire le ${new Date(p.expiresAt).toLocaleDateString("fr-FR")}` : ""}
              </p>
            </div>
            <button
              onClick={() => toggle(p.id, !p.isActive)}
              className={`text-xs rounded px-2.5 py-1.5 border ${p.isActive ? "border-line" : "border-tomato bg-tomato text-cream"}`}
            >
              {p.isActive ? "Désactiver" : "Réactiver"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
