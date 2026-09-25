"use client";

/** Rangée de tampons (10 ronds, croix orange sur ceux déjà gagnés) — affichée dès qu'un e-mail est saisi. */
export function StampsMini({ stamps, required, loading }: { stamps: number; required: number; loading?: boolean }) {
  const filled = Math.min(stamps, required);
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-ember">Carte de fidélité</p>
        <p className="tnum text-sm font-semibold" aria-live="polite">
          {loading ? "…" : `${filled} / ${required}`}
        </p>
      </div>
      <ol key={loading ? "loading" : stamps} className={`mt-2.5 grid grid-cols-10 gap-1.5 ${loading ? "animate-pulse" : ""}`} aria-label={loading ? "Chargement des tampons" : `${filled} tampons sur ${required}`}>
        {Array.from({ length: required }, (_, i) => (
          <li key={i} className="relative aspect-square rounded-full bg-white shadow-[inset_0_-2px_4px_rgba(0,0,0,0.08),0_0_0_1px_rgba(230,191,168,0.6)]" style={{ "--i": i } as React.CSSProperties}>
            {!loading && i < filled && (
              <svg viewBox="0 0 64 64" className="stamp-cross absolute inset-0 h-full w-full" aria-hidden="true">
                <path d="M20 20 L44 44" />
                <path d="M44 20 L20 44" />
              </svg>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
