import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";
import { generateTimeSlotsForSession } from "@/lib/slots";

/** Emplacements favoris + sessions à venir/en cours, pour l'écran admin (§4). */
export async function GET() {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const [locations, sessions] = await Promise.all([
    prisma.location.findMany({ orderBy: [{ isFavorite: "desc" }, { label: "asc" }] }),
    prisma.serviceSession.findMany({
      where: { endAt: { gt: new Date(Date.now() - 4 * 60 * 60 * 1000) } },
      orderBy: { startAt: "asc" },
      include: { location: true },
    }),
  ]);

  return NextResponse.json({ locations, sessions });
}

const bodySchema = z.object({
  locationId: z.string().optional(),
  newLocation: z.object({ label: z.string().min(1), address: z.string().min(1) }).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  windowMinutes: z.number().int().min(1).max(120).default(10),
  unitsCapPerWindow: z.number().int().min(1).default(6),
  ordersCapPerWindow: z.number().int().min(1).default(4),
});

/** Création d'une session (§4) — formulaire volontairement rapide : emplacement
 * favori en un tap, valeurs de capacité pré-remplies par le formulaire côté client. */
export async function POST(req: Request) {
  const staff = await getStaffSession();
  if (!staff) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const body = parsed.data;

  if (!body.locationId && !body.newLocation) {
    return NextResponse.json({ error: "Emplacement requis." }, { status: 400 });
  }
  if (new Date(body.endAt) <= new Date(body.startAt)) {
    return NextResponse.json({ error: "L'heure de fin doit être après l'heure de début." }, { status: 400 });
  }

  const locationId = body.locationId
    ? body.locationId
    : (await prisma.location.create({ data: { ...body.newLocation!, isFavorite: true } })).id;

  const session = await prisma.serviceSession.create({
    data: {
      locationId,
      startAt: new Date(body.startAt),
      endAt: new Date(body.endAt),
      windowMinutes: body.windowMinutes,
      unitsCapPerWindow: body.unitsCapPerWindow,
      ordersCapPerWindow: body.ordersCapPerWindow,
    },
  });
  await generateTimeSlotsForSession(session.id);

  await prisma.auditLog.create({
    data: { staffUserId: staff.sub, action: "session.created", targetType: "ServiceSession", targetId: session.id },
  });

  return NextResponse.json({ session });
}
