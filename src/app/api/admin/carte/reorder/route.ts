import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/require-owner";

const schema = z.object({ kind: z.enum(["item", "category"]), id: z.string(), direction: z.enum(["up", "down"]) });

/** Monte / descend un article (dans sa catégorie) ou une catégorie : on renumérote tous les frères 0..n-1. */
export async function POST(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) return auth.error;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const { kind, id, direction } = parsed.data;

  const swap = <T extends { id: string }>(list: T[]) => {
    const i = list.findIndex((x) => x.id === id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= list.length) return null;
    [list[i], list[j]] = [list[j], list[i]];
    return list;
  };

  if (kind === "category") {
    const list = swap(await prisma.menuCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true } }));
    if (list) await prisma.$transaction(list.map((c, n) => prisma.menuCategory.update({ where: { id: c.id }, data: { sortOrder: n } })));
  } else {
    const item = await prisma.menuItem.findUnique({ where: { id }, select: { categoryId: true } });
    if (!item) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
    const list = swap(await prisma.menuItem.findMany({ where: { categoryId: item.categoryId }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true } }));
    if (list) await prisma.$transaction(list.map((c, n) => prisma.menuItem.update({ where: { id: c.id }, data: { sortOrder: n } })));
  }
  return NextResponse.json({ ok: true });
}
