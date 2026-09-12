import { prisma } from "@/lib/prisma";
import { OrderStatus, Prisma } from "@/generated/prisma/client";

/**
 * Moteur de gestion des créneaux — cœur du système (cahier des spécifications §6).
 *
 * Principes :
 *  - fenêtres fixes ancrées sur l'heure d'ouverture de la session (pas de fenêtre glissante) ;
 *  - double plafond par fenêtre : unités de capacité (pizzas, poids de préparation)
 *    et nombre de commandes distinctes ;
 *  - réservation atomique via verrouillage de ligne (SELECT ... FOR UPDATE) pour
 *    empêcher toute survente en cas de requêtes concurrentes ;
 *  - "hold" temporaire pendant le paiement, libéré automatiquement s'il expire.
 */

const HOLD_MINUTES = 8;

export class SlotFullError extends Error {
  constructor(message = "Ce créneau est complet.") {
    super(message);
    this.name = "SlotFullError";
  }
}

/**
 * Génère les créneaux (tranches de `windowMinutes`) d'une session, de son ouverture
 * à sa fermeture. À appeler une fois, à la création/publication de la session.
 */
export async function generateTimeSlotsForSession(sessionId: string) {
  const session = await prisma.serviceSession.findUniqueOrThrow({ where: { id: sessionId } });

  const slots: Prisma.TimeSlotCreateManyInput[] = [];
  let cursor = new Date(session.startAt);
  while (cursor < session.endAt) {
    const end = new Date(
      Math.min(cursor.getTime() + session.windowMinutes * 60_000, session.endAt.getTime())
    );
    slots.push({
      sessionId,
      startAt: new Date(cursor),
      endAt: end,
      unitsCap: session.unitsCapPerWindow,
      ordersCap: session.ordersCapPerWindow,
    });
    cursor = end;
  }

  await prisma.timeSlot.createMany({ data: slots, skipDuplicates: true });
  return slots.length;
}

/**
 * Renvoie le premier créneau à venir ayant de la place pour `units` unités
 * supplémentaires ET une commande de plus. Aucun délai minimal n'est imposé :
 * le créneau en cours est proposé s'il a de la place (§6.1).
 */
export async function findNextAvailableSlot(sessionId: string, units: number) {
  const now = new Date();
  const slots = await prisma.timeSlot.findMany({
    where: { sessionId, endAt: { gt: now } },
    orderBy: { startAt: "asc" },
  });

  return (
    slots.find(
      (s) => s.unitsCommitted + units <= s.unitsCap && s.ordersCommitted + 1 <= s.ordersCap
    ) ?? null
  );
}

/**
 * Réserve atomiquement `units` de capacité + 1 commande sur un créneau précis.
 * Verrouille la ligne du créneau pendant la vérification+incrémentation afin
 * qu'aucune requête concurrente ne puisse dépasser le plafond.
 *
 * `override: true` (réservé au personnel) force l'insertion même si le créneau
 * est déclaré complet par l'algorithme (§6.4) — l'appelant est responsable de
 * consigner cette action dans le journal d'audit.
 */
export async function reserveTimeSlot(
  timeSlotId: string,
  units: number,
  opts: { override?: boolean } = {}
) {
  await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      {
        id: string;
        unitsCap: number;
        ordersCap: number;
        unitsCommitted: number;
        ordersCommitted: number;
      }[]
    >(
      Prisma.sql`SELECT id, "unitsCap", "ordersCap", "unitsCommitted", "ordersCommitted"
                 FROM "time_slots" WHERE id = ${timeSlotId} FOR UPDATE`
    );
    const slot = rows[0];
    if (!slot) throw new SlotFullError("Créneau introuvable.");

    const fitsUnits = slot.unitsCommitted + units <= slot.unitsCap;
    const fitsOrders = slot.ordersCommitted + 1 <= slot.ordersCap;

    if (!opts.override && (!fitsUnits || !fitsOrders)) {
      throw new SlotFullError();
    }

    await tx.timeSlot.update({
      where: { id: timeSlotId },
      data: { unitsCommitted: { increment: units }, ordersCommitted: { increment: 1 } },
    });
  });
}

/** Libère une capacité précédemment réservée (paiement échoué/abandonné, annulation). */
export async function releaseTimeSlot(timeSlotId: string, units: number) {
  await prisma.timeSlot.update({
    where: { id: timeSlotId },
    data: { unitsCommitted: { decrement: units }, ordersCommitted: { decrement: 1 } },
  });
}

export function computeHoldExpiry() {
  return new Date(Date.now() + HOLD_MINUTES * 60_000);
}

/**
 * À exécuter périodiquement (cron / tâche planifiée) : annule les commandes dont
 * le hold de paiement a expiré sans confirmation, et libère leur capacité.
 */
export async function releaseExpiredHolds() {
  const expired = await prisma.order.findMany({
    where: { status: OrderStatus.PENDING_PAYMENT, holdExpiresAt: { lt: new Date() } },
    include: { items: true },
  });

  for (const order of expired) {
    const units = order.items.reduce((sum, i) => sum + i.capacityWeight * i.quantity, 0);
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
      });
      await tx.timeSlot.update({
        where: { id: order.timeSlotId },
        data: { unitsCommitted: { decrement: units }, ordersCommitted: { decrement: 1 } },
      });
    });
  }

  return expired.length;
}

/** Prochain numéro de commande séquentiel au sein d'une session (affiché au retrait). */
export async function nextDailyOrderNumber(sessionId: string) {
  const last = await prisma.order.findFirst({
    where: { sessionId },
    orderBy: { dailyOrderNumber: "desc" },
    select: { dailyOrderNumber: true },
  });
  return (last?.dailyOrderNumber ?? 0) + 1;
}
