import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";
import { AdminShell } from "../AdminShell";
import { AdminQueue } from "../AdminQueue";

export const dynamic = "force-dynamic";

export default async function AdminQueuePage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");

  const sessions = await prisma.serviceSession.findMany({
    where: { endAt: { gt: new Date(Date.now() - 4 * 60 * 60 * 1000) } },
    orderBy: { startAt: "asc" },
    include: { location: true },
  });

  return (
    <AdminShell
      current="file"
      wide
      title="File de commandes"
      subtitle="Regroupée par créneau de cuisson. Mise à jour en direct, avec alerte à chaque nouvelle commande."
    >
      {sessions.length === 0 ? (
        <div className="card p-7">
          <p className="display text-xl">Aucune session active.</p>
          <p className="text-sm text-fg-dim mt-2.5">
            Créez une session dans l&rsquo;onglet Sessions pour commencer à recevoir des commandes.
          </p>
        </div>
      ) : (
        <AdminQueue
          sessions={sessions.map((s) => ({
            id: s.id,
            label: `${s.location.label} — ${new Intl.DateTimeFormat("fr-FR", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(s.startAt)}`,
          }))}
        />
      )}
    </AdminShell>
  );
}
