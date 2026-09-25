import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";
import { startOfDayParis, PAID_STATUSES } from "@/lib/admin-time";
import { AdminShell } from "./AdminShell";

export const dynamic = "force-dynamic";

const eur = (c: number) => (c / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const when = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Paiement en attente", CONFIRMED: "Confirmée", IN_PREP: "En préparation", READY: "Prête",
  COMPLETED: "Retirée", CANCELLED: "Annulée", REFUNDED: "Remboursée", NO_SHOW: "Non retirée",
};

export default async function AdminDashboardPage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");

  const today = startOfDayParis();
  const weekAgo = new Date(today.getTime() - 6 * 24 * 3600 * 1000);
  const paid = { in: [...PAID_STATUSES] };

  const [todayAgg, weekAgg, live, applications, catering, outOfStock, sessions, recent] = await Promise.all([
    prisma.order.aggregate({ where: { status: paid, createdAt: { gte: today } }, _count: true, _sum: { totalCents: true } }),
    prisma.order.aggregate({ where: { status: paid, createdAt: { gte: weekAgo } }, _count: true, _sum: { totalCents: true } }),
    prisma.order.count({ where: { status: { in: ["CONFIRMED", "IN_PREP", "READY"] } } }),
    prisma.jobApplication.count({ where: { status: "NEW" } }),
    prisma.cateringInquiry.count({ where: { status: "NEW" } }),
    prisma.ingredient.count({ where: { isAvailable: false } }),
    prisma.serviceSession.findMany({ where: { endAt: { gt: new Date() } }, orderBy: { startAt: "asc" }, take: 3, include: { location: true } }),
    prisma.order.findMany({ where: { status: { not: "PENDING_PAYMENT" } }, orderBy: { createdAt: "desc" }, take: 8, select: { id: true, dailyOrderNumber: true, pickupName: true, totalCents: true, status: true, createdAt: true } }),
  ]);

  const kpis = [
    { label: "Commandes aujourd'hui", value: String(todayAgg._count), sub: eur(todayAgg._sum.totalCents ?? 0), href: "/admin/commandes", icon: "🧾" },
    { label: "Chiffre d'affaires 7 jours", value: eur(weekAgg._sum.totalCents ?? 0), sub: `${weekAgg._count} commandes`, href: "/admin/stats", icon: "📈" },
    { label: "En cours au four", value: String(live), sub: "à préparer / à remettre", href: "/admin/file", icon: "🔥", alert: live > 0 },
    { label: "Candidatures", value: String(applications), sub: "nouvelles", href: "/admin/recrutement", icon: "💼", alert: applications > 0 },
    { label: "Demandes traiteur", value: String(catering), sub: "nouvelles", href: "/admin/traiteur", icon: "🎉", alert: catering > 0 },
    { label: "Ingrédients en rupture", value: String(outOfStock), sub: outOfStock ? "à réapprovisionner" : "tout est disponible", href: "/admin/menu", icon: "⚠️", alert: outOfStock > 0 },
  ];

  return (
    <AdminShell current="dashboard" wide title="Tableau de bord" subtitle="L'essentiel du jour, en un coup d'œil.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="card p-4 sm:p-5 transition-transform hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <span className="text-2xl" aria-hidden="true">{k.icon}</span>
              {k.alert && <span className="h-2.5 w-2.5 rounded-full bg-tomato" aria-label="À traiter" />}
            </div>
            <p className="display mt-3 text-[clamp(1.5rem,4vw,2.1rem)] tnum">{k.value}</p>
            <p className="mt-1 text-[0.8rem] font-semibold">{k.label}</p>
            <p className="text-xs text-fg-faint">{k.sub}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="display text-xl">Dernières commandes</h2>
            <Link href="/admin/commandes" className="text-sm text-ember hover:underline">Tout voir →</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-fg-dim">Aucune commande pour le moment.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((o) => (
                <li key={o.id} className="flex items-center gap-3 py-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-bold text-ember tnum">#{o.dailyOrderNumber}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{o.pickupName}</span>
                    <span className="block text-xs text-fg-faint">{when.format(o.createdAt)}</span>
                  </span>
                  <span className="chip !text-[0.62rem]">{STATUS_LABEL[o.status] ?? o.status}</span>
                  <span className="w-16 text-right text-sm font-semibold tnum">{eur(o.totalCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <section className="card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="display text-xl">Prochaines sessions</h2>
              <Link href="/admin/sessions" className="text-sm text-ember hover:underline">Gérer →</Link>
            </div>
            {sessions.length === 0 ? (
              <p className="text-sm text-fg-dim">Aucune session programmée. Créez-en une pour ouvrir les commandes.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {sessions.map((s) => (
                  <li key={s.id} className="rounded-2xl bg-surface-2/60 p-3.5 text-sm">
                    <p className="font-semibold">{s.location.label}</p>
                    <p className="capitalize text-fg-dim">{when.format(s.startAt)}</p>
                    <span className={`chip mt-2 !text-[0.62rem] ${s.isOrderingOpen ? "chip-basil" : ""}`}>{s.isOrderingOpen ? "Commandes ouvertes" : "Commandes fermées"}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="display mb-4 text-xl">Raccourcis</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["/admin/commande", "🧾 Prendre une commande"],
                ["/admin/carte", "🍕 Modifier la carte"],
                ["/admin/promos", "🏷️ Créer un code promo"],
                ["/admin/menu", "✅ Marquer une rupture"],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="btn btn-ghost !justify-start !py-3 !px-4 !text-[0.8rem]">{label}</Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
