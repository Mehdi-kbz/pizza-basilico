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
    <main className="mx-auto max-w-sm w-full px-5 py-16 flex-1">
      <p className="text-xs tracking-[0.14em] uppercase text-[#a5462d] font-medium">Pizza Basilico</p>
      <h1 className="text-xl font-semibold mt-1 mb-6">Suivre ma commande</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="border border-[#d9d6c6] rounded px-3 py-2 text-sm bg-white"
          placeholder="E-mail utilisé pour la commande"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border border-[#d9d6c6] rounded px-3 py-2 text-sm bg-white"
          placeholder="Numéro de commande (ex. 12)"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
        />
        {error && <p className="text-[#a5462d] text-sm">{error}</p>}
        <button disabled={loading} className="bg-[#232017] text-white rounded py-2.5 font-medium disabled:opacity-50">
          {loading ? "…" : "Retrouver ma commande"}
        </button>
      </form>
    </main>
  );
}
