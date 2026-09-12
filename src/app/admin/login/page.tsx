"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, totpCode }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Connexion impossible.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-sm w-full px-5 py-16 flex-1">
      <h1 className="text-xl font-semibold mb-1">Espace personnel</h1>
      <p className="text-[#585a4d] text-sm mb-6">Pizza Basilico — connexion sécurisée (2FA obligatoire)</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          className="border border-[#d9d6c6] rounded px-3 py-2 text-sm bg-white"
          placeholder="E-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border border-[#d9d6c6] rounded px-3 py-2 text-sm bg-white"
          placeholder="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="border border-[#d9d6c6] rounded px-3 py-2 text-sm bg-white"
          placeholder="Code à 6 chiffres (application d'authentification)"
          value={totpCode}
          onChange={(e) => setTotpCode(e.target.value)}
          maxLength={6}
        />
        {error && <p className="text-[#a5462d] text-sm">{error}</p>}
        <button disabled={loading} className="bg-[#232017] text-white rounded py-2.5 font-medium disabled:opacity-50">
          {loading ? "…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
