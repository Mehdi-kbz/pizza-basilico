import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";

/**
 * File de commandes de l'espace admin, regroupée par créneau (§10.2) — reflet
 * direct du moteur de capacité plutôt qu'une simple liste chronologique.
 */
export async function GET(req: Request) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId requis." }, { status: 400 });

  const slots = await prisma.timeSlot.findMany({
    where: { sessionId },
    orderBy: { startAt: "asc" },
    include: {
      orders: {
        where: { status: { notIn: ["PENDING_PAYMENT", "CANCELLED"] } },
        orderBy: { dailyOrderNumber: "asc" },
        include: {
          items: { include: { menuItem: true, menuItemSize: true, addedIngredients: { include: { ingredient: true } } } },
        },
      },
    },
  });

  return NextResponse.json({ slots });
}
