"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StampEditor({ customerId, stamps, required, canEdit }: { customerId: string; stamps: number; required: number; canEdit: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(stamps);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: number) {
    if (next < 0) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/clients/${customerId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stampCount: next }) });
    setBusy(false);
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Échec.");
    setValue(next);
    router.refresh();
  }

  const ready = value >= required;
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className={`tnum text-sm font-semibold ${ready ? "text-basil" : ""}`}>{value} / {required} tampons</p>
        <p className="text-[0.7rem] text-fg-faint">{ready ? "🎁 pizza offerte disponible" : `encore ${required - value}`}</p>
        {error && <p className="text-[0.7rem] text-tomato">{error}</p>}
      </div>
      {canEdit && (
        <div className="flex items-center gap-1 rounded-full bg-surface-2 p-1">
          <button disabled={busy || value === 0} onClick={() => save(value - 1)} aria-label="Retirer un tampon" className="h-8 w-8 rounded-full bg-white shadow-sm disabled:opacity-40">−</button>
          <button disabled={busy} onClick={() => save(value + 1)} aria-label="Ajouter un tampon" className="h-8 w-8 rounded-full bg-white shadow-sm disabled:opacity-40">+</button>
        </div>
      )}
    </div>
  );
}
