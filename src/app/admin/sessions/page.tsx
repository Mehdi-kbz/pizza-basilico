import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/require-staff";
import { AdminNav } from "../AdminNav";
import { SessionsClient } from "./SessionsClient";

export default async function AdminSessionsPage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");

  return (
    <main className="mx-auto max-w-2xl w-full px-5 py-8 flex-1">
      <header className="mb-6">
        <p className="text-xs tracking-[0.14em] uppercase text-[#a5462d] font-medium">Pizza Basilico</p>
        <h1 className="text-2xl font-semibold mt-1">Emplacements & sessions</h1>
        <p className="text-[#585a4d] text-sm mt-1">
          Chaque session (lieu, horaires, capacité) est indépendante — aucune récurrence automatique.
        </p>
      </header>
      <AdminNav current="sessions" />
      <SessionsClient />
    </main>
  );
}
