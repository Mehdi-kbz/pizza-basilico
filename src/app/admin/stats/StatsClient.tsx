"use client";

import { useEffect, useState } from "react";

interface Stats {
  ordersCount: number;
  totalCents: number;
  topItems: { name: string; count: number }[];
}

const eur = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

function StatBlock({ title, stats }: { title: string; stats: Stats }) {
  return (
    <section className="rounded-lg border border-[#d9d6c6] bg-white/60 p-5">
      <h2 className="font-semibold mb-3">{title}</h2>
      <div className="flex gap-6 mb-4">
        <div>
          <p className="text-2xl font-semibold">{stats.ordersCount}</p>
          <p className="text-xs text-[#585a4d]">commandes</p>
        </div>
        <div>
          <p className="text-2xl font-semibold">{eur(stats.totalCents)}</p>
          <p className="text-xs text-[#585a4d]">chiffre d&rsquo;affaires</p>
        </div>
      </div>
      {stats.topItems.length > 0 && (
        <>
          <p className="text-xs uppercase tracking-wide text-[#585a4d] mb-1">Articles les plus vendus</p>
          <ul className="text-sm flex flex-col gap-0.5">
            {stats.topItems.map((i) => (
              <li key={i.name} className="flex justify-between">
                <span>{i.name}</span>
                <span className="text-[#585a4d]">{i.count}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export function StatsClient() {
  const [data, setData] = useState<{ today: Stats; week: Stats } | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-[#585a4d] text-sm">Chargement…</p>;

  return (
    <div className="flex flex-col gap-4">
      <StatBlock title="Aujourd'hui" stats={data.today} />
      <StatBlock title="7 derniers jours" stats={data.week} />
    </div>
  );
}
