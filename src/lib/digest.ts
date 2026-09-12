import { prisma } from "@/lib/prisma";
import { sendOwnerDigestEmail } from "@/lib/email";
import { OrderStatus } from "@/generated/prisma/client";

/** Statistiques sur une période — utilisées à la fois par les synthèses e-mail
 * (§10.4) et par la page « à la volée » du tableau de bord (§10.4). */
export async function getStats(since: Date) {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, status: { in: [OrderStatus.CONFIRMED, OrderStatus.IN_PREP, OrderStatus.READY, OrderStatus.COMPLETED] } },
    include: { items: { include: { menuItem: true } } },
  });

  const totalCents = orders.reduce((sum, o) => sum + o.totalCents, 0);
  const counts = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      counts.set(item.menuItem.name, (counts.get(item.menuItem.name) ?? 0) + item.quantity);
    }
  }
  const topItems = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return { ordersCount: orders.length, totalCents, topItems };
}

async function buildAndSend(periodLabel: string, since: Date) {
  const stats = await getStats(since);

  const owners = await prisma.staffUser.findMany({ where: { role: "OWNER", isActive: true } });
  for (const owner of owners) {
    await sendOwnerDigestEmail(owner.email, { ...stats, periodLabel }).catch((e) =>
      console.error("Échec d'envoi de la synthèse :", e)
    );
  }
}

export async function sendDailyDigest() {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  await buildAndSend("du jour", since);
}

export async function sendWeeklyDigest() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await buildAndSend("de la semaine", since);
}
