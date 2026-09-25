"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordField } from "@/components/PasswordField";

type Mode = "login" | "forgot" | "sent";

/** Connexion (e-mail + mot de passe) et « mot de passe oublié » (lien par e-mail). */
export function ConnexionForm({ initialMode = "login" }: { initialMode?: Mode }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState(sp.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNeedsConfirm(false);
    const res = await fetch("/api/customer/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    setLoading(false);
    if (res.ok) {
      router.push("/compte");
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Connexion impossible.");
    setNeedsConfirm(data.code === "NOT_VERIFIED");
  }

  async function forgot(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    await fetch("/api/customer/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    setLoading(false);
    setMode("sent");
  }

  if (mode === "sent") {
    return (
      <div className="text-center">
        <p className="text-4xl" aria-hidden="true">✉️</p>
        <p className="display mt-3 text-xl text-basil">Regardez vos e-mails.</p>
        <p className="mt-2.5 text-sm leading-relaxed text-fg-dim">
          Si cette adresse nous est connue, un lien vient de partir pour choisir votre mot de passe. Il est valable 1 heure.
        </p>
        <button onClick={() => setMode("login")} className="mt-5 text-sm text-ember underline">Retour à la connexion</button>
      </div>
    );
  }

  if (mode === "forgot") {
    return (
      <form onSubmit={forgot} className="flex flex-col gap-4">
        <div>
          <label htmlFor="f-email" className="mb-1.5 block text-sm font-semibold">Votre e-mail</label>
          <input id="f-email" type="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="vous@exemple.fr" />
        </div>
        <button disabled={loading} className="btn btn-primary">{loading ? "Envoi…" : "Recevoir le lien"}</button>
        <button type="button" onClick={() => setMode("login")} className="text-sm text-fg-dim underline">Retour à la connexion</button>
      </form>
    );
  }

  return (
    <form onSubmit={login} className="flex flex-col gap-4">
      <div>
        <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold">E-mail</label>
        <input id="login-email" type="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="vous@exemple.fr" />
      </div>
      <div>
        <label htmlFor="login-pass" className="mb-1.5 block text-sm font-semibold">Mot de passe</label>
        <PasswordField id="login-pass" value={password} onChange={setPassword} autoComplete="current-password" required />
      </div>
      {error && (
        <div role="alert" className="rounded-2xl border-l-4 border-tomato bg-tomato/5 p-3 text-sm leading-relaxed text-tomato">
          {error}
          {needsConfirm && (
            <button type="button" onClick={() => forgot()} className="mt-1 block font-semibold underline">Recevoir un lien de confirmation</button>
          )}
        </div>
      )}
      <button disabled={loading} className="btn btn-primary">{loading ? "Connexion…" : "Se connecter"}</button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <button type="button" onClick={() => setMode("forgot")} className="text-ember underline">Mot de passe oublié ?</button>
        <Link href="/#pizzas" className="text-fg-dim underline">Pas de compte ? Commandez simplement</Link>
      </div>
    </form>
  );
}
