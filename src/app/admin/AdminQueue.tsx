"use client";

import { useEffect, useState, useCallback } from "react";

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

export function AdminQueue({ sessions }: { sessions: { id: string; label: string }[] }) {
  const [sessionId, setSessionId] = useState(sessions[0]?.id);
  const [slots, setSlots] = useState<SlotView[]>([]);

  const load = useCallback(async () => {
    if (!sessionId) return;
    const res = await fetch(`/api/admin/orders?sessionId=${sessionId}`);
    if (res.ok) {
      const data = await res.json();
      setSlots(data.slots);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
    // Le temps réel via WebSocket/Postgres LISTEN-NOTIFY n'est pas encore branché :
    // rafraîchissement périodique en attendant (voir README, prochaines étapes).
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

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
