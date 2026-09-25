import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";
import { PAID_STATUSES } from "@/lib/admin-time";
import { STAMPS_REQUIRED_FOR_FREE_ITEM } from "@/lib/loyalty";
import { AdminShell } from "../AdminShell";
import { StampEditor } from "./StampEditor";

export const dynamic = "force-dynamic";

const PAGE = 30;
const eur = (c: number) => (c / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const day = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" });

export default async function AdminClientsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");

  const { q = "", page: p } = await searchParams;
  const page = Math.max(1, Number(p) || 1);
  const where = q.trim() ? { email: { contains: q.trim(), mode: "insensitive" as const } } : {};

  const [total, customers, redeemable] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE, include: { loyaltyCard: true, newsletterConsent: true, _count: { select: { orders: true } } } }),
    prisma.loyaltyCard.count({ where: { stampCount: { gte: STAMPS_REQUIRED_FOR_FREE_ITEM } } }),
  ]);

  const spent = await prisma.order.groupBy({ by: ["customerId"], where: { customerId: { in: customers.map((c) => c.id) }, status: { in: [...PAID_STATUSES] } }, _sum: { totalCents: true }, _count: true });
  const spentBy = new Map(spent.map((s) => [s.customerId, s]));
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (n: number) => `/admin/clients?${new URLSearchParams({ ...(q ? { q } : {}), page: String(n) })}`;

  return (
    <AdminShell current="clients" wide title="Clients & fidélité" subtitle={`${total} client${total > 1 ? "s" : ""} · ${redeemable} avec une pizza offerte disponible (${STAMPS_REQUIRED_FOR_FREE_ITEM} pizzas = 1 offerte).`}>
      <form className="mb-5 flex gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Rechercher par e-mail" className="field flex-1" />
        <button className="btn btn-primary !py-3">Chercher</button>
        {q && <Link href="/admin/clients" className="btn btn-ghost !py-3">Réinitialiser</Link>}
      </form>

      {customers.length === 0 ? (
        <div className="card p-7"><p className="display text-xl">Aucun client trouvé.</p></div>
      ) : (
        <ul className="flex flex-col gap-3">
          {customers.map((c) => {
            const s = spentBy.get(c.id);
            return (
              <li key={c.id} className="card p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="truncate font-semibold">{c.email}</p>
                    <p className="text-xs text-fg-faint">Client depuis le {day.format(c.createdAt)}{c.newsletterConsent && !c.newsletterConsent.unsubscribedAt ? " · newsletter ✓" : ""}</p>
                  </div>
                  <div className="text-sm tnum"><p className="font-semibold">{s?._count ?? 0} commande{(s?._count ?? 0) > 1 ? "s" : ""}</p><p className="text-fg-faint">{eur(s?._sum.totalCents ?? 0)} dépensés</p></div>
                  <StampEditor customerId={c.id} stamps={c.loyaltyCard?.stampCount ?? 0} required={STAMPS_REQUIRED_FOR_FREE_ITEM} canEdit={staff.role === "OWNER"} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-3 text-sm" aria-label="Pagination">
          {page > 1 && <Link href={link(page - 1)} className="btn btn-ghost !py-2">← Précédent</Link>}
          <span className="text-fg-dim tnum">Page {page} / {pages}</span>
          {page < pages && <Link href={link(page + 1)} className="btn btn-ghost !py-2">Suivant →</Link>}
        </nav>
      )}
    </AdminShell>
  );
}
