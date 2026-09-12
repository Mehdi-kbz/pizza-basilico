import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";

/** Ouverture / fermeture manuelle des commandes pour une session (§4) — jamais
 * de coupure automatique liée à l'heure de fin. */
const bodySchema = z.object({ isOrderingOpen: z.boolean() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const session = await prisma.serviceSession.update({
    where: { id },
    data: { isOrderingOpen: parsed.data.isOrderingOpen },
  });

  await prisma.auditLog.create({
    data: {
      staffUserId: staff.sub,
      action: parsed.data.isOrderingOpen ? "session.orders_opened" : "session.orders_closed",
      targetType: "ServiceSession",
      targetId: id,
    },
  });

  return NextResponse.json({ session });
}
