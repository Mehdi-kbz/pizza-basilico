import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";
import { isEffectivelyAvailable } from "@/lib/menu-availability";
import { AdminNav } from "../AdminNav";
import { WalkupClient } from "./WalkupClient";

export const dynamic = "force-dynamic";

export default async function AdminCommandePage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");

  const [sessions, categoriesRaw, supplements] = await Promise.all([
    prisma.serviceSession.findMany({
      where: { endAt: { gt: new Date() } },
      orderBy: { startAt: "asc" },
      include: { location: true },
    }),
    prisma.menuCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: { items: { orderBy: { sortOrder: "asc" }, include: { sizes: true, ingredients: { include: { ingredient: true } } } } },
    }),
    prisma.ingredient.findMany({ where: { isSupplement: true, isAvailable: true }, orderBy: { name: "asc" } }),
  ]);

  const categories = categoriesRaw.map((cat) => ({ ...cat, items: cat.items.filter(isEffectivelyAvailable) })).filter((c) => c.items.length > 0);

  return (
    <main className="mx-auto max-w-3xl w-full px-5 py-8 flex-1">
      <header className="mb-6">
        <p className="text-xs tracking-[0.14em] uppercase text-[#a5462d] font-medium">Pizza Basilico</p>
        <h1 className="text-2xl font-semibold mt-1">Commande assistée (comptoir)</h1>
        <p className="text-[#585a4d] text-sm mt-1">
          Pour un client sans smartphone ou préférant de l&rsquo;aide. Paiement encaissé via le terminal/espèces existant.
        </p>
      </header>
      <AdminNav current="commande" />
      <WalkupClient
        sessions={sessions.map((s) => ({
          id: s.id,
          label: `${s.location.label} — ${new Intl.DateTimeFormat("fr-FR", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(s.startAt)}`,
        }))}
        categories={categories}
        supplements={supplements}
      />
    </main>
  );
}
