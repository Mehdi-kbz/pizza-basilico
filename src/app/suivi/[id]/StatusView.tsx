"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const ACTIVE_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "#585a4d",
  CONFIRMED: "#3b5a34",
  IN_PREP: "#a5462d",
  READY: "#3b5a34",
  COMPLETED: "#585a4d",
  CANCELLED: "#a5462d",
  REFUNDED: "#585a4d",
  NO_SHOW: "#a5462d",
};

export function StatusView({
  orderId,
  initialStatus,
  statusLabels,
}: {
  orderId: string;
  initialStatus: string;
  statusLabels: Record<string, string>;
}) {
  const searchParams = useSearchParams();
  const token = searchParams.get("t");
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/orders/${orderId}/status?t=${token}`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [orderId, token]);

  return (
    <div
      className="rounded-lg border p-5 text-center"
      style={{ borderColor: ACTIVE_COLORS[status], background: "#faf9f2" }}
    >
      <p className="text-2xl font-semibold" style={{ color: ACTIVE_COLORS[status] }}>
        {statusLabels[status] ?? status}
      </p>
    </div>
  );
}
