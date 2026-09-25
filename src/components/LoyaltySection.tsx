"use client";

import { useEffect, useRef, useState } from "react";
import { PizzaPhoto } from "@/components/PizzaPhoto";

const TOTAL = 10;
const FILLED_FAST = 8; // les 8 premières croix arrivent vite, les 2 dernières sont mises en scène

/** Carte de fidélité animée : 10 pizzas = 1 offerte. Joue une fois, à l'entrée dans l'écran. */
export function LoyaltySection() {
  const ref = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlay(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPlay(true);
          io.disconnect();
        }
      },
      { threshold: 0.45 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section aria-labelledby="loyalty-title" className="mx-auto max-w-6xl px-3 sm:px-5 pt-16 md:pt-24">
      <div
        ref={ref}
        className={`relative isolate overflow-hidden rounded-[36px] md:rounded-[44px] bg-[#16100d] text-white shadow-[0_40px_90px_-40px_rgba(22,16,13,0.9)] ${play ? "loy-play" : ""}`}
      >
        {/* reflet doux */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "radial-gradient(700px 360px at 12% 0%, rgba(255,255,255,0.07), transparent 65%)" }}
        />

        <div className="relative px-6 py-9 sm:px-10 md:px-14 md:py-14 md:min-h-[430px]">
          <div className="max-w-[440px]">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-[#ff8a5c]">Carte de fidélité</p>
            <h2 id="loyalty-title" className="display mt-3 text-[clamp(1.8rem,4.4vw,2.7rem)]">
              10 pizzas achetées,
              <br />
              <span className="italic text-[#ff8a5c]">la suivante est offerte.</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Utilisez simplement votre e-mail en commandant. C&rsquo;est tout.
            </p>

            <ol aria-hidden="true" className="mt-7 grid grid-cols-5 gap-2.5 sm:gap-3.5">
              {Array.from({ length: TOTAL }, (_, i) => {
                const big = i >= FILLED_FAST;
                const d = big ? (i === FILLED_FAST ? 1.5 : 2.35) : 0.25 + i * 0.07;
                return (
                  <li
                    key={i}
                    className={`loy-dot ${big ? "loy-big" : ""}`}
                    style={{ "--i": i, "--d": d } as React.CSSProperties}
                  >
                    <svg viewBox="0 0 64 64" className="loy-cross absolute inset-0 h-full w-full">
                      <path d="M20 20 L44 44" />
                      <path d="M44 20 L20 44" />
                    </svg>
                  </li>
                );
              })}
            </ol>

            <p className="loy-tag mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <span aria-hidden="true">🎁</span> Votre pizza offerte
            </p>
          </div>

          {/* La pizza reste toujours entièrement dans la carte : sous le texte sur mobile, à droite sur grand écran */}
          <div className="relative mx-auto mt-2 aspect-square w-[62%] max-w-[240px] md:absolute md:right-[6%] md:top-1/2 md:mt-0 md:h-[78%] md:w-auto md:max-w-none md:-translate-y-1/2">
            <div
              aria-hidden="true"
              className="loy-glow pointer-events-none absolute -inset-[28%] rounded-full"
              style={{ background: "radial-gradient(closest-side, rgba(242,106,61,0.5), rgba(242,106,61,0.1) 60%, transparent 100%)" }}
            />
            <div className="loy-pizza-wrap relative h-full w-full">
              <div className="loy-pizza h-full w-full">
                <PizzaPhoto name="hero" src="/pizzas/hero.webp" className="h-full w-full !object-contain drop-shadow-[0_24px_36px_rgba(0,0,0,0.55)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
