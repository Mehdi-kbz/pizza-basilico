import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isEffectivelyAvailable } from "@/lib/menu-availability";
import { CarteClient } from "./CarteClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "La carte — Pizza Basilico",
  description: "Pizzas base tomate et base crème, Panuozzo, spécialités, boissons et desserts maison.",
};

export default async function CartePage() {
  const now = new Date();

  const [categoriesRaw, supplements, openSession] = await Promise.all([
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
    prisma.serviceSession.findFirst({
      where: { endAt: { gt: now }, isOrderingOpen: true },
      orderBy: { startAt: "asc" },
    }),
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
        composition: item.ingredients.map((l) => l.ingredient.name),
        sizes: item.sizes.map((s) => ({ label: s.label, priceCents: s.priceCents })),
      })),
    }))
    .filter((c) => c.items.length > 0);

  return (
    <main className="relative">
      <div
        className="absolute inset-x-0 top-0 h-[420px] -z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(900px 380px at 70% 0%, rgba(255,122,47,0.14), transparent 65%), radial-gradient(600px 300px at 10% 12%, rgba(74,115,52,0.1), transparent 65%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-5 lg:px-8 pt-12 pb-6 md:pt-16">
        <p className="eyebrow">Au feu de bois</p>
        <h1 className="display text-[clamp(2.4rem,7vw,4.2rem)] mt-3">La carte</h1>
        <p className="lede mt-5">
          Pâte maison, garnitures ajoutées à la commande, cuisson au four à bois. Les articles
          indisponibles disparaissent automatiquement de cette page — ce que vous voyez est ce qui
          sort du four ce soir.
        </p>

        <div className="flex flex-wrap gap-3 mt-8">
          {openSession ? (
            <Link href={`/commander/${openSession.id}`} className="btn btn-primary">
              Commander maintenant
            </Link>
          ) : (
            <Link href="/#nous-trouver" className="btn btn-ghost">
              Voir les prochains emplacements
            </Link>
          )}
        </div>
      </div>

      <CarteClient
        orderHref={openSession ? `/commander/${openSession.id}` : "/#nous-trouver"}
        categories={categories} supplements={supplements.map((s) => ({ name: s.name, priceCents: s.priceCents }))} />
    </main>
  );
}
