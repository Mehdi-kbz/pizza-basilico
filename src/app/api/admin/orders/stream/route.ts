import { getStaffSession } from "@/lib/require-staff";
import { subscribeToOrderChanges } from "@/lib/realtime";

export const dynamic = "force-dynamic";

/**
 * Flux Server-Sent Events : pousse un évènement dès qu'une commande change
 * pour une session, pour que la file admin se mette à jour instantanément
 * plutôt que d'attendre le prochain sondage (§10.2).
 */
export async function GET(req: Request) {
  const staff = await getStaffSession();
  if (!staff) return new Response("Non authentifié.", { status: 401 });

  const emitter = await subscribeToOrderChanges();
  const encoder = new TextEncoder();

  let heartbeat: ReturnType<typeof setInterval>;
  let onChange: (sessionId: string) => void;

  const stream = new ReadableStream({
    start(controller) {
      onChange = (sessionId: string) => {
        controller.enqueue(encoder.encode(`data: ${sessionId}\n\n`));
      };
      emitter.on("change", onChange);

      // Garde la connexion ouverte à travers les proxys (Caddy) qui pourraient
      // fermer un flux inactif.
      heartbeat = setInterval(() => controller.enqueue(encoder.encode(": heartbeat\n\n")), 20_000);
    },
    cancel() {
      emitter.off("change", onChange);
      clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
