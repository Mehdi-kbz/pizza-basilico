"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Volet gauche : identité */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 border-r border-line overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(800px 500px at 30% 20%, rgba(255,122,47,0.16), transparent 60%), radial-gradient(600px 400px at 80% 90%, rgba(74,115,52,0.12), transparent 65%)",
          }}
        />
        <Link href="/" className="group">
          <p className="text-[0.6rem] tracking-[0.3em] uppercase text-ember/80">Pizza</p>
          <p className="display text-3xl text-fg group-hover:text-ember transition-colors">BASILICO</p>
        </Link>

        <div>
          <p className="display text-[clamp(2rem,3.6vw,3rem)] max-w-[18ch] leading-[1.05]">
            Le four tourne. <span className="italic text-ember">La file aussi.</span>
          </p>
          <p className="text-sm text-fg-dim mt-5 max-w-sm leading-relaxed">
            Commandes en direct, capacité par créneau, ruptures d&rsquo;ingrédients en un geste.
          </p>
        </div>

        <p className="text-xs text-fg-faint">Accès réservé au personnel · double authentification obligatoire</p>
      </div>

      {/* Volet droit : formulaire */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10">
            <p className="text-[0.6rem] tracking-[0.3em] uppercase text-ember/80">Pizza</p>
            <p className="display text-2xl text-fg">BASILICO</p>
          </div>

          <p className="eyebrow">Espace personnel</p>
          <h1 className="display text-[clamp(1.9rem,5vw,2.6rem)] mt-3">Connexion</h1>
          <p className="text-sm text-fg-dim mt-3">
            Mot de passe et code à 6 chiffres de votre application d&rsquo;authentification.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
            <div>
              <label htmlFor="admin-email" className="block text-xs text-fg-dim mb-1.5">
                E-mail
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs text-fg-dim mb-1.5">
                Mot de passe
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="admin-totp" className="block text-xs text-fg-dim mb-1.5">
                Code à 6 chiffres
              </label>
              <input
                id="admin-totp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                placeholder="000000"
                className="field tnum tracking-[0.4em] text-center text-lg"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            {error && (
              <p className="text-tomato text-sm border-l-2 border-tomato pl-3 leading-relaxed">{error}</p>
            )}

            <button disabled={loading} className="btn btn-primary mt-1">
              {loading ? "Vérification…" : "Se connecter"}
            </button>
          </form>

          <p className="text-xs text-fg-faint mt-8 leading-relaxed">
            Les comptes sont créés manuellement. Un problème d&rsquo;accès ? Contactez le propriétaire.
          </p>
        </div>
      </div>
    </div>
  );
}
