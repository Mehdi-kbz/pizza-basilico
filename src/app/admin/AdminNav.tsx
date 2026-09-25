import Link from "next/link";

export type AdminTab = "queue" | "commande" | "sessions" | "menu" | "stats" | "promos" | "recrutement";

const TABS: { href: string; key: AdminTab; label: string }[] = [
  { href: "/admin", key: "queue", label: "File" },
  { href: "/admin/commande", key: "commande", label: "Comptoir" },
  { href: "/admin/sessions", key: "sessions", label: "Sessions" },
  { href: "/admin/menu", key: "menu", label: "Disponibilité" },
  { href: "/admin/promos", key: "promos", label: "Promos" },
  { href: "/admin/recrutement", key: "recrutement", label: "Recrutement" },
  { href: "/admin/stats", key: "stats", label: "Stats" },
];

export function AdminNav({ current }: { current: AdminTab }) {
  return (
    <nav className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={current === tab.key ? "page" : undefined}
          className={`shrink-0 text-[0.82rem] font-medium px-3.5 py-2 rounded-lg border transition-colors ${
            current === tab.key
              ? "border-flame bg-flame/12 text-ember"
              : "border-line text-fg-dim hover:text-fg hover:border-line-strong"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
