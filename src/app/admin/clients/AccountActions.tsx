"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "none" | "pending" | "verified";
const LABEL: Record<Status, { text: string; cls: string }> = {
  none: { text: "Sans mot de passe", cls: "" },
  pending: { text: "E-mail à confirmer", cls: "chip-flame" },
  verified: { text: "Compte confirmé", cls: "chip-basil" },
};

export function AccountActions({ customerId, status, canEdit }: { customerId: string; status: Status; canEdit: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function send(body: unknown) {
    setError(null);
    const res = await fetch(`/api/admin/clients/${customerId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Échec.");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <span className={`chip !text-[0.62rem] ${LABEL[status].cls}`}>{LABEL[status].text}</span>
      {canEdit && (
        <div className="flex flex-wrap gap-x-3 text-[0.72rem]">
          {status === "pending" && <button onClick={() => send({ action: "verify" })} className="text-ember underline">Confirmer l&rsquo;e-mail</button>}
          <button onClick={() => { const p = window.prompt("Nouveau mot de passe pour ce client (8 caractères minimum). Le compte sera actif immédiatement."); if (p) send({ password: p }); }} className="text-ember underline">
            {status === "none" ? "Définir un mot de passe" : "Changer le mot de passe"}
          </button>
        </div>
      )}
      {error && <p className="text-[0.7rem] text-tomato">{error}</p>}
    </div>
  );
}
