"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setStatus(res.ok ? "done" : "error");
  }

  if (status === "done") {
    return (
      <p className="text-basil text-sm flex items-center gap-2">
        <span aria-hidden="true">✓</span> C&rsquo;est noté — on vous écrit avant le prochain service.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 max-w-md">
      <label htmlFor="newsletter-email" className="sr-only">
        Votre adresse e-mail
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        placeholder="vous@exemple.fr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="field flex-1"
      />
      <button disabled={status === "sending"} className="btn btn-primary whitespace-nowrap">
        {status === "sending" ? "…" : "Je m'inscris"}
      </button>
      {status === "error" && <p className="text-tomato text-sm">Échec de l&rsquo;inscription, réessayez.</p>}
    </form>
  );
}
