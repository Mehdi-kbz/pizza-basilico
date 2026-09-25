"use client";

import { useState } from "react";

interface Inquiry { id: string; name: string; email: string; details: string; status: string; eventDate: string | null; createdAt: string }
const STATUSES: [string, string][] = [["NEW", "Nouvelle"], ["CONTACTED", "Contactée"], ["CLOSED", "Clôturée"]];
const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });

export function InquiriesClient({ initial }: { initial: Inquiry[] }) {
  const [rows, setRows] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(id: string, status: string) {
    setError(null);
    const res = await fetch(`/api/admin/traiteur/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!res.ok) return setError("Impossible de changer le statut.");
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
  }

  if (rows.length === 0) return <div className="card p-7"><p className="display text-xl">Aucune demande pour le moment.</p></div>;
  return (
    <div>
      {error && <p className="mb-4 border-l-2 border-tomato pl-3 text-sm text-tomato">{error}</p>}
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.id} className="card p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{r.name}</p>
                <a href={`mailto:${r.email}`} className="text-sm text-ember hover:underline">{r.email}</a>
                <p className="mt-1 text-xs text-fg-faint">Reçue le {fmt.format(new Date(r.createdAt))}{r.eventDate ? ` · événement le ${fmt.format(new Date(r.eventDate))}` : ""}</p>
              </div>
              <span className={`chip ${r.status === "NEW" ? "chip-flame" : r.status === "CONTACTED" ? "chip-basil" : ""}`}>{STATUSES.find((s) => s[0] === r.status)?.[1] ?? r.status}</span>
            </div>
            <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-surface-2/50 p-4 text-sm leading-relaxed text-fg-dim">{r.details}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {STATUSES.map(([k, l]) => (
                <button key={k} onClick={() => setStatus(r.id, k)} aria-pressed={r.status === k} className={`chip !text-[0.72rem] !px-3.5 !py-1.5 ${r.status === k ? "!border-ember !bg-flame/10 !text-ember" : ""}`}>{l}</button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
