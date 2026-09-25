import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";

/** Export CSV des abonnés actifs (consentement non expiré, non désinscrits). */
export async function GET() {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const rows = await prisma.newsletterConsent.findMany({
    where: { unsubscribedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { consentAt: "desc" },
    include: { customer: { select: { email: true } } },
  });
  const csv = ["email,inscrit_le,consentement_valide_jusqu_au", ...rows.map((r) => `${r.customer.email},${r.consentAt.toISOString()},${r.expiresAt.toISOString()}`)].join("\n");
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="abonnes-newsletter.csv"', "Cache-Control": "private, no-store" },
  });
}
