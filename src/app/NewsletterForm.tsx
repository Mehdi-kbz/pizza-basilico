"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setStatus(res.ok ? "done" : "idle");
  }

  if (status === "done") {
    return <p className="text-sm text-[#3b5a34]">Merci, vous êtes inscrit·e !</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm">
      <input
        type="email"
        required
        placeholder="Votre e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border border-[#d9d6c6] rounded px-3 py-2 text-sm bg-white flex-1"
      />
      <button
        disabled={status === "sending"}
        className="bg-[#232017] text-white rounded px-3 py-2 text-sm disabled:opacity-50"
      >
        S&rsquo;inscrire
      </button>
    </form>
  );
}
