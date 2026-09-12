/**
 * Script de vérification du moteur de créneaux sous concurrence réelle.
 * Preuve qu'aucune survente n'est possible lorsque plusieurs clients réservent
 * simultanément le même créneau (course critique classique d'un système de réservation).
 *
 * Usage : npx tsx scripts/verify-slots.ts
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { generateTimeSlotsForSession, reserveTimeSlot, SlotFullError } from "@/lib/slots";

async function attempt(label: string, timeSlotId: string, units: number) {
  try {
    await reserveTimeSlot(timeSlotId, units);
    return { label, ok: true };
  } catch (e) {
    if (e instanceof SlotFullError) return { label, ok: false };
    throw e;
  }
}

async function main() {
  console.log("== Test 1 : plafond d'unités (pizzas) ==");
  const loc = await prisma.location.create({
    data: { label: "Test", address: "Test" },
  });
  const session = await prisma.serviceSession.create({
    data: {
      locationId: loc.id,
      startAt: new Date(Date.now() - 60_000),
      endAt: new Date(Date.now() + 10 * 60_000),
      windowMinutes: 10,
      unitsCapPerWindow: 6,
      ordersCapPerWindow: 4,
    },
  });
  await generateTimeSlotsForSession(session.id);
  const slot = await prisma.timeSlot.findFirstOrThrow({ where: { sessionId: session.id } });

  // 10 clients tentent chacun de réserver 2 unités en même temps (plafond = 6 unités / 4 commandes)
  const results1 = await Promise.all(
    Array.from({ length: 10 }, (_, i) => attempt(`client-${i}`, slot.id, 2))
  );
  const succeeded1 = results1.filter((r) => r.ok).length;
  const finalSlot1 = await prisma.timeSlot.findUniqueOrThrow({ where: { id: slot.id } });

  console.log(`Réservations réussies : ${succeeded1} (attendu : 3, car 3 x 2 = 6 = plafond unités)`);
  console.log(`Unités engagées      : ${finalSlot1.unitsCommitted} (attendu : 6)`);
  console.log(`Commandes engagées   : ${finalSlot1.ordersCommitted} (attendu : 3)`);

  const test1Pass =
    succeeded1 === 3 && finalSlot1.unitsCommitted === 6 && finalSlot1.ordersCommitted === 3;
  console.log(test1Pass ? "✅ Test 1 réussi — aucune survente d'unités.\n" : "❌ Test 1 échoué.\n");

  console.log("== Test 2 : plafond de commandes distinctes ==");
  const session2 = await prisma.serviceSession.create({
    data: {
      locationId: loc.id,
      startAt: new Date(Date.now() - 60_000),
      endAt: new Date(Date.now() + 10 * 60_000),
      windowMinutes: 10,
      unitsCapPerWindow: 20, // large, pour isoler le plafond de commandes
      ordersCapPerWindow: 4,
    },
  });
  await generateTimeSlotsForSession(session2.id);
  const slot2 = await prisma.timeSlot.findFirstOrThrow({ where: { sessionId: session2.id } });

  const results2 = await Promise.all(
    Array.from({ length: 10 }, (_, i) => attempt(`client-${i}`, slot2.id, 1))
  );
  const succeeded2 = results2.filter((r) => r.ok).length;
  const finalSlot2 = await prisma.timeSlot.findUniqueOrThrow({ where: { id: slot2.id } });

  console.log(`Réservations réussies : ${succeeded2} (attendu : 4, plafond commandes)`);
  console.log(`Commandes engagées   : ${finalSlot2.ordersCommitted} (attendu : 4)`);

  const test2Pass = succeeded2 === 4 && finalSlot2.ordersCommitted === 4;
  console.log(test2Pass ? "✅ Test 2 réussi — aucune survente de commandes.\n" : "❌ Test 2 échoué.\n");

  // nettoyage
  await prisma.timeSlot.deleteMany({ where: { sessionId: { in: [session.id, session2.id] } } });
  await prisma.serviceSession.deleteMany({ where: { id: { in: [session.id, session2.id] } } });
  await prisma.location.delete({ where: { id: loc.id } });

  if (!test1Pass || !test2Pass) {
    console.error("Des tests ont échoué.");
    process.exit(1);
  }
  console.log("Tous les tests de concurrence sont passés.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
