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

  return (
    <>
      {erreur && (
        <p className="text-[#a5462d] text-sm mb-4">
          {erreur === "lien_expire" ? "Ce lien a expiré ou a déjà été utilisé, demandez-en un nouveau." : "Lien invalide."}
        </p>
      )}

      {sent ? (
        <p className="text-[#3b5a34] text-sm">
          Si cette adresse est connue, un e-mail vient d&rsquo;être envoyé avec votre lien de connexion.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="Votre e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-[#d9d6c6] rounded px-3 py-2 text-sm bg-white"
          />
          <button disabled={loading} className="bg-[#232017] text-white rounded py-2.5 font-medium disabled:opacity-50">
            {loading ? "…" : "Recevoir mon lien de connexion"}
          </button>
        </form>
      )}
    </>
  );
}
