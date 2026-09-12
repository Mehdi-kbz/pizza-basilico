import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/require-staff";
import { AdminShell } from "../AdminShell";
import { StatsClient } from "./StatsClient";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");

  return (
    <AdminShell current="stats" role={staff.role} title="Statistiques" subtitle="Aujourd'hui et sur les sept derniers jours.">
      <StatsClient />
    </AdminShell>
  );
}
