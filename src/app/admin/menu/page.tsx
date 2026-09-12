import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/require-staff";
import { AdminShell } from "../AdminShell";
import { MenuAvailabilityClient } from "./MenuAvailabilityClient";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");

  return (
    <AdminShell
      current="menu"
      role={staff.role}
      title="Disponibilité du menu"
      subtitle="Désactiver un ingrédient masque automatiquement toute pizza qui en dépend. Réversible en un geste."
    >
      <MenuAvailabilityClient />
    </AdminShell>
  );
}
