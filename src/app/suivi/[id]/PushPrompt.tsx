"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Proposé après la commande, pas à la première visite (§11.4). */
export function PushPrompt({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("t");
  const [state, setState] = useState<"idle" | "asking" | "done" | "hidden">("idle");
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidKey || state === "hidden") return null;

  if (state === "done") {
    return (
      <p className="text-sm text-basil mt-6 flex items-center gap-2">
        <span aria-hidden="true">✓</span> Notifications activées — on vous prévient dès que c&rsquo;est prêt.
      </p>
    );
  }

  async function subscribe() {
    setState("asking");
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setState("hidden");

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return setState("hidden");

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
    <div className="card p-5 mt-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-cream text-[0.92rem] font-semibold">Être prévenu·e sans surveiller l&rsquo;écran</p>
        <p className="text-[0.8rem] text-cream-dim mt-1">
          Une notification dès que votre pizza sort du four. Pas de SMS, pas de numéro à donner.
        </p>
      </div>
      <button onClick={subscribe} disabled={state === "asking"} className="btn btn-ghost !py-2.5 !px-5 !text-[0.85rem]">
        {state === "asking" ? "…" : "Activer"}
      </button>
    </div>
  );
}
