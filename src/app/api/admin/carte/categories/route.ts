import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/require-owner";
import { categorySchema } from "@/lib/carte-schemas";

export async function POST(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  const parsed = categorySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Nom invalide." }, { status: 400 });
  const last = await prisma.menuCategory.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  const cat = await prisma.menuCategory.create({ data: { name: parsed.data.name, sortOrder: (last?.sortOrder ?? -1) + 1 } });
  return NextResponse.json({ id: cat.id });
}
