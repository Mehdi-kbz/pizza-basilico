"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface OrderItemView {
  quantity: number;
  menuItem: { name: string };
  menuItemSize: { label: string } | null;
  addedIngredients: { ingredient: { name: string } }[];
}
interface OrderView {
  id: string;
  dailyOrderNumber: number;
  status: string;
  pickupName: string;
  note: string | null;
  totalCents: number;
  flaggedLarge: boolean;
  items: OrderItemView[];
}
interface SlotView {
  id: string;
  startAt: string;
  endAt: string;
  unitsCap: number;
  unitsCommitted: number;
  ordersCap: number;
  ordersCommitted: number;
  orders: OrderView[];
}

const eur = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const timeFmt = (iso: string) => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmée",
  IN_PREP: "En préparation",
  READY: "Prête",
  COMPLETED: "Récupérée",
  CANCELLED: "Annulée",
  NO_SHOW: "Non récupérée",
};
const NEXT_STATUS: Record<string, string | null> = {
  CONFIRMED: "IN_PREP",
  IN_PREP: "READY",
  READY: "COMPLETED",
  COMPLETED: null,
  CANCELLED: null,
  NO_SHOW: null,
};

/** Bip synthétique (aucun fichier audio nécessaire) — assez fort pour être remarqué dans le bruit du camion. */
function playAlertSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    [0, 0.18].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.16);
    });
  } catch {
    /* audio indisponible (permissions navigateur) — l'alerte visuelle suffit */
  }
}

export function AdminQueue({ sessions }: { sessions: { id: string; label: string }[] }) {
  const [sessionId, setSessionId] = useState(sessions[0]?.id);
  const [slots, setSlots] = useState<SlotView[]>([]);
  const [pendingAlerts, setPendingAlerts] = useState<OrderView[]>([]);
  const knownOrderIds = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    if (!sessionId) return;
    const res = await fetch(`/api/admin/orders?sessionId=${sessionId}`);
    if (!res.ok) return;
    const data = await res.json();
    const allOrders: OrderView[] = data.slots.flatMap((s: SlotView) => s.orders);

    // Alerte sonore + visuelle sur toute commande confirmée jamais vue depuis
    // l'ouverture de cette page (§10.2) — jamais au tout premier chargement.
    if (knownOrderIds.current) {
      const fresh = allOrders.filter((o) => o.status === "CONFIRMED" && !knownOrderIds.current!.has(o.id));
      if (fresh.length > 0) {
        setPendingAlerts((prev) => [...prev, ...fresh]);
        playAlertSound();
      }
    }
    knownOrderIds.current = new Set(allOrders.map((o) => o.id));

    setSlots(data.slots);
  }, [sessionId]);

  useEffect(() => {
    knownOrderIds.current = null; // changement de session : pas d'alerte rétroactive
    load();
  }, [sessionId, load]);

  useEffect(() => {
    // Temps réel via Server-Sent Events (Postgres LISTEN/NOTIFY, §10.2) — un
    // sondage de secours à basse fréquence reste actif en cas de coupure du flux.
    const source = new EventSource("/api/admin/orders/stream");
    source.onmessage = (e) => {
      if (e.data === sessionId) load();
    };
    const fallback = setInterval(load, 30_000);
    return () => {
      source.close();
      clearInterval(fallback);
    };
  }, [sessionId, load]);

  function acknowledgeAlert(orderId: string) {
    setPendingAlerts((prev) => prev.filter((o) => o.id !== orderId));
  }

  async function setStatus(orderId: string, status: string) {
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div>
      {pendingAlerts.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {pendingAlerts.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-lg border-2 border-[#a5462d] bg-[#f6dfd6] px-4 py-3 animate-pulse"
            >
              <p className="font-semibold text-[#7a3320]">🔔 Nouvelle commande #{o.dailyOrderNumber} — {o.pickupName}</p>
              <button
                onClick={() => acknowledgeAlert(o.id)}
                className="text-xs bg-[#a5462d] text-white rounded px-3 py-1.5 font-medium"
              >
                Vu
              </button>
            </div>
          ))}
        </div>
      )}

      <select
        value={sessionId}
        onChange={(e) => setSessionId(e.target.value)}
        className="border border-[#d9d6c6] rounded px-3 py-2 text-sm bg-white mb-6"
      >
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>

      <div className="flex flex-col gap-6">
        {slots.map((slot) => (
          <section key={slot.id} className="rounded-lg border border-[#d9d6c6] bg-white/60 p-4">
            <div className="flex justify-between items-center mb-3">
              <p className="font-medium">
                {timeFmt(slot.startAt)} – {timeFmt(slot.endAt)}
              </p>
              <p className="text-xs text-[#585a4d]">
                {slot.unitsCommitted}/{slot.unitsCap} unités · {slot.ordersCommitted}/{slot.ordersCap} commandes
              </p>
            </div>

            {slot.orders.length === 0 ? (
              <p className="text-sm text-[#585a4d]">Aucune commande.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {slot.orders.map((o) => (
                  <li key={o.id} className="border border-[#d9d6c6] rounded p-3 bg-white">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-medium">
                          #{o.dailyOrderNumber} — {o.pickupName}
                          {o.flaggedLarge && (
                            <span className="ml-2 text-xs text-[#a5462d] border border-[#c98572] rounded px-1.5 py-0.5">
                              commande volumineuse
                            </span>
                          )}
                        </p>
                        <ul className="text-sm text-[#585a4d]">
                          {o.items.map((it, idx) => (
                            <li key={idx}>
                              {it.quantity}× {it.menuItem.name} {it.menuItemSize ? `(${it.menuItemSize.label})` : ""}
                              {it.addedIngredients.length > 0 && (
                                <> + {it.addedIngredients.map((a) => a.ingredient.name).join(", ")}</>
                              )}
                            </li>
                          ))}
                        </ul>
                        {o.note && <p className="text-xs italic text-[#585a4d] mt-1">« {o.note} »</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">{eur(o.totalCents)}</p>
                        <p className="text-xs text-[#585a4d]">{STATUS_LABELS[o.status] ?? o.status}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      {NEXT_STATUS[o.status] && (
                        <button
                          onClick={() => setStatus(o.id, NEXT_STATUS[o.status]!)}
                          className="text-xs bg-[#3b5a34] text-white rounded px-2.5 py-1"
                        >
                          Marquer « {STATUS_LABELS[NEXT_STATUS[o.status]!]} »
                        </button>
                      )}
                      {o.status === "READY" && (
                        <button
                          onClick={() => setStatus(o.id, "NO_SHOW")}
                          className="text-xs border border-[#d9d6c6] rounded px-2.5 py-1"
                        >
                          Non récupérée
                        </button>
                      )}
                      {o.status !== "CANCELLED" && o.status !== "COMPLETED" && (
                        <button
                          onClick={() => setStatus(o.id, "CANCELLED")}
                          className="text-xs text-[#a5462d] border border-[#c98572] rounded px-2.5 py-1"
                        >
                          Annuler / rembourser
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
