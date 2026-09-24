"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const STEPS = [
  { key: "CONFIRMED", label: "Confirmée", hint: "On a votre commande" },
  { key: "IN_PREP", label: "Au four", hint: "Ça cuit" },
  { key: "READY", label: "Prête", hint: "Venez la chercher" },
  { key: "COMPLETED", label: "Récupérée", hint: "Bon appétit" },
] as const;

const TERMINAL: Record<string, { label: string; text: string; tone: string }> = {
  PENDING_PAYMENT: { label: "En attente de paiement", text: "Le paiement n'est pas encore confirmé.", tone: "text-fg-dim" },
  CANCELLED: { label: "Annulée", text: "Cette commande a été annulée.", tone: "text-tomato" },
  REFUNDED: { label: "Remboursée", text: "Cette commande a été remboursée.", tone: "text-tomato" },
  NO_SHOW: { label: "Non récupérée", text: "La commande n'a pas été retirée.", tone: "text-tomato" },
};

export function StatusView({ orderId, initialStatus }: { orderId: string; initialStatus: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("t");
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/orders/${orderId}/status?t=${token}`);
      if (res.ok) setStatus((await res.json()).status);
    }, 4000);
    return () => clearInterval(interval);
  }, [orderId, token]);

  const terminal = TERMINAL[status];
  if (terminal) {
    return (
      <div className="card p-6 text-center">
        <p className={`display text-2xl ${terminal.tone}`}>{terminal.label}</p>
        <p className="text-sm text-fg-dim mt-2">{terminal.text}</p>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);
  const isReady = status === "READY";

  return (
    <div
      className={`card p-6 relative overflow-hidden transition-colors ${isReady ? "!border-ember" : ""}`}
    >
      {isReady && (
        <div
          className="absolute inset-0 -z-0 animate-pulse"
          aria-hidden="true"
          style={{ background: "radial-gradient(circle at 50% 0%, rgba(255,122,47,0.18), transparent 70%)" }}
        />
      )}

      <div className="relative flex justify-between gap-1">
        {STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center text-center gap-2.5 relative">
              {i > 0 && (
                <span
                  className="absolute top-[9px] right-1/2 w-full h-[2px] -z-0"
                  style={{ background: i <= currentIndex ? "var(--color-flame)" : "var(--color-line)" }}
                  aria-hidden="true"
                />
              )}
              <span
                className={`relative z-10 w-[19px] h-[19px] rounded-full border-2 grid place-items-center transition-all ${
                  done
                    ? "bg-flame border-flame"
                    : active
                      ? "border-ember bg-bg scale-110 shadow-[0_0_0_5px_rgba(255,122,47,0.16)]"
                      : "border-line bg-bg"
                }`}
              >
                {done && <span className="text-[10px] leading-none text-bg font-bold">✓</span>}
                {active && <span className="w-[7px] h-[7px] rounded-full bg-ember animate-pulse" />}
              </span>
              <span
                className={`text-[0.78rem] leading-tight ${
                  active ? "text-ember font-semibold" : done ? "text-fg-dim" : "text-fg-faint"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {currentIndex >= 0 && (
        <p className="relative text-center text-sm text-fg-dim mt-5">
          {isReady ? (
            <strong className="text-ember display text-lg">Votre commande est prête !</strong>
          ) : (
            STEPS[currentIndex].hint
          )}
        </p>
      )}
    </div>
  );
}
