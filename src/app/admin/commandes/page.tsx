import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";
import type { Prisma, OrderStatus } from "@/generated/prisma/client";
import { AdminShell } from "../AdminShell";
import { OrderActions } from "./OrderActions";

export const dynamic = "force-dynamic";

const PAGE = 25;
const eur = (c: number) => (c / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const when = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING_PAYMENT: { label: "Paiement en attente", cls: "" },
  CONFIRMED: { label: "Confirmée", cls: "chip-flame" },
  IN_PREP: { label: "En préparation", cls: "chip-flame" },
  READY: { label: "Prête", cls: "chip-basil" },
  COMPLETED: { label: "Retirée", cls: "chip-basil" },
  CANCELLED: { label: "Annulée", cls: "" },
  REFUNDED: { label: "Remboursée", cls: "" },
  NO_SHOW: { label: "Non retirée", cls: "" },
};

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = sp.status && STATUS[sp.status] ? (sp.status as OrderStatus) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { pickupName: { contains: q, mode: "insensitive" } },
            { guestEmail: { contains: q, mode: "insensitive" } },
            ...(/^\d+$/.test(q) ? [{ dailyOrderNumber: Number(q) }] : []),
          ],
        }
      : {}),
  };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: {
        session: { include: { location: true } },
        timeSlot: true,
        items: { include: { menuItem: true, menuItemSize: true, addedIngredients: { include: { ingredient: true } }, removedIngredients: { include: { ingredient: true } } } },
      },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (p: number) => `/admin/commandes?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), page: String(p) })}`;

  return (
    <AdminShell current="commandes" wide title="Commandes" subtitle={`${total} commande${total > 1 ? "s" : ""} — recherche par nom, e-mail ou numéro.`}>
      <form className="mb-5 flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Nom, e-mail ou n°" className="field !w-auto min-w-[220px] flex-1" />
        <select name="status" defaultValue={status ?? ""} className="field !w-auto">
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <button className="btn btn-primary !py-3">Filtrer</button>
        {(q || status) && <Link href="/admin/commandes" className="btn btn-ghost !py-3">Réinitialiser</Link>}
      </form>

      {orders.length === 0 ? (
        <div className="card p-7"><p className="display text-xl">Aucune commande trouvée.</p></div>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((o) => (
            <li key={o.id} className="card overflow-hidden">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:p-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-bold text-ember tnum">#{o.dailyOrderNumber}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{o.pickupName}</span>
                    <span className="block truncate text-xs text-fg-faint">{when.format(o.createdAt)} · {o.guestEmail}</span>
                  </span>
                  <span className={`chip hidden sm:inline-flex ${STATUS[o.status]?.cls ?? ""}`}>{STATUS[o.status]?.label ?? o.status}</span>
                  <span className="tnum text-right font-semibold">{eur(o.totalCents)}</span>
                  <span className="text-fg-faint transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
                </summary>

                <div className="border-t border-line bg-surface-2/30 p-4 sm:p-5">
                  <p className="mb-3 sm:hidden"><span className={`chip ${STATUS[o.status]?.cls ?? ""}`}>{STATUS[o.status]?.label ?? o.status}</span></p>
                  <div className="grid gap-4 text-sm sm:grid-cols-3">
                    <div><p className="eyebrow mb-0.5">Retrait</p><p>{o.session.location.label}</p><p className="text-fg-faint tnum">{new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(o.timeSlot.startAt)}</p></div>
                    <div><p className="eyebrow mb-0.5">Paiement</p><p>{o.paidInPerson ? "Sur place" : o.paymentProvider ?? "—"}</p><p className="text-fg-faint">{o.paymentStatus}{o.channel !== "ONLINE" ? ` · ${o.channel}` : ""}</p></div>
                    <div><p className="eyebrow mb-0.5">Montants</p><p className="tnum">Sous-total {eur(o.subtotalCents)}</p>{o.discountCents > 0 && <p className="tnum text-basil">Remise −{eur(o.discountCents)}</p>}{o.tipCents > 0 && <p className="tnum">Pourboire {eur(o.tipCents)}</p>}</div>
                  </div>

                  <ul className="mt-4 flex flex-col gap-2 rounded-2xl bg-white p-4 text-sm">
                    {o.items.map((it) => (
                      <li key={it.id} className="flex justify-between gap-4">
                        <span className="min-w-0">
                          <span className="tnum font-semibold">{it.quantity}× </span>{it.menuItem.name}
                          {it.menuItemSize && <span className="text-fg-faint"> · {it.menuItemSize.label}</span>}
                          {it.addedIngredients.length > 0 && <span className="block text-xs text-ember">+ {it.addedIngredients.map((a) => a.ingredient.name).join(", ")}</span>}
                          {it.removedIngredients.length > 0 && <span className="block text-xs text-tomato">Sans {it.removedIngredients.map((a) => a.ingredient.name.toLowerCase()).join(", ")}</span>}
                          {it.note && <span className="block text-xs italic text-fg-faint">« {it.note} »</span>}
                        </span>
                        <span className="tnum shrink-0 text-fg-dim">{eur(it.unitPriceCents * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  {o.note && <p className="mt-3 text-sm"><strong>Note client :</strong> {o.note}</p>}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <OrderActions id={o.id} status={o.status} paid={o.paymentStatus === "SUCCEEDED" && !o.paidInPerson} />
                    <a href={`mailto:${o.guestEmail}`} className="text-sm text-ember hover:underline">Écrire au client</a>
                  </div>
                </div>
              </details>
            </li>
          ))}
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
