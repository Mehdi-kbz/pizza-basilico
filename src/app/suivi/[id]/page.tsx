import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyOrderTrackingToken } from "@/lib/auth";
import { StatusView } from "./StatusView";
import { PushPrompt } from "./PushPrompt";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "En attente de paiement",
  CONFIRMED: "Confirmée",
  IN_PREP: "En préparation",
  READY: "Prête — venez la récupérer !",
  COMPLETED: "Récupérée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
  NO_SHOW: "Non récupérée",
};

export default async function SuiviPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string; payment_intent?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;

  if (!t) notFound();
  const payload = verifyOrderTrackingToken(t);
  if (!payload || payload.sub !== id) notFound();

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { menuItem: true, menuItemSize: true, addedIngredients: { include: { ingredient: true } } } },
      session: { include: { location: true } },
    },
  });
  if (!order) notFound();

  const eur = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  const timeFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", hour: "2-digit", minute: "2-digit" });

  return (
    <main className="mx-auto max-w-lg w-full px-5 py-10 flex-1">
      <p className="text-xs tracking-[0.14em] uppercase text-[#a5462d] font-medium">Pizza Basilico</p>
      <h1 className="text-2xl font-semibold mt-1">Commande #{order.dailyOrderNumber}</h1>
      <p className="text-[#585a4d] text-sm mb-6">
        {order.session.location.label} — {timeFmt.format(order.session.startAt)}
      </p>

      <StatusView orderId={order.id} initialStatus={order.status} statusLabels={STATUS_LABELS} />
      <PushPrompt orderId={order.id} />

      <section className="rounded-lg border border-[#d9d6c6] bg-white/60 p-5 mt-4">
        <p className="font-medium mb-2">Retrait au nom de {order.pickupName}</p>
        <ul className="text-sm text-[#585a4d] flex flex-col gap-1">
          {order.items.map((it) => (
            <li key={it.id}>
              {it.quantity}× {it.menuItem.name} {it.menuItemSize ? `(${it.menuItemSize.label})` : ""}
              {it.addedIngredients.length > 0 && <> + {it.addedIngredients.map((a) => a.ingredient.name).join(", ")}</>}
            </li>
          ))}
        </ul>
        {order.note && <p className="text-sm italic text-[#585a4d] mt-2">« {order.note} »</p>}
        <p className="font-medium mt-3">Total : {eur(order.totalCents)}</p>
      </section>

      <p className="text-sm text-[#585a4d] mt-6">
        Un souci avec cette commande ?{" "}
        <a href={`mailto:contact@pizza.mehdi.website?subject=Commande%20%23${order.dailyOrderNumber}`} className="underline text-[#3b5a34]">
          Signaler un problème
        </a>
      </p>
    </main>
  );
}
