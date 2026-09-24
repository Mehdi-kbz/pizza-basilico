import { prisma } from "@/lib/prisma";
import { CheckoutClient } from "./CheckoutClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Votre panier — Pizza Basilico" };

const day = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const hour = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default async function PanierPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s } = await searchParams;
  const now = new Date();

  // Session demandée explicitement (lien / QR code), sinon la prochaine session ouverte aux commandes.
  const session = s
    ? await prisma.serviceSession.findFirst({ where: { id: s, isOrderingOpen: true, endAt: { gt: now } }, include: { location: true } })
    : await prisma.serviceSession.findFirst({
        where: { isOrderingOpen: true, endAt: { gt: now } },
        orderBy: { startAt: "asc" },
        include: { location: true },
      });

  return (
    <main>
      <CheckoutClient
        session={
          session
            ? {
                id: session.id,
                label: session.location.label,
                when: `${day.format(session.startAt)} · ${hour.format(session.startAt)}–${hour.format(session.endAt)}`,
              }
            : null
        }
      />
    </main>
  );
}
