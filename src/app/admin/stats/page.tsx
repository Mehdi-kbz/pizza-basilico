import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/require-staff";
import { AdminNav } from "../AdminNav";
import { StatsClient } from "./StatsClient";

export default async function AdminStatsPage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");

  return (
    <main className="mx-auto max-w-2xl w-full px-5 py-8 flex-1">
      <header className="mb-6">
        <p className="text-xs tracking-[0.14em] uppercase text-[#a5462d] font-medium">Pizza Basilico</p>
        <h1 className="text-2xl font-semibold mt-1">Statistiques</h1>
      </header>
      <AdminNav current="stats" />
      <StatsClient />
    </main>
  );
}
