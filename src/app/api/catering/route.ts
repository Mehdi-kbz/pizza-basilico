import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/** Demande traiteur / événement privé (§11.4) — hors parcours de commande standard. */
const bodySchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  eventDate: z.string().optional(),
  details: z.string().min(10).max(2000),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const body = parsed.data;

  await prisma.cateringInquiry.create({
    data: {
      name: body.name,
      email: body.email,
      eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
      details: body.details,
    },
  });

  return NextResponse.json({ ok: true });
}
