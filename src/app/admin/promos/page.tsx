import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/require-staff";
import { AdminShell } from "../AdminShell";
import { PromosClient } from "./PromosClient";

export const dynamic = "force-dynamic";

export default async function AdminPromosPage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");

  return (
    <AdminShell
      current="promos"
      role={staff.role}
      title="Codes promotionnels"
      subtitle="Pourcentage ou montant fixe, avec expiration et limite d'utilisation facultatives."
    >
      <PromosClient />
    </AdminShell>
  );
}
