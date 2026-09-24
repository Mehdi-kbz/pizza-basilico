"use client";

import { useState } from "react";

export function CateringForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("sending");
    const res = await fetch("/api/catering", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, eventDate: eventDate || undefined, details }),
    });
    if (!res.ok) {
      setStatus("idle");
      setError("Envoi impossible — vérifiez les champs et réessayez.");
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <div>
        <p className="display text-xl text-basil">Demande envoyée.</p>
        <p className="text-sm text-fg-dim mt-2 leading-relaxed">
          On revient vers vous par e-mail rapidement avec une proposition.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div>
        <label htmlFor="cat-name" className="block text-xs text-fg-dim mb-1.5">
          Votre nom
        </label>
        <input id="cat-name" required value={name} onChange={(e) => setName(e.target.value)} className="field" />
      </div>

      <div>
        <label htmlFor="cat-email" className="block text-xs text-fg-dim mb-1.5">
          E-mail
        </label>
        <input
          id="cat-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
        />
      </div>

      <div>
        <label htmlFor="cat-date" className="block text-xs text-fg-dim mb-1.5">
          Date de l&rsquo;événement (si connue)
        </label>
        <input id="cat-date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="field" />
      </div>

      <div>
        <label htmlFor="cat-details" className="block text-xs text-fg-dim mb-1.5">
          Votre projet — lieu, nombre de convives, horaires
        </label>
        <textarea
          id="cat-details"
          required
          rows={5}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="field resize-y"
        />
      </div>

      {error && <p className="text-tomato text-sm">{error}</p>}

      <button disabled={status === "sending"} className="btn btn-primary mt-1">
        {status === "sending" ? "Envoi…" : "Envoyer ma demande"}
      </button>
    </form>
  );
}
