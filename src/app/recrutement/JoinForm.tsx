"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { MAX_CV_BYTES, formatBytes } from "@/lib/recruitment";

const CONFETTI = [
  { e: "🍕", x: "-150px", y: "-20px", r: "-40deg", d: "0.9s" },
  { e: "🍅", x: "130px", y: "-40px", r: "60deg", d: "1s" },
  { e: "🌿", x: "-90px", y: "70px", r: "120deg", d: "1.05s" },
  { e: "✨", x: "170px", y: "60px", r: "-80deg", d: "0.95s" },
  { e: "🧀", x: "-190px", y: "40px", r: "30deg", d: "1.1s" },
  { e: "✨", x: "60px", y: "-70px", r: "90deg", d: "1.15s" },
];

const ACCEPT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function JoinForm() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ name: string; email: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(f: File | undefined | null) {
    setFileError(null);
    if (!f) return;
    if (f.size > MAX_CV_BYTES) {
      setFile(null);
      return setFileError(`Ce fichier fait ${formatBytes(f.size)} : la limite est de 5 Mo.`);
    }
    if (!/\.(pdf|docx?)$/i.test(f.name)) {
      setFile(null);
      return setFileError("Format non accepté : envoyez un PDF, DOC ou DOCX.");
    }
    setFile(f);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!file) return setFileError("Joignez votre CV (PDF, DOC ou DOCX, 5 Mo maximum).");

    const form = e.currentTarget;
    const data = new FormData(form);
    data.set("cv", file);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();

    setSending(true);
    try {
      const res = await fetch("/api/recrutement", { method: "POST", body: data });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) return setError(body.error ?? "Une erreur est survenue. Réessayez dans un instant.");
      setDone({ name, email });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau et réessayez.");
    } finally {
      setSending(false);
    }
  }

  /* ------------------------------- Confirmation ------------------------------ */

  if (done) {
    return (
      <div className="pop-in mx-auto mt-10 max-w-md">
        <div className="relative overflow-hidden rounded-[36px] bg-white shadow-[0_40px_90px_-30px_rgba(160,72,30,0.55)]">
          <div className="relative overflow-hidden bg-gradient-to-b from-[#f4703f] to-flame-deep px-6 pt-10 pb-9 text-center text-white">
            {CONFETTI.map((c, i) => (
              <span key={i} aria-hidden="true" className="confetti" style={{ "--x": c.x, "--y": c.y, "--r": c.r, "--d": c.d } as React.CSSProperties}>
                {c.e}
              </span>
            ))}
            <div className="relative mx-auto h-[84px] w-[84px]">
              <span className="pulse-ring absolute inset-0 rounded-full bg-white/40" aria-hidden="true" />
              <svg viewBox="0 0 72 72" className="relative h-full w-full" aria-hidden="true">
                <circle cx="36" cy="36" r="30" fill="rgba(255,255,255,0.18)" />
                <circle className="draw-circle" cx="36" cy="36" r="30" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
                <path className="draw-check" d="M23 37.5l9 9 17-19" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="display mt-5 text-[1.7rem]">Candidature envoyée !</h2>
            <p className="mt-1.5 text-sm text-white/85">Merci {done.name}, on vous répond très vite.</p>
          </div>
          <div className="px-6 py-7 text-center">
            <p className="text-sm text-fg-dim leading-relaxed">
              ✉️ Un e-mail de confirmation vous a été envoyé à <strong className="text-fg">{done.email}</strong>.
            </p>
            <Link href="/" className="btn btn-primary mt-6 w-full">
              Retour à l&rsquo;accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------- Formulaire ------------------------------- */

  return (
    <form onSubmit={submit} className="card mt-10 flex flex-col gap-5 p-5 sm:p-8" noValidate={false}>
      {/* champ piège anti-robots : invisible pour les humains */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Site web
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label htmlFor="j-name" className="mb-1.5 block text-sm font-semibold">
          Nom et prénom <span className="text-ember">*</span>
        </label>
        <input id="j-name" name="name" className="field" required minLength={2} maxLength={80} autoComplete="name" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="j-phone" className="mb-1.5 block text-sm font-semibold">
            Téléphone <span className="text-ember">*</span>
          </label>
          <input id="j-phone" name="phone" type="tel" className="field" required autoComplete="tel" placeholder="06 12 34 56 78" />
        </div>
        <div>
          <label htmlFor="j-email" className="mb-1.5 block text-sm font-semibold">
            E-mail <span className="text-ember">*</span>
          </label>
          <input id="j-email" name="email" type="email" className="field" required autoComplete="email" />
        </div>
      </div>

      <div>
        <label htmlFor="j-cv" className="mb-1.5 block text-sm font-semibold">
          Votre CV <span className="text-ember">*</span>
        </label>
        <input
          ref={inputRef}
          id="j-cv"
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={`rounded-3xl border-2 border-dashed p-5 text-center transition-all ${
            dragging ? "border-flame bg-flame/10 scale-[1.01]" : file ? "border-basil/50 bg-basil/5" : "border-line-strong bg-surface-2/40"
          }`}
        >
          {file ? (
            <div className="flex items-center gap-3 text-left">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-xl shadow-sm" aria-hidden="true">
                📄
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{file.name}</span>
                <span className="block text-xs text-fg-faint tnum">{formatBytes(file.size)}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="text-sm text-fg-faint underline hover:text-ember"
              >
                Changer
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => inputRef.current?.click()} className="w-full">
              <span className="block text-3xl" aria-hidden="true">
                📎
              </span>
              <span className="mt-2 block text-sm font-semibold">Choisir un fichier ou le déposer ici</span>
              <span className="mt-1 block text-xs text-fg-faint">PDF, DOC ou DOCX · 5 Mo maximum</span>
            </button>
          )}
        </div>
        {fileError && <p className="mt-2 text-sm text-tomato">{fileError}</p>}
      </div>

      <div>
        <label htmlFor="j-msg" className="mb-1.5 block text-sm font-semibold">
          Un mot pour nous <span className="font-normal text-fg-faint">(facultatif)</span>
        </label>
        <textarea id="j-msg" name="message" className="field resize-none" rows={3} maxLength={600} placeholder="Poste visé, disponibilités…" />
      </div>

      {error && <p className="border-l-2 border-tomato pl-3 text-sm leading-relaxed text-tomato">{error}</p>}

      <button type="submit" disabled={sending} className="btn btn-primary !py-4 !text-base">
        {sending ? "Envoi en cours…" : "Envoyer ma candidature"}
      </button>
      <p className="text-center text-[0.72rem] text-fg-faint">
        Vos données ne servent qu&rsquo;à traiter votre candidature. 🔒
      </p>
    </form>
  );
}
