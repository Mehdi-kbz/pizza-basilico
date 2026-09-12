import { NextResponse } from "next/server";
import { getStaffSession } from "@/lib/require-staff";
import { getStats } from "@/lib/digest";

export async function GET() {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [today, week] = await Promise.all([getStats(startOfDay), getStats(startOfWeek)]);
  return NextResponse.json({ today, week });
}
