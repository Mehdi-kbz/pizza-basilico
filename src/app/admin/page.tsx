import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";
import { AdminQueue } from "./AdminQueue";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");

  const sessions = await prisma.serviceSession.findMany({
    where: { endAt: { gt: new Date(Date.now() - 4 * 60 * 60 * 1000) } },
    orderBy: { startAt: "asc" },
    include: { location: true },
  });

  return (
    <main className="mx-auto max-w-4xl w-full px-5 py-8 flex-1">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.14em] uppercase text-[#a5462d] font-medium">Pizza Basilico</p>
          <h1 className="text-2xl font-semibold mt-1">File de commandes</h1>
        </div>
        <span className="text-xs rounded border border-[#d9d6c6] px-2 py-1">{staff.role}</span>
      </header>

      {sessions.length === 0 ? (
        <p className="text-[#585a4d]">Aucune session active. Créez-en une pour commencer à recevoir des commandes.</p>
      ) : (
        <AdminQueue
          sessions={sessions.map((s) => ({
            id: s.id,
            label: `${s.location.label} — ${new Intl.DateTimeFormat("fr-FR", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(s.startAt)}`,
          }))}
        />
      )}
    </main>
  );
}
