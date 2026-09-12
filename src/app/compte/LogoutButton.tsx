"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
      className="btn btn-ghost !py-2 !px-4 !text-[0.78rem] shrink-0"
    >
      Se déconnecter
    </button>
  );
}
