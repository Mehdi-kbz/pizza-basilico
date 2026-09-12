import Link from "next/link";
import { AdminNav, type AdminTab } from "./AdminNav";

/** Chrome commune à toutes les pages de l'espace personnel. */
export function AdminShell({
  current,
  title,
  subtitle,
  role,
  children,
  wide = false,
}: {
  current: AdminTab;
  title: string;
  subtitle?: string;
  role?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-full">
      <div className="border-b border-line bg-char/70 backdrop-blur-sm sticky top-0 z-40">
        <div className={`mx-auto ${wide ? "max-w-6xl" : "max-w-4xl"} px-5 lg:px-8 py-3.5`}>
          <div className="flex items-center justify-between gap-4 mb-3.5">
            <Link href="/admin" className="flex items-baseline gap-2.5 group">
              <span className="display text-lg text-cream group-hover:text-ember transition-colors">BASILICO</span>
              <span className="text-[0.6rem] uppercase tracking-[0.2em] text-cream-faint">Espace personnel</span>
            </Link>
            <div className="flex items-center gap-3">
              {role && <span className="chip !text-[0.62rem]">{role}</span>}
              <Link href="/" className="text-xs text-cream-faint hover:text-cream-dim transition-colors">
                Voir le site ↗
              </Link>
            </div>
          </div>
          <AdminNav current={current} />
        </div>
      </div>

      <main className={`mx-auto ${wide ? "max-w-6xl" : "max-w-4xl"} px-5 lg:px-8 py-8`}>
        <header className="mb-7">
          <h1 className="display text-[clamp(1.7rem,4.5vw,2.4rem)]">{title}</h1>
          {subtitle && <p className="text-sm text-cream-dim mt-2 max-w-2xl leading-relaxed">{subtitle}</p>}
        </header>
        {children}
      </main>
    </div>
  );
}
