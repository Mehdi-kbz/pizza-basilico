import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/require-customer";
import { getLoyaltyStatus, STAMPS_REQUIRED_FOR_FREE_ITEM } from "@/lib/loyalty";
import { LogoutButton } from "./LogoutButton";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "En attente de paiement",
  CONFIRMED: "Confirmée",
  IN_PREP: "En préparation",
  READY: "Prête",
  COMPLETED: "Récupérée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
  NO_SHOW: "Non récupérée",
};

export default async function ComptePage() {
  const session = await getCustomerSession();
  if (!session) redirect("/compte/connexion");

  const [orders, loyalty] = await Promise.all([
    prisma.order.findMany({
      where: { customerId: session.sub },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { session: { include: { location: true } }, items: { include: { menuItem: true, menuItemSize: true } } },
    }),
    getLoyaltyStatus(session.email),
  ]);

  const eur = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

  return (
    <main className="mx-auto max-w-2xl w-full px-5 py-8 flex-1">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.14em] uppercase text-[#a5462d] font-medium">Pizza Basilico</p>
          <h1 className="text-2xl font-semibold mt-1">Mon compte</h1>
          <p className="text-[#585a4d] text-sm">{session.email}</p>
        </div>
        <LogoutButton />
      </header>

      <section className="rounded-lg border border-[#3b5a34] bg-[#e4e9dc] p-5 mb-6">
        <p className="font-medium text-[#2c4527]">
          {loyalty.eligibleForFreeItem
            ? "🎉 Vous avez une pizza offerte disponible !"
            : `${loyalty.stampCount} tampon${loyalty.stampCount > 1 ? "s" : ""} — encore ${loyalty.stampsUntilFree} pour une pizza offerte (sur ${STAMPS_REQUIRED_FOR_FREE_ITEM})`}
        </p>
      </section>

      <h2 className="font-semibold mb-3">Historique de commandes</h2>
      {orders.length === 0 ? (
        <p className="text-[#585a4d] text-sm">Aucune commande pour le moment.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {orders.map((o) => (
            <li key={o.id} className="rounded-lg border border-[#d9d6c6] bg-white/60 p-4 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">
                  #{o.dailyOrderNumber} — {o.session.location.label}
                </span>
                <span>{eur(o.totalCents)}</span>
              </div>
              <p className="text-[#585a4d] text-xs mt-0.5">
                {new Date(o.createdAt).toLocaleDateString("fr-FR")} — {STATUS_LABELS[o.status] ?? o.status}
              </p>
              <p className="text-[#585a4d] mt-1">
                {o.items.map((i) => `${i.quantity}× ${i.menuItem.name}`).join(", ")}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
