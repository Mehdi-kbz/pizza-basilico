import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/require-owner";
import { categorySchema } from "@/lib/carte-schemas";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  const parsed = categorySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Nom invalide." }, { status: 400 });
  const { id } = await params;
  await prisma.menuCategory.update({ where: { id }, data: { name: parsed.data.name } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const count = await prisma.menuItem.count({ where: { categoryId: id } });
  if (count > 0) return NextResponse.json({ error: "Cette catégorie contient encore des articles : déplacez-les ou supprimez-les d'abord." }, { status: 409 });
  await prisma.menuCategory.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
