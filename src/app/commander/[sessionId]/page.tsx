import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderClient } from "./OrderClient";

export const dynamic = "force-dynamic";

export default async function CommanderPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;

  const session = await prisma.serviceSession.findUnique({
    where: { id: sessionId },
    include: { location: true },
  });
  if (!session) notFound();

  const categories = await prisma.menuCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: { sortOrder: "asc" },
        include: { sizes: true },
      },
    },
  });

  const supplements = await prisma.ingredient.findMany({
    where: { isSupplement: true, isAvailable: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="mx-auto max-w-3xl w-full px-5 py-8 flex-1">
      <header className="mb-6">
        <p className="text-xs tracking-[0.14em] uppercase text-[#a5462d] font-medium">Pizza Basilico</p>
        <h1 className="text-2xl font-semibold mt-1">{session.location.label}</h1>
        <p className="text-[#585a4d] text-sm">{session.location.address}</p>
      </header>

      <OrderClient
        sessionId={session.id}
        isOrderingOpen={session.isOrderingOpen}
        categories={categories.filter((c) => c.items.length > 0)}
        supplements={supplements}
      />
    </main>
  );
}
