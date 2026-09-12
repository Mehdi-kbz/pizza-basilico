import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/require-staff";
import { AdminNav } from "../AdminNav";
import { MenuAvailabilityClient } from "./MenuAvailabilityClient";

export default async function AdminMenuPage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");

  return (
    <main className="mx-auto max-w-3xl w-full px-5 py-8 flex-1">
      <header className="mb-6">
        <p className="text-xs tracking-[0.14em] uppercase text-[#a5462d] font-medium">Pizza Basilico</p>
        <h1 className="text-2xl font-semibold mt-1">Disponibilité du menu</h1>
        <p className="text-[#585a4d] text-sm mt-1">
          Désactiver un ingrédient masque automatiquement toute pizza qui en dépend.
        </p>
      </header>
      <AdminNav current="menu" />
      <MenuAvailabilityClient />
    </main>
  );
}
