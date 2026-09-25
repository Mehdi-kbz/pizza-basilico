import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";
import { AdminShell } from "../AdminShell";
import { ApplicationsClient } from "./ApplicationsClient";

export const dynamic = "force-dynamic";

export default async function AdminRecruitmentPage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");

  // Le contenu du CV (cvData) n'est jamais chargé dans la liste : il est servi à la demande.
  const rows = await prisma.jobApplication.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, phone: true, email: true, message: true, cvFileName: true, cvSize: true, status: true, createdAt: true },
  });

  return (
    <AdminShell
      current="recrutement"
      role={staff.role}
      wide
      title="Recrutement"
      subtitle="Candidatures reçues via la page « Rejoignez-nous », avec le CV et les coordonnées."
    >
      <ApplicationsClient
        canDelete={staff.role === "OWNER"}
        initial={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
      />
    </AdminShell>
  );
}
