"use client";

import { useMemo, useState } from "react";
import { formatBytes } from "@/lib/recruitment";

type Status = "NEW" | "REVIEWED" | "CONTACTED" | "ARCHIVED";
interface Application {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string | null;
  cvFileName: string;
  cvSize: number;
  status: Status;
  createdAt: string;
}

const STATUS_LABEL: Record<Status, string> = {
  NEW: "Nouvelle",
  REVIEWED: "Vue",
  CONTACTED: "Contactée",
  ARCHIVED: "Archivée",
};
const STATUS_CLASS: Record<Status, string> = {
  NEW: "chip-flame",
  REVIEWED: "",
  CONTACTED: "chip-basil",
  ARCHIVED: "",
};
const FILTERS: { key: Status | "ALL"; label: string }[] = [
  { key: "ALL", label: "Toutes" },
  { key: "NEW", label: "Nouvelles" },
  { key: "REVIEWED", label: "Vues" },
  { key: "CONTACTED", label: "Contactées" },
  { key: "ARCHIVED", label: "Archivées" },
];

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function ApplicationsClient({ initial, canDelete }: { initial: Application[]; canDelete: boolean }) {
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState<Status | "ALL">("ALL");
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: rows.length };
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);
  const shown = rows.filter((r) => filter === "ALL" || r.status === filter);

  async function setStatus(id: string, status: Status) {
    setError(null);
    const res = await fetch(`/api/admin/recrutement/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return setError("Impossible de changer le statut.");
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Supprimer définitivement la candidature de ${name} et son CV ?`)) return;
    const res = await fetch(`/api/admin/recrutement/${id}`, { method: "DELETE" });
    if (!res.ok) return setError("Suppression impossible.");
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrer par statut">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`chip !text-[0.75rem] !px-4 !py-2 shrink-0 ${filter === f.key ? "!border-ember !bg-flame/10 !text-ember" : ""}`}
          >
            {f.label} <span className="tnum opacity-70">{counts[f.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {error && <p className="mb-4 border-l-2 border-tomato pl-3 text-sm text-tomato">{error}</p>}

      {shown.length === 0 ? (
        <div className="card p-7">
          <p className="display text-xl">Aucune candidature{filter !== "ALL" ? " dans cette catégorie" : " pour le moment"}.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((a) => {
            const open = openId === a.id;
            return (
              <li key={a.id} className="card overflow-hidden">
                <button
                  onClick={() => setOpenId(open ? null : a.id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-4 p-4 text-left sm:p-5"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2 display text-lg text-ember" aria-hidden="true">
                    {a.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{a.name}</span>
                    <span className="block truncate text-xs text-fg-faint">
                      {dateFmt.format(new Date(a.createdAt))}
                    </span>
                  </span>
                  <span className={`chip ${STATUS_CLASS[a.status]}`}>{STATUS_LABEL[a.status]}</span>
                  <span className={`text-fg-faint transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
                    ▾
                  </span>
                </button>

                {open && (
                  <div className="border-t border-line bg-surface-2/30 p-4 sm:p-5">
                    <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="eyebrow mb-0.5">Téléphone</dt>
                        <dd>
                          <a href={`tel:${a.phone.replace(/\s/g, "")}`} className="tnum text-fg hover:text-ember">
                            {a.phone}
                          </a>
                        </dd>
                      </div>
                      <div>
                        <dt className="eyebrow mb-0.5">E-mail</dt>
                        <dd>
                          <a href={`mailto:${a.email}`} className="break-all text-fg hover:text-ember">
                            {a.email}
                          </a>
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="eyebrow mb-0.5">CV</dt>
                        <dd className="flex flex-wrap items-center gap-3">
                          <span className="tnum text-fg-dim">
                            {a.cvFileName} · {formatBytes(a.cvSize)}
                          </span>
                          <a href={`/api/admin/recrutement/${a.id}/cv`} className="btn btn-primary !py-2 !px-4 !text-[0.8rem]">
                            Télécharger le CV
                          </a>
                        </dd>
                      </div>
                      {a.message && (
                        <div className="sm:col-span-2">
                          <dt className="eyebrow mb-0.5">Message</dt>
                          <dd className="whitespace-pre-wrap rounded-2xl bg-white p-3.5 leading-relaxed text-fg-dim">{a.message}</dd>
                        </div>
                      )}
                    </dl>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      <span className="mr-1 text-xs text-fg-faint">Statut :</span>
                      {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(a.id, s)}
                          aria-pressed={a.status === s}
                          className={`chip !text-[0.72rem] !px-3.5 !py-1.5 ${a.status === s ? "!border-ember !bg-flame/10 !text-ember" : ""}`}
                        >
                          {STATUS_LABEL[s]}
                        </button>
                      ))}
                      {canDelete && (
                        <button onClick={() => remove(a.id, a.name)} className="ml-auto text-xs text-tomato underline">
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
