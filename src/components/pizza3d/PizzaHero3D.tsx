"use client";

import dynamic from "next/dynamic";

/** Chargement côté client uniquement (WebGL), avec un disque en repli le temps du chargement. */
const Pizza3D = dynamic(() => import("./Pizza3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full grid place-items-center">
      <div
        className="w-[62%] aspect-square rounded-full animate-pulse"
        style={{
          background:
            "radial-gradient(circle at 38% 32%, #f0d49b 0%, #d9ab68 42%, #b8823f 68%, #7d5526 100%)",
          boxShadow: "0 40px 90px -30px rgba(255,122,47,0.5)",
        }}
      />
    </div>
  ),
});

export function PizzaHero3D({ className = "" }: { className?: string }) {
  return <Pizza3D className={className} />;
}
