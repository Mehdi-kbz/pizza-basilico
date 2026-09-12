/**
 * Hook de démarrage serveur Next.js — utilisé pour planifier les tâches
 * récurrentes (§6.1 libération des holds expirés, §10.4 synthèses au
 * propriétaire) sans serveur ni conteneur séparé, puisque `next start` tourne
 * en processus long sur le VPS (pas de fonctions serverless ici).
 */
export async function register() {
  // Uniquement côté serveur Node.js (pas dans le runtime Edge, pas au build).
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const cron = await import("node-cron");
  const { releaseExpiredHolds } = await import("@/lib/slots");
  const { sendDailyDigest, sendWeeklyDigest } = await import("@/lib/digest");

  // Libère les créneaux des commandes dont le hold de paiement a expiré (§6.1).
  cron.schedule("* * * * *", async () => {
    try {
      const n = await releaseExpiredHolds();
      if (n > 0) console.log(`[cron] ${n} hold(s) expiré(s) libéré(s).`);
    } catch (e) {
      console.error("[cron] Échec de libération des holds expirés :", e);
    }
  });

  // Synthèse quotidienne à 22h (heure du serveur), hebdomadaire le dimanche à 22h05.
  cron.schedule("0 22 * * *", () => sendDailyDigest().catch((e) => console.error("[cron] digest quotidien :", e)));
  cron.schedule("5 22 * * 0", () => sendWeeklyDigest().catch((e) => console.error("[cron] digest hebdomadaire :", e)));

  console.log("[instrumentation] Tâches planifiées initialisées (holds, synthèses).");
}
