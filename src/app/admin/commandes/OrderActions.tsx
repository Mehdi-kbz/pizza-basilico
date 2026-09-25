"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPTIONS: { value: string; label: string }[] = [
  { value: "CONFIRMED", label: "Confirmée" },
  { value: "IN_PREP", label: "En préparation" },
  { value: "READY", label: "Prête" },
  { value: "COMPLETED", label: "Retirée" },
  { value: "NO_SHOW", label: "Non retirée" },
  { value: "CANCELLED", label: "Annuler (rembourse si payée)" },
];

export function OrderActions({ id, status, paid }: { id: string; status: string; paid: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: string) {
    if (next === status) return;
    if (next === "CANCELLED" && !window.confirm(paid ? "Annuler cette commande et rembourser le client ?" : "Annuler cette commande ?")) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/orders/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    setBusy(false);
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Échec du changement de statut.");
    router.refresh();
  }

  if (["PENDING_PAYMENT", "CANCELLED", "REFUNDED"].includes(status)) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor={`st-${id}`} className="text-xs text-fg-faint">Changer le statut</label>
      <select id={`st-${id}`} disabled={busy} value={status} onChange={(e) => change(e.target.value)} className="field !w-auto !py-2 !text-sm">
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <span className="text-xs text-tomato">{error}</span>}
    </div>
  );
}
