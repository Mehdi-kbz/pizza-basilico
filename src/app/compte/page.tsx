import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/require-customer";
import { getLoyaltyStatus, STAMPS_REQUIRED_FOR_FREE_ITEM } from "@/lib/loyalty";
import { LogoutButton } from "./LogoutButton";

export const dynamic = "force-dynamic";

const eur = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "En attente de paiement",
  CONFIRMED: "Confirmée",
  IN_PREP: "Au four",
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
      include: { session: { include: { location: true } }, items: { include: { menuItem: true } } },
    }),
    getLoyaltyStatus(session.email),
  ]);

  const stamps = Array.from({ length: STAMPS_REQUIRED_FOR_FREE_ITEM }, (_, i) => i < loyalty.stampCount);

  return (
    <main className="relative">
      <div
        className="absolute inset-x-0 top-0 h-[340px] -z-10"
        aria-hidden="true"
        style={{ background: "radial-gradient(760px 320px at 62% 0%, rgba(255,122,47,0.12), transparent 62%)" }}
      />

      <div className="mx-auto max-w-3xl px-5 lg:px-8 pt-12 md:pt-16 pb-24">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Mon compte</p>
            <h1 className="display text-[clamp(2rem,5.5vw,3rem)] mt-3">Bonjour 👋</h1>
            <p className="text-sm text-fg-dim mt-2">{session.email}</p>
          </div>
          <LogoutButton />
        </div>

        {/* Carte de fidélité */}
        <section className="card p-6 md:p-7 mt-9 relative overflow-hidden">
          <div className="ember-glow w-[300px] h-[300px] -bottom-40 -right-20 opacity-70" aria-hidden="true" />
          <div className="relative">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="display text-xl">Carte de fidélité</h2>
              <span className="chip chip-brass tnum">
                {loyalty.stampCount}/{STAMPS_REQUIRED_FOR_FREE_ITEM}
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5 mt-5">
              {stamps.map((filled, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className={`w-9 h-9 rounded-full border grid place-items-center text-xs transition-all ${
                    filled
                      ? "border-flame bg-flame/18 text-ember shadow-[0_0_16px_-4px_rgba(255,122,47,0.6)]"
                      : "border-line text-line-strong"
                  }`}
                >
                  {filled ? "🍕" : i + 1}
                </span>
              ))}
              <span
                className={`w-9 h-9 rounded-full border grid place-items-center text-[0.6rem] font-bold uppercase ${
                  loyalty.eligibleForFreeItem
                    ? "border-brass bg-brass/20 text-brass animate-pulse"
                    : "border-dashed border-line text-line-strong"
                }`}
                aria-hidden="true"
              >
                Free
              </span>
            </div>

            <p className="text-sm mt-5 leading-relaxed">
              {loyalty.eligibleForFreeItem ? (
                <span className="text-brass">
                  <strong>Une pizza offerte vous attend.</strong> Cochez la case au moment de votre
                  prochaine commande pour l&rsquo;utiliser.
                </span>
              ) : (
                <span className="text-fg-dim">
                  Encore <strong className="text-fg tnum">{loyalty.stampsUntilFree}</strong> pizza(s)
                  et la suivante est offerte. Un tampon par pizza ou panuozzo commandé.
                </span>
              )}
            </p>
          </div>
        </section>

        {/* Historique */}
        <section className="mt-12">
          <div className="flex items-center gap-4 mb-5">
            <h2 className="display text-xl whitespace-nowrap">Mes commandes</h2>
            <span className="hairline flex-1" />
          </div>

          {orders.length === 0 ? (
            <div className="card p-7 text-center">
              <p className="text-fg-dim">Aucune commande pour le moment.</p>
              <Link href="/carte" className="btn btn-primary mt-5">
                Découvrir la carte
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {orders.map((o) => (
                <li key={o.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-fg">
                        <span className="tnum text-ember font-semibold">#{o.dailyOrderNumber}</span>{" "}
                        · {o.session.location.label}
                      </p>
                      <p className="text-[0.8rem] text-fg-faint mt-1 tnum">
                        {new Date(o.createdAt).toLocaleDateString("fr-FR")} ·{" "}
                        {STATUS_LABELS[o.status] ?? o.status}
                      </p>
                      <p className="text-[0.82rem] text-fg-dim mt-2">
                        {o.items.map((i) => `${i.quantity}× ${i.menuItem.name}`).join(", ")}
                      </p>
                    </div>
                    <span className="tnum text-fg shrink-0">{eur(o.totalCents)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
