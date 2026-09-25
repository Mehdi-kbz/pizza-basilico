import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";
import { AdminShell } from "../AdminShell";

export const dynamic = "force-dynamic";
const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" });

export default async function AdminNewsletterPage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");
  const now = new Date();
  const [active, expired, unsub, rows] = await Promise.all([
    prisma.newsletterConsent.count({ where: { unsubscribedAt: null, expiresAt: { gt: now } } }),
    prisma.newsletterConsent.count({ where: { unsubscribedAt: null, expiresAt: { lte: now } } }),
    prisma.newsletterConsent.count({ where: { unsubscribedAt: { not: null } } }),
    prisma.newsletterConsent.findMany({ where: { unsubscribedAt: null, expiresAt: { gt: now } }, orderBy: { consentAt: "desc" }, take: 200, include: { customer: { select: { email: true } } } }),
  ]);
  return (
    <AdminShell
      current="newsletter" wide title="Newsletter" subtitle="Abonnés ayant donné leur consentement (valable 3 ans)."
      actions={<a href="/api/admin/newsletter/export" className="btn btn-primary !py-2.5 !px-5 !text-[0.85rem]">Exporter en CSV</a>}
    >
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[["Abonnés actifs", active], ["Consentements expirés", expired], ["Désinscrits", unsub]].map(([l, v]) => (
          <div key={l as string} className="card p-4 text-center"><p className="display text-3xl text-ember tnum">{v}</p><p className="mt-1 text-xs text-fg-dim">{l}</p></div>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="card p-7"><p className="display text-xl">Aucun abonné pour le moment.</p></div>
      ) : (
        <ul className="card divide-y divide-line !rounded-3xl">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm">
              <span className="min-w-0 truncate font-medium">{r.customer.email}</span>
              <span className="shrink-0 text-xs text-fg-faint">inscrit le {fmt.format(r.consentAt)}</span>
            </li>
          ))}
        </ul>
      )}
      {active > 200 && <p className="mt-3 text-xs text-fg-faint">200 derniers abonnés affichés — l&rsquo;export CSV contient la liste complète.</p>}
    </AdminShell>
  );
}
