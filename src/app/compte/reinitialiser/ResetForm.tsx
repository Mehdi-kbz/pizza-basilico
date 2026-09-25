"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PasswordField } from "@/components/PasswordField";
import { useCart } from "@/lib/cart-store";

export function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const { itemCount } = useCart();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expired, setExpired] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/customer/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    setLoading(false);
    if (res.ok) {
      // Panier en attente : on y retourne directement (la pizza offerte est alors utilisable sans mot de passe).
      router.push(itemCount > 0 ? "/panier" : "/compte");
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Une erreur est survenue.");
    setExpired(res.status === 410);
  }

  if (!token) return <p className="text-sm text-tomato">Lien invalide. <Link href="/compte/mot-de-passe-oublie" className="underline">Demander un nouveau lien</Link></p>;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="r-pass" className="mb-1.5 block text-sm font-semibold">Nouveau mot de passe</label>
        <PasswordField id="r-pass" value={password} onChange={setPassword} autoComplete="new-password" required placeholder="8 caractères minimum" />
      </div>
      {error && (
        <p role="alert" className="rounded-2xl border-l-4 border-tomato bg-tomato/5 p-3 text-sm text-tomato">
          {error} {expired && <Link href="/compte/mot-de-passe-oublie" className="font-semibold underline">Nouveau lien</Link>}
        </p>
      )}
      <button disabled={loading} className="btn btn-primary">{loading ? "Enregistrement…" : "Valider et me connecter"}</button>
    </form>
  );
}
