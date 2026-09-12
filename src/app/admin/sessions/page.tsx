import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/require-staff";
import { AdminShell } from "../AdminShell";
import { SessionsClient } from "./SessionsClient";

export const dynamic = "force-dynamic";

export default async function AdminSessionsPage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");

  return (
    <AdminShell
      current="sessions"
      role={staff.role}
      title="Emplacements & sessions"
      subtitle="Chaque session est indépendante : lieu, horaires et capacité propres. Aucune récurrence automatique."
    >
      <SessionsClient />
    </AdminShell>
  );
}
