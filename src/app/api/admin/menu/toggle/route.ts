import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";

/**
 * Rupture de stock / réactivation en un geste (§5.4). Le personnel bascule
 * un article ou un ingrédient ; la disponibilité en cascade des pizzas
 * concernées est recalculée à la volée (voir src/lib/menu-availability.ts),
 * jamais réécrite ici.
 */
const bodySchema = z.object({
  kind: z.enum(["item", "ingredient"]),
  id: z.string(),
  isAvailable: z.boolean(),
});

export async function PATCH(req: Request) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const { kind, id, isAvailable } = parsed.data;

  if (kind === "item") {
    await prisma.menuItem.update({ where: { id }, data: { isAvailable } });
  } else {
    await prisma.ingredient.update({ where: { id }, data: { isAvailable } });
  }

  await prisma.auditLog.create({
    data: {
      staffUserId: staff.sub,
      action: isAvailable ? "menu.reactivated" : "menu.disabled",
      targetType: kind === "item" ? "MenuItem" : "Ingredient",
      targetId: id,
    },
  });

  return NextResponse.json({ ok: true });
}
