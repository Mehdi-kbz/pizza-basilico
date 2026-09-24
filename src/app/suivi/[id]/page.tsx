import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifyOrderTrackingToken } from "@/lib/auth";
import { StatusView } from "./StatusView";
import { PushPrompt } from "./PushPrompt";
import { ClearCart } from "./ClearCart";
import { ConfirmationCard } from "@/components/ConfirmationCard";

export const dynamic = "force-dynamic";

const eur = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export default async function SuiviPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string; paid?: string; redirect_status?: string }>;
}) {
  const { id } = await params;
  const { t, paid, redirect_status } = await searchParams;

  if (!t) notFound();
  const payload = verifyOrderTrackingToken(t);
  if (!payload || payload.sub !== id) notFound();

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { menuItem: true, menuItemSize: true, addedIngredients: { include: { ingredient: true } }, removedIngredients: { include: { ingredient: true } } } },
      session: { include: { location: true } },
      timeSlot: true,
    },
  });
  if (!order) notFound();

  const timeFmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  // Retour d'un paiement avec redirection : on affiche la carte de confirmation.
  // (le webhook peut avoir quelques secondes de retard : `redirect_status=succeeded` suffit)
  const settled = order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED";
  if (paid && redirect_status !== "failed" && (redirect_status === "succeeded" || settled)) {
    return (
      <main className="px-4 pt-10 md:pt-14 pb-20">
        <ClearCart />
        <ConfirmationCard
          orderNumber={order.dailyOrderNumber}
          name={order.pickupName}
          totalCents={order.totalCents}
          email={order.guestEmail ?? undefined}
          slot={{ start: order.timeSlot.startAt, end: order.timeSlot.endAt }}
          trackingUrl={`/suivi/${order.id}?t=${t}`}
          items={order.items.map((it) => ({
            quantity: it.quantity,
            name: it.menuItem.name,
            size: it.menuItemSize?.label,
            details: [
              ...(it.addedIngredients.length ? [`+ ${it.addedIngredients.map((a) => a.ingredient.name).join(", ")}`] : []),
              ...(it.removedIngredients.length
                ? [`Sans ${it.removedIngredients.map((a) => a.ingredient.name.toLowerCase()).join(", ")}`]
                : []),
              ...(it.note ? [`« ${it.note} »`] : []),
            ],
            lineTotalCents: it.unitPriceCents * it.quantity,
          }))}
        />
      </main>
    );
  }

  return (
    <main className="relative">
      <div
        className="absolute inset-x-0 top-0 h-[340px] -z-10"
        aria-hidden="true"
        style={{ background: "radial-gradient(760px 320px at 60% 0%, rgba(255,122,47,0.14), transparent 62%)" }}
      />

      <div className="mx-auto max-w-2xl px-5 lg:px-8 pt-12 md:pt-16 pb-20">
        <p className="eyebrow">Suivi de commande</p>
        <div className="flex items-end justify-between gap-4 mt-3">
          <h1 className="display text-[clamp(2rem,6vw,3.2rem)]">
            Commande <span className="text-ember tnum">#{order.dailyOrderNumber}</span>
          </h1>
        </div>
        <p className="text-sm text-fg-dim mt-3 capitalize">
          {order.session.location.label} · {dayFmt.format(order.session.startAt)}
        </p>

        <div className="card p-5 mt-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-fg-faint">Créneau de retrait</p>
            <p className="display text-2xl text-fg tnum mt-1">
              {timeFmt.format(order.timeSlot.startAt)} – {timeFmt.format(order.timeSlot.endAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-fg-faint">Au nom de</p>
            <p className="display text-xl text-fg mt-1">{order.pickupName}</p>
          </div>
        </div>

        <div className="mt-6">
          <StatusView orderId={order.id} initialStatus={order.status} />
        </div>

        <PushPrompt orderId={order.id} />

        <section className="card p-5 md:p-6 mt-6">
          <h2 className="display text-lg mb-4">Le détail</h2>
          <ul className="flex flex-col gap-2.5 text-sm">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-start justify-between gap-4">
                <span className="min-w-0">
                  <span className="tnum text-fg-faint">{it.quantity}× </span>
                  <span className="text-fg">{it.menuItem.name}</span>
                  {it.menuItemSize && <span className="text-fg-faint"> · {it.menuItemSize.label}</span>}
                  {it.addedIngredients.length > 0 && (
                    <span className="block text-[0.75rem] text-ember/80">
                      + {it.addedIngredients.map((a) => a.ingredient.name).join(", ")}
                    </span>
                  )}
                  {it.removedIngredients.length > 0 && (
                    <span className="block text-[0.75rem] text-fg-faint">
                      Sans {it.removedIngredients.map((a) => a.ingredient.name.toLowerCase()).join(", ")}
                    </span>
                  )}
                  {it.note && <span className="block text-[0.75rem] italic text-fg-faint">« {it.note} »</span>}
                </span>
                <span className="tnum text-fg-dim shrink-0">{eur(it.unitPriceCents * it.quantity)}</span>
              </li>
            ))}
          </ul>

          {order.note && (
            <p className="text-[0.82rem] text-fg-faint italic mt-4 border-l-2 border-line-strong pl-3">
              « {order.note} »
            </p>
          )}

          <div className="hairline my-5" />

          <div className="flex flex-col gap-1.5 text-sm">
            {order.discountCents > 0 && (
              <div className="flex justify-between text-basil">
                <span>Remise</span>
                <span className="tnum">−{eur(order.discountCents)}</span>
              </div>
            )}
            {order.tipCents > 0 && (
              <div className="flex justify-between text-fg-dim">
                <span>Pourboire</span>
                <span className="tnum">{eur(order.tipCents)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline">
              <span className="display text-lg">Total payé</span>
              <span className="display text-2xl text-ember tnum">{eur(order.totalCents)}</span>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap gap-4 justify-between items-center mt-8 text-sm">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.session.location.address)}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost !py-2.5 !px-5 !text-[0.85rem]"
          >
            Itinéraire vers le camion
          </a>
          <a
            href={`mailto:contact@pizza.mehdi.website?subject=${encodeURIComponent(`Problème commande #${order.dailyOrderNumber}`)}`}
            className="text-fg-faint hover:text-fg-dim transition-colors"
          >
            Signaler un problème
          </a>
        </div>

        <p className="text-xs text-fg-faint mt-10">
          Gardez ce lien : il vous donne accès au suivi en direct.{" "}
          <Link href="/" className="text-ember hover:underline">
            Retour à l&rsquo;accueil
          </Link>
        </p>
      </div>
    </main>
  );
}
