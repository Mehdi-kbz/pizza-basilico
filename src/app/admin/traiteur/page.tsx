import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";
import { AdminShell } from "../AdminShell";
import { InquiriesClient } from "./InquiriesClient";

export const dynamic = "force-dynamic";

export default async function AdminCateringPage() {
  const staff = await getStaffSession();
  if (!staff) redirect("/admin/login");
  const rows = await prisma.cateringInquiry.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <AdminShell current="traiteur" wide title="Traiteur & événements" subtitle="Demandes reçues via la page « Privatiser le camion ».">
      <InquiriesClient initial={rows.map((r) => ({ id: r.id, name: r.name, email: r.email, details: r.details, status: r.status, eventDate: r.eventDate?.toISOString() ?? null, createdAt: r.createdAt.toISOString() }))} />
    </AdminShell>
  );
}
