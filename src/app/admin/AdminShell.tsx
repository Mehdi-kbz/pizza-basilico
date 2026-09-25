import { prisma } from "@/lib/prisma";
import { getStaffSession } from "@/lib/require-staff";
import { AdminSidebar, type AdminTab } from "./AdminSidebar";

export type { AdminTab };

/** Chrome commune à toutes les pages de l'espace personnel : barre latérale (tiroir sur mobile) + contenu. */
export async function AdminShell({
  current,
  title,
  subtitle,
  actions,
  children,
  wide = false,
}: {
  current: AdminTab;
  title: string;
  subtitle?: string;
  role?: string; // conservé pour compatibilité : le rôle est relu depuis la session
  actions?: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const session = await getStaffSession();
  const [me, newApplications, newCatering] = await Promise.all([
    session ? prisma.staffUser.findUnique({ where: { id: session.sub }, select: { email: true } }) : null,
    prisma.jobApplication.count({ where: { status: "NEW" } }),
    prisma.cateringInquiry.count({ where: { status: "NEW" } }),
  ]);

  return (
    <div className="min-h-screen">
      <AdminSidebar
        current={current}
        email={me?.email ?? "Session"}
        role={session?.role ?? "STAFF"}
        badges={{ recrutement: newApplications, traiteur: newCatering }}
      />

      <main className={`lg:pl-[264px]`}>
        <div className={`mx-auto ${wide ? "max-w-6xl" : "max-w-5xl"} px-4 sm:px-6 lg:px-8 py-6 md:py-10`}>
          <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h1 className="display text-[clamp(1.7rem,4.5vw,2.4rem)]">{title}</h1>
              {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-dim">{subtitle}</p>}
            </div>
            {actions}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
