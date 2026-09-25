"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart-store";

export function ConfirmForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const { itemCount } = useCart();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setState("loading");
    const res = await fetch("/api/customer/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Lien invalide.");
      return setState("error");
    }
    setState("done");
    window.setTimeout(() => {
      router.push(itemCount > 0 ? "/panier" : "/compte");
      router.refresh();
    }, 1600);
  }

  return (
    <div className="card p-6 text-center sm:p-8">
      {state === "done" ? (
        <div className="pop-in">
          <div className="mx-auto h-[72px] w-[72px]">
            <svg viewBox="0 0 72 72" className="h-full w-full" aria-hidden="true">
              <circle className="draw-circle" cx="36" cy="36" r="30" fill="none" stroke="#3f7a2a" strokeWidth="3.5" strokeLinecap="round" />
              <path className="draw-check" d="M23 37.5l9 9 17-19" fill="none" stroke="#3f7a2a" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="display mt-4 text-2xl">E-mail confirmé !</h1>
          <p className="mt-2 text-sm text-fg-dim">Votre compte est actif. Redirection…</p>
        </div>
      ) : (
        <>
          <p className="text-4xl" aria-hidden="true">✉️</p>
          <h1 className="display mt-3 text-2xl">Confirmer mon e-mail</h1>
          <p className="mt-2 text-sm leading-relaxed text-fg-dim">
            Un compte a été créé avec cette adresse lors d&rsquo;une commande. Confirmez que c&rsquo;était bien vous pour retrouver vos commandes et utiliser vos pizzas offertes.
          </p>
          {state === "error" && (
            <p role="alert" className="mt-4 rounded-2xl border-l-4 border-tomato bg-tomato/5 p-3 text-left text-sm text-tomato">
              {error} <Link href="/compte/mot-de-passe-oublie" className="font-semibold underline">Recevoir un nouveau lien</Link>
            </p>
          )}
          <button onClick={confirm} disabled={!token || state === "loading"} className="btn btn-primary mt-6 w-full !py-3.5">
            {state === "loading" ? "Confirmation…" : "Oui, c'est moi"}
          </button>
          <p className="mt-4 text-xs text-fg-faint">Ce n&rsquo;était pas vous ? Ignorez simplement ce message.</p>
        </>
      )}
    </div>
  );
}
