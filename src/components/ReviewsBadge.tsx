"use client";

import { useEffect, useRef, useState } from "react";
import { REVIEWS } from "@/lib/reviews-config";

const CYCLE_MS = 7000;

function Star({ i, filled }: { i: number; filled: boolean }) {
  const path = "M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.2 1.2-6.5L2.5 9.5l6.6-.9L12 2.6z";
  return (
    <span className="rv-star" style={{ "--i": i } as React.CSSProperties} aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d={path} fill="#ecdccf" /></svg>
      {filled && (
        <svg viewBox="0 0 24 24" className="rv-fill">
          <defs>
            <linearGradient id={`rv-g-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffd84d" />
              <stop offset="1" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <path d={path} fill={`url(#rv-g-${i})`} />
        </svg>
      )}
    </span>
  );
}

/** Bandeau compact « avis Google » : étoiles qui se remplissent en boucle, compteur, lien vers la fiche Google Maps. */
export function ReviewsBadge() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState<number>(REVIEWS.count);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Le compteur repart de zéro à chaque cycle, en phase avec les étoiles ; à l'arrêt il affiche le total.
  useEffect(() => {
    if (!visible || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let start = performance.now();
    const tick = (now: number) => {
      const t = ((now - start) % CYCLE_MS) / CYCLE_MS; // 0 → 1
      const p = Math.min(1, t / 0.32); // le compteur monte pendant le premier tiers du cycle
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(REVIEWS.count * eased));
      raf = requestAnimationFrame(tick);
    };
    start = performance.now();
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      setCount(REVIEWS.count);
    };
  }, [visible]);

  return (
    <section aria-label="Avis clients" className="mx-auto max-w-6xl px-3 sm:px-5 pt-6">
      <div ref={ref} className={visible ? "rv-on" : ""}>
        <div className="rv-frame rounded-[28px] p-[1.5px] shadow-[0_24px_50px_-30px_rgba(217,119,6,0.55)]">
          <div className="relative overflow-hidden rounded-[27px] bg-gradient-to-br from-white via-[#fffaf3] to-[#fff1e2] px-5 py-5 sm:px-8 sm:py-5">
            {/* étincelles dorées qui montent en boucle */}
            {[["8%", "0s"], ["24%", "1.7s"], ["47%", "0.9s"], ["66%", "3s"], ["83%", "2.2s"], ["94%", "4s"]].map(([left, d], k) => (
              <svg key={k} viewBox="0 0 24 24" className="rv-spark" style={{ left, "--d": d } as React.CSSProperties} aria-hidden="true">
                <path d="M12 1l2.4 8.6L23 12l-8.6 2.4L12 23l-2.4-8.6L1 12l8.6-2.4L12 1z" fill="currentColor" />
              </svg>
            ))}

            <div className="relative flex flex-col items-center gap-3.5 text-center md:flex-row md:justify-between md:gap-10 md:text-left">
              <div className="flex flex-col items-center gap-2 md:items-start">
                <div className="relative flex gap-1.5" role="img" aria-label={`${REVIEWS.stars} étoiles sur 5`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} i={i} filled={i < REVIEWS.stars} />
                  ))}
                  <span className="rv-shine" aria-hidden="true" />
                </div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-fg-faint">Avis Google Maps</p>
              </div>

              <div className="md:flex-1">
                <p className="eyebrow">Nos clients en parlent</p>
                <p className="mt-1 flex items-baseline justify-center gap-2 md:justify-start">
                  <span className="display bg-gradient-to-b from-[#f5a300] to-[#d9541a] bg-clip-text text-[clamp(2.4rem,8vw,3.2rem)] tnum text-transparent" aria-label={`Plus de ${REVIEWS.count} avis`}>
                    {count}+
                  </span>
                  <span className="text-base font-semibold text-fg-dim">avis clients</span>
                </p>
                <p className="mx-auto mt-1.5 max-w-[38ch] text-sm leading-relaxed text-fg-dim md:mx-0">
                  Des centaines d&rsquo;avis 5 étoiles, publiés par nos clients sur Google Maps. Lisez-les vous-même.
                </p>
              </div>

              <a
                href={REVIEWS.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rv-cta btn btn-primary relative w-full !py-3.5 !text-[0.9rem] md:w-auto md:!px-8"
              >
                Lire les avis <span className="rv-arrow" aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
