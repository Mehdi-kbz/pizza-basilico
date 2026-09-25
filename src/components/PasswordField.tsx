"use client";

import { useState } from "react";

/** Champ mot de passe avec bouton « afficher » (utile sur mobile). */
export function PasswordField({ id, value, onChange, autoComplete, placeholder, required, disabled }: {
  id: string; value: string; onChange: (v: string) => void; autoComplete: "new-password" | "current-password"; placeholder?: string; required?: boolean; disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={show ? "text" : "password"} className="field pr-20" value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} placeholder={placeholder} required={required} disabled={disabled} minLength={autoComplete === "new-password" ? 8 : undefined} />
      <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-xs font-semibold text-fg-dim hover:bg-surface-2">
        {show ? "Masquer" : "Afficher"}
      </button>
    </div>
  );
}
