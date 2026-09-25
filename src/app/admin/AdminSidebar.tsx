"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export type AdminTab =
  | "dashboard" | "file" | "commande" | "commandes"
  | "carte" | "menu" | "promos" | "sessions"
  | "clients" | "traiteur" | "newsletter"
  | "recrutement" | "equipe" | "stats";

interface Item { key: AdminTab; href: string; label: string; icon: string; badgeKey?: "recrutement" | "traiteur"; ownerOnly?: boolean }
const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Pilotage",
    items: [
      { key: "dashboard", href: "/admin", label: "Tableau de bord", icon: "📊" },
      { key: "file", href: "/admin/file", label: "File en direct", icon: "🔥" },
      { key: "commande", href: "/admin/commande", label: "Comptoir", icon: "🧾" },
      { key: "commandes", href: "/admin/commandes", label: "Commandes", icon: "📋" },
      { key: "sessions", href: "/admin/sessions", label: "Sessions", icon: "📍" },
    ],
  },
  {
    title: "Carte",
    items: [
      { key: "carte", href: "/admin/carte", label: "Carte & prix", icon: "🍕" },
      { key: "menu", href: "/admin/menu", label: "Disponibilité", icon: "✅" },
      { key: "promos", href: "/admin/promos", label: "Codes promo", icon: "🏷️" },
    ],
  },
  {
    title: "Clients",
    items: [
      { key: "clients", href: "/admin/clients", label: "Clients & fidélité", icon: "👥" },
      { key: "traiteur", href: "/admin/traiteur", label: "Traiteur", icon: "🎉", badgeKey: "traiteur" },
      { key: "newsletter", href: "/admin/newsletter", label: "Newsletter", icon: "✉️" },
    ],
  },
  {
    title: "Équipe",
    items: [
      { key: "recrutement", href: "/admin/recrutement", label: "Recrutement", icon: "💼", badgeKey: "recrutement" },
      { key: "equipe", href: "/admin/equipe", label: "Comptes", icon: "🔑", ownerOnly: true },
    ],
  },
  { title: "Analyse", items: [{ key: "stats", href: "/admin/stats", label: "Statistiques", icon: "📈" }] },
];

export function AdminSidebar({
  current,
  email,
  role,
  badges,
}: {
  current: AdminTab;
  email: string;
  role: string;
  badges: { recrutement: number; traiteur: number };
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Ferme le tiroir à chaque navigation et verrouille le défilement pendant qu'il est ouvert.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav aria-label="Navigation de l'espace personnel" className="flex flex-col gap-5">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="px-3 mb-1.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-fg-faint">{g.title}</p>
          <ul className="flex flex-col gap-0.5">
            {g.items
              .filter((i) => !i.ownerOnly || role === "OWNER")
              .map((i) => {
                const active = i.key === current;
                const badge = i.badgeKey ? badges[i.badgeKey] : 0;
                return (
                  <li key={i.key}>
                    <Link
                      href={i.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[0.9rem] font-medium transition-colors ${
                        active ? "bg-gradient-to-b from-flame to-flame-deep text-white shadow-[0_10px_20px_-12px_rgba(217,68,26,0.8)]" : "text-fg-dim hover:bg-surface-2 hover:text-fg"
                      }`}
                    >
                      <span className="w-5 text-center text-base" aria-hidden="true">{i.icon}</span>
                      <span className="flex-1">{i.label}</span>
                      {badge > 0 && (
                        <span className={`grid min-w-[22px] h-[22px] place-items-center rounded-full px-1.5 text-[0.7rem] font-bold tnum ${active ? "bg-white text-ember" : "bg-tomato text-white"}`}>
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="rounded-2xl bg-surface-2/70 p-3.5">
      <p className="truncate text-[0.8rem] font-semibold">{email}</p>
      <p className="text-[0.68rem] uppercase tracking-wider text-fg-faint">{role === "OWNER" ? "Propriétaire" : "Équipe"}</p>
      <div className="mt-3 flex gap-2">
        <Link href="/" className="btn btn-ghost !py-2 !px-3 !text-[0.75rem] flex-1">Voir le site</Link>
        <button onClick={logout} className="btn btn-ghost !py-2 !px-3 !text-[0.75rem] flex-1">Déconnexion</button>
      </div>
    </div>
  );

  return (
    <>
      {/* Barre du haut (mobile) */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-line bg-white/85 px-4 py-2.5 backdrop-blur-xl">
        <Link href="/admin" className="flex items-center gap-2.5" aria-label="Tableau de bord">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="" className="h-10 w-auto" />
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-fg-faint">Espace personnel</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          className="relative grid h-11 w-11 place-items-center rounded-full bg-surface-2"
        >
          <span className="flex flex-col gap-[5px]" aria-hidden="true">
            <span className="block h-[1.5px] w-5 bg-fg" />
            <span className="block h-[1.5px] w-5 bg-fg" />
            <span className="block h-[1.5px] w-5 bg-fg" />
          </span>
          {badges.recrutement + badges.traiteur > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-tomato ring-2 ring-white" />}
        </button>
      </header>

      {/* Tiroir (mobile) */}
      <div className={`lg:hidden fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <button
          aria-label="Fermer le menu"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-[#2b1710]/45 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`absolute left-0 top-0 flex h-full w-[84%] max-w-[300px] flex-col gap-5 overflow-y-auto bg-white p-4 shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.webp" alt="Pizza Basilico" className="h-14 w-auto" />
            <button onClick={() => setOpen(false)} aria-label="Fermer" className="grid h-9 w-9 place-items-center rounded-full bg-surface-2">✕</button>
          </div>
          {nav}
          <div className="mt-auto">{footer}</div>
        </aside>
      </div>

      {/* Barre latérale (bureau) */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-30 h-screen w-[264px] flex-col gap-6 overflow-y-auto border-r border-line bg-white/80 p-4 backdrop-blur-xl">
        <Link href="/admin" aria-label="Tableau de bord" className="block px-2 pt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="Pizza Basilico" className="h-16 w-auto" />
        </Link>
        {nav}
        <div className="mt-auto">{footer}</div>
      </aside>
    </>
  );
}
