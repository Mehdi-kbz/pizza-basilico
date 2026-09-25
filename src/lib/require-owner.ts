import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/require-staff";

/** Garde des routes de gestion (carte, comptes…) : réservées au propriétaire. */
export async function requireOwner() {
  const staff = await getStaffSession();
  if (!staff) return { error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) } as const;
  if (staff.role !== "OWNER") return { error: NextResponse.json({ error: "Réservé au propriétaire." }, { status: 403 }) } as const;
  return { staff } as const;
}
