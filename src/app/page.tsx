import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatSession(startAt: Date, endAt: Date) {
  const dateFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const timeFmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${dateFmt.format(startAt)} · ${timeFmt.format(startAt)} – ${timeFmt.format(endAt)}`;
}

export default async function HomePage() {
  const sessions = await prisma.serviceSession.findMany({
    where: { endAt: { gt: new Date() } },
    orderBy: { startAt: "asc" },
    include: { location: true },
  });

  return (
    <main className="mx-auto max-w-2xl w-full px-5 py-10 flex-1">
      <header className="mb-8">
        <p className="text-xs tracking-[0.14em] uppercase text-[#a5462d] font-medium">Pizza Basilico</p>
        <h1 className="text-3xl font-semibold mt-1">Pizzas artisanales au feu de bois</h1>
        <p className="text-[#585a4d] mt-2">Commandez à l&rsquo;avance, retirez au camion.</p>
      </header>

      {sessions.length === 0 ? (
        <div className="rounded-lg border border-[#d9d6c6] bg-white/60 p-6">
          <p className="font-medium">Nous ne sommes pas en service actuellement.</p>
          <p className="text-[#585a4d] mt-1">
            Suivez-nous sur Instagram pour connaître notre prochain emplacement :{" "}
            <a href="https://instagram.com/pizzabasilico2020" target="_blank" rel="noreferrer" className="text-[#3b5a34] underline">
              @pizzabasilico2020
            </a>
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/commander/${s.id}`}
                className="block rounded-lg border border-[#d9d6c6] bg-white/60 p-5 hover:border-[#3b5a34] transition-colors"
              >
                <p className="font-medium">{formatSession(s.startAt, s.endAt)}</p>
                <p className="text-[#585a4d] text-sm mt-1">{s.location.label} — {s.location.address}</p>
                {!s.isOrderingOpen && (
                  <p className="text-[#a5462d] text-xs mt-2 uppercase tracking-wide">Commandes fermées</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-sm text-[#585a4d]">
        Déjà commandé ?{" "}
        <Link href="/suivi" className="underline text-[#3b5a34]">
          Suivre ma commande
        </Link>
      </p>
    </main>
  );
}
