import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOrderTrackingToken } from "@/lib/auth";

/**
 * Statut d'une commande, accessible publiquement uniquement via le jeton de
 * suivi non devinable (§12.3) — jamais par identifiant seul.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("t");
  const payload = token ? verifyOrderTrackingToken(token) : null;
  if (!payload || payload.sub !== id) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const order = await prisma.order.findUnique({ where: { id }, select: { status: true } });
  if (!order) return NextResponse.json({ error: "Introuvable." }, { status: 404 });

  return NextResponse.json({ status: order.status });
}
