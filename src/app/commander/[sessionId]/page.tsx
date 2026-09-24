import { redirect } from "next/navigation";

/** Ancienne adresse (QR code comptoir, liens partagés) : le parcours de commande est désormais /panier. */
export default async function CommanderPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  redirect(`/panier?s=${encodeURIComponent(sessionId)}`);
}
