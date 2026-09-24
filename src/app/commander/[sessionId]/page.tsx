import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isEffectivelyAvailable } from "@/lib/menu-availability";
import { findNextAvailableSlot } from "@/lib/slots";
import { OrderClient } from "./OrderClient";

export const dynamic = "force-dynamic";

export default async function CommanderPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;

  const session = await prisma.serviceSession.findUnique({
    where: { id: sessionId },
    include: { location: true },
  });
  if (!session) notFound();

  const [categoriesRaw, supplements, nextSlot] = await Promise.all([
    prisma.menuCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: { sizes: true, ingredients: { include: { ingredient: true } } },
        },
      },
    }),
    prisma.ingredient.findMany({ where: { isSupplement: true, isAvailable: true }, orderBy: { priceCents: "asc" } }),
    findNextAvailableSlot(sessionId, 1),
  ]);

  const categories = categoriesRaw
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      items: cat.items.filter(isEffectivelyAvailable).map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        isVegetarian: item.isVegetarian,
        isSpicy: item.isSpicy,
        isNew: item.isNew,
        isSpecialty: item.isSpecialty,
        ingredients: item.ingredients.map((l) => ({ id: l.ingredient.id, name: l.ingredient.name })),
        sizes: item.sizes.map((s) => ({ id: s.id, label: s.label, priceCents: s.priceCents })),
      })),
    }))
    .filter((c) => c.items.length > 0);

  const timeFmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <main className="relative">
      <div
        className="absolute inset-x-0 top-0 h-[320px] -z-10"
        aria-hidden="true"
        style={{ background: "radial-gradient(800px 320px at 65% 0%, rgba(255,122,47,0.12), transparent 62%)" }}
      />

      <div className="mx-auto max-w-6xl px-5 lg:px-8 pt-10 md:pt-14 pb-4">
        <Link href="/#nous-trouver" className="text-xs text-fg-faint hover:text-fg-dim transition-colors">
          ← Tous les emplacements
        </Link>

        <div className="flex flex-wrap items-end justify-between gap-5 mt-4">
          <div>
            <p className="eyebrow">Commander · retrait au camion</p>
            <h1 className="display text-[clamp(2rem,5.5vw,3.2rem)] mt-3">{session.location.label}</h1>
            <p className="text-sm text-fg-dim mt-2 capitalize">
              {dayFmt.format(session.startAt)} · {timeFmt.format(session.startAt)} – {timeFmt.format(session.endAt)}
            </p>
            <p className="text-xs text-fg-faint mt-1">{session.location.address}</p>
          </div>

          {nextSlot && session.isOrderingOpen && (
            <div className="card px-5 py-4">
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-fg-faint">Prochain créneau libre</p>
              <p className="display text-2xl text-ember tnum mt-1">
                {timeFmt.format(nextSlot.startAt)} – {timeFmt.format(nextSlot.endAt)}
              </p>
              <p className="text-[0.7rem] text-fg-faint mt-1 tnum">
                {nextSlot.unitsCap - nextSlot.unitsCommitted} place(s) restante(s) sur ce créneau
              </p>
            </div>
          )}
        </div>
      </div>

      <OrderClient
        sessionId={session.id}
        isOrderingOpen={session.isOrderingOpen}
        categories={categories}
        supplements={supplements.map((s) => ({ id: s.id, name: s.name, priceCents: s.priceCents }))}
      />
    </main>
  );
}
