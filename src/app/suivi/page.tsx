"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SuiviLookupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [numero, setNumero] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, dailyOrderNumber: numero }),
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Commande introuvable.");
    router.push(data.trackingUrl);
  }

  return (
    <main className="relative">
      <div
        className="absolute inset-x-0 top-0 h-[320px] -z-10"
        aria-hidden="true"
        style={{ background: "radial-gradient(700px 300px at 55% 0%, rgba(255,122,47,0.12), transparent 62%)" }}
      />

      <div className="mx-auto max-w-md px-5 lg:px-8 pt-16 md:pt-24 pb-24">
        <p className="eyebrow">Suivi</p>
        <h1 className="display text-[clamp(2rem,6vw,3rem)] mt-3">Retrouver ma commande</h1>
        <p className="text-sm text-fg-dim mt-4 leading-relaxed">
          Le lien de suivi vous a été envoyé par e-mail. Si vous ne le retrouvez pas, indiquez
          simplement votre adresse et le numéro de commande.
        </p>

        <form onSubmit={handleSubmit} className="card p-6 mt-8 flex flex-col gap-4">
          <div>
            <label htmlFor="track-email" className="block text-xs text-fg-dim mb-1.5">
              E-mail utilisé pour la commande
            </label>
            <input
              id="track-email"
              type="email"
              required
              className="field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.fr"
            />
          </div>

          <div>
            <label htmlFor="track-number" className="block text-xs text-fg-dim mb-1.5">
              Numéro de commande
            </label>
            <input
              id="track-number"
              required
              inputMode="numeric"
              className="field tnum"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="12"
            />
          </div>

          {error && <p className="text-tomato text-sm border-l-2 border-tomato pl-3">{error}</p>}

          <button disabled={loading} className="btn btn-primary mt-1">
            {loading ? "Recherche…" : "Retrouver ma commande"}
          </button>
        </form>
      </div>
    </main>
  );
}
