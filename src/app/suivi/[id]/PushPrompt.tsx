"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Proposé sur la page de suivi — juste après la première commande réussie,
 * pas à la première visite (§11.4, meilleur taux d'acceptation). */
export function PushPrompt({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("t");
  const [state, setState] = useState<"idle" | "asking" | "done" | "denied" | "unsupported">("idle");
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidKey || state === "done" || state === "denied") return null;

  async function subscribe() {
    setState("asking");
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setState("denied");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey!),
    });
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, trackingToken: token, subscription: subscription.toJSON() }),
    });
    setState("done");
  }

  return (
    <div className="rounded-lg border border-[#d9d6c6] bg-white/60 p-4 mt-4 text-sm flex items-center justify-between gap-3">
      <span>Être prévenu·e dès que la commande est prête, sans SMS ?</span>
      <button onClick={subscribe} disabled={state === "asking"} className="shrink-0 bg-[#3b5a34] text-white rounded px-3 py-1.5 text-xs disabled:opacity-50">
        Activer
      </button>
    </div>
  );
}
