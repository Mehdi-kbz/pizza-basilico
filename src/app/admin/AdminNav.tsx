import Link from "next/link";

export function AdminNav({ current }: { current: "queue" | "sessions" | "menu" }) {
  const item = (href: string, key: typeof current, label: string) => (
    <Link
      href={href}
      className={`text-sm px-3 py-1.5 rounded ${current === key ? "bg-[#232017] text-white" : "border border-[#d9d6c6]"}`}
    >
      {label}
    </Link>
  );
  return (
    <nav className="flex gap-2 mb-6">
      {item("/admin", "queue", "File de commandes")}
      {item("/admin/sessions", "sessions", "Emplacements & sessions")}
      {item("/admin/menu", "menu", "Disponibilité du menu")}
    </nav>
  );
}
