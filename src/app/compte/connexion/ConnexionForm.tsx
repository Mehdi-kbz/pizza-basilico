"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export function ConnexionForm() {
  const searchParams = useSearchParams();
  const erreur = searchParams.get("erreur");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div>
        <p className="display text-xl text-basil">Lien envoyé.</p>
        <p className="text-sm text-fg-dim mt-2.5 leading-relaxed">
          Si cette adresse nous est connue, un e-mail vient de partir avec votre lien de connexion.
          Il est valable 15 minutes.
        </p>
      </div>
    );
  }

  return (
    <>
      {erreur && (
        <p className="text-tomato text-sm mb-4 border-l-2 border-tomato pl-3 leading-relaxed">
          {erreur === "lien_expire"
            ? "Ce lien a expiré ou a déjà servi. Demandez-en un nouveau."
            : "Lien invalide."}
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="login-email" className="block text-xs text-fg-dim mb-1.5">
            Votre e-mail
          </label>
          <input
            id="login-email"
            type="email"
            required
            className="field"
            placeholder="vous@exemple.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button disabled={loading} className="btn btn-primary">
          {loading ? "Envoi…" : "Recevoir mon lien"}
        </button>
      </form>
    </>
  );
}
