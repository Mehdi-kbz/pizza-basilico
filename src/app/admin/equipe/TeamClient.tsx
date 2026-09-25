"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User { id: string; email: string; role: "OWNER" | "STAFF"; isActive: boolean; lastLoginAt: string | null; createdAt: string }
const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

async function call(method: string, url: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  return res.ok ? { ok: true as const } : { ok: false as const, error: ((await res.json().catch(() => ({}))).error as string) ?? "Erreur." };
}

export function TeamClient({ initial, meId }: { initial: User[]; meId: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"OWNER" | "STAFF">("STAFF");
  const [busy, setBusy] = useState(false);

  async function act(fn: () => Promise<{ ok: boolean; error?: string }>, okText: string) {
    setMsg(null);
    const r = await fn();
    if (!r.ok) setMsg({ kind: "err", text: r.error ?? "Erreur." });
    else {
      setMsg({ kind: "ok", text: okText });
      router.refresh();
    }
    return r.ok;
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await act(() => call("POST", "/api/admin/equipe", { email, password, role }), `Compte créé : ${email}`);
    setBusy(false);
    if (ok) { setEmail(""); setPassword(""); }
  }

  return (
    <div className="flex flex-col gap-8">
      {msg && <p role="status" className={`rounded-2xl border-l-4 p-3 text-sm ${msg.kind === "ok" ? "border-basil bg-basil/5 text-basil" : "border-tomato bg-tomato/5 text-tomato"}`}>{msg.text}</p>}

      <ul className="flex flex-col gap-3">
        {initial.map((u) => (
          <li key={u.id} className="card p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1 basis-56">
                <p className="truncate font-semibold">{u.email}{u.id === meId && <span className="ml-2 chip !text-[0.6rem]">Vous</span>}</p>
                <p className="text-xs text-fg-faint">{u.lastLoginAt ? `Dernière connexion : ${fmt.format(new Date(u.lastLoginAt))}` : "Jamais connecté"}</p>
              </div>
              <span className={`chip ${u.role === "OWNER" ? "chip-brass" : ""}`}>{u.role === "OWNER" ? "Propriétaire" : "Équipe"}</span>
              <span className={`chip ${u.isActive ? "chip-basil" : ""}`}>{u.isActive ? "Actif" : "Désactivé"}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <button onClick={() => { const p = window.prompt(`Nouveau mot de passe pour ${u.email} (8 caractères minimum)`); if (p) act(() => call("PATCH", `/api/admin/equipe/${u.id}`, { password: p }), "Mot de passe mis à jour."); }} className="text-ember hover:underline">Changer le mot de passe</button>
              <button onClick={() => act(() => call("PATCH", `/api/admin/equipe/${u.id}`, { role: u.role === "OWNER" ? "STAFF" : "OWNER" }), "Rôle mis à jour.")} className="text-ember hover:underline">{u.role === "OWNER" ? "Passer en Équipe" : "Passer Propriétaire"}</button>
              <button onClick={() => act(() => call("PATCH", `/api/admin/equipe/${u.id}`, { isActive: !u.isActive }), u.isActive ? "Compte désactivé." : "Compte réactivé.")} className="text-ember hover:underline">{u.isActive ? "Désactiver" : "Réactiver"}</button>
              {u.id !== meId && <button onClick={() => { if (window.confirm(`Supprimer le compte ${u.email} ?`)) act(() => call("DELETE", `/api/admin/equipe/${u.id}`), "Compte supprimé."); }} className="text-tomato hover:underline">Supprimer</button>}
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={create} className="card flex flex-col gap-4 p-5 sm:p-6">
        <h2 className="display text-xl">Ajouter un compte</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="t-mail" className="mb-1.5 block text-sm font-semibold">E-mail</label><input id="t-mail" type="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" /></div>
          <div><label htmlFor="t-pass" className="mb-1.5 block text-sm font-semibold">Mot de passe</label><input id="t-pass" type="text" required minLength={8} className="field" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" placeholder="8 caractères minimum" /></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {([["STAFF", "Équipe (file, comptoir, disponibilité)"], ["OWNER", "Propriétaire (accès complet)"]] as const).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={role === k} onClick={() => setRole(k)} className={`chip !text-[0.75rem] !px-4 !py-2 ${role === k ? "!border-ember !bg-flame/10 !text-ember" : ""}`}>{l}</button>
          ))}
        </div>
        <button disabled={busy} className="btn btn-primary self-start !px-8">{busy ? "Création…" : "Créer le compte"}</button>
      </form>
    </div>
  );
}
