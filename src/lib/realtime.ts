import { EventEmitter } from "node:events";
import { Client } from "pg";

/**
 * Mises à jour en temps réel de la file de commandes admin (remplace le
 * rafraîchissement par sondage). Repose sur Postgres LISTEN/NOTIFY — pas de
 * serveur WebSocket séparé à faire tourner : une connexion dédiée écoute,
 * et chaque abonné (un onglet admin ouvert) reçoit l'évènement via Server-Sent
 * Events (`/api/admin/orders/stream`), sans changer l'entrée du serveur Next.js.
 */

export const orderEvents = new EventEmitter();
orderEvents.setMaxListeners(100);

let listening = false;

async function ensureListening() {
  if (listening) return;
  listening = true;

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query("LISTEN orders_changed");

  client.on("notification", (msg) => {
    if (msg.payload) orderEvents.emit("change", msg.payload);
  });

  client.on("error", (err) => {
    console.error("[realtime] connexion d'écoute perdue, reconnexion :", err);
    listening = false;
    ensureListening().catch((e) => console.error("[realtime] échec de reconnexion :", e));
  });
}

/** À appeler après toute création/mise à jour de commande affectant la file admin. */
export async function notifyOrdersChanged(sessionId: string) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("SELECT pg_notify('orders_changed', $1)", [sessionId]);
  } finally {
    await client.end();
  }
}

export async function subscribeToOrderChanges() {
  await ensureListening();
  return orderEvents;
}
