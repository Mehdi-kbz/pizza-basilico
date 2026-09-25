import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";
import { AdminShell } from "../AdminShell";
import { TeamClient } from "./TeamClient";

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");
  if (staff.role !== "OWNER") {
    return <AdminShell current="equipe" title="Comptes"><div className="card p-7"><p className="display text-xl">Réservé au propriétaire.</p></div></AdminShell>;
  }
  const users = await prisma.staffUser.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true } });
  return (
    <AdminShell current="equipe" title="Comptes" subtitle="Qui peut se connecter à l'espace personnel. Connexion par e-mail et mot de passe.">
      <TeamClient meId={staff.sub} initial={users.map((u) => ({ ...u, lastLoginAt: u.lastLoginAt?.toISOString() ?? null, createdAt: u.createdAt.toISOString() }))} />
    </AdminShell>
  );
}
