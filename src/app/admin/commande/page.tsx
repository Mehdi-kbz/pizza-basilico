import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";
import { isEffectivelyAvailable } from "@/lib/menu-availability";
import { AdminShell } from "../AdminShell";
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
      include: {
        items: { orderBy: { sortOrder: "asc" }, include: { sizes: true, ingredients: { include: { ingredient: true } } } },
      },
    }),
    prisma.ingredient.findMany({ where: { isSupplement: true, isAvailable: true }, orderBy: { name: "asc" } }),
  ]);

  const categories = categoriesRaw
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      items: cat.items.filter(isEffectivelyAvailable).map((i) => ({
        id: i.id,
        name: i.name,
        sizes: i.sizes.map((s) => ({ id: s.id, label: s.label, priceCents: s.priceCents })),
      })),
    }))
    .filter((c) => c.items.length > 0);

  return (
    <AdminShell
      current="commande"
      role={staff.role}
      wide
      title="Commande au comptoir"
      subtitle="Pour un client sans smartphone ou pressé. Le paiement est encaissé via le terminal ou en espèces, comme d'habitude."
    >
      <WalkupClient
        sessions={sessions.map((s) => ({
          id: s.id,
          label: `${s.location.label} — ${new Intl.DateTimeFormat("fr-FR", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(s.startAt)}`,
        }))}
        categories={categories}
        supplements={supplements.map((s) => ({ id: s.id, name: s.name, priceCents: s.priceCents }))}
      />
    </AdminShell>
  );
}
