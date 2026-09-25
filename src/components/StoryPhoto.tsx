"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Photo de la page « Notre histoire ». Tant que le fichier n'existe pas dans
 * /public/histoire/, un cadre de remplacement indique quelle photo y sera placée.
 */
export function StoryPhoto({ file, label, emoji, aspect = "aspect-[4/3]", className = "", position = "center" }: { file: string; label: string; emoji: string; aspect?: string; className?: string; position?: string }) {
  const [missing, setMissing] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = ref.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (img && img.complete && img.naturalWidth === 0) setMissing(true);
  }, []);

  if (missing) {
    return (
      <div className={`${aspect} ${className} grid place-items-center rounded-[32px] border-2 border-dashed border-line-strong bg-gradient-to-br from-surface-2/70 to-white p-6 text-center`} role="img" aria-label={`Photo à venir : ${label}`}>
        <div>
          <p className="text-4xl" aria-hidden="true">{emoji}</p>
          <p className="mt-3 text-sm font-semibold">{label}</p>
          <p className="mt-1 text-[0.7rem] uppercase tracking-wider text-fg-faint">Photo à venir</p>
        </div>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={`/histoire/${file}`} alt={label} loading="lazy" onError={() => setMissing(true)} style={{ objectPosition: position }} className={`${aspect} ${className} w-full rounded-[32px] object-cover shadow-[0_30px_60px_-30px_rgba(160,72,30,0.5)]`} />;
}
