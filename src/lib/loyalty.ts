import { prisma } from "@/lib/prisma";

/**
 * Fidélité — carte à tampons (§8). Un tampon par pizza achetée (pizza, Panuozzo,
 * Plaque : un article = un tampon ; boissons et desserts ne comptent pas),
 * 10 tampons = 1 pizza offerte, rédemption active par le client, expiration
 * après 90 jours d'inactivité.
 */

export const STAMPS_REQUIRED_FOR_FREE_ITEM = 10;
export const STAMP_EXPIRY_DAYS = 90;

export interface LoyaltyStatus {
  stampCount: number;
  eligibleForFreeItem: boolean;
  stampsUntilFree: number;
}

function isExpired(lastEarnedAt: Date | null) {
  if (!lastEarnedAt) return false;
  const ageDays = (Date.now() - lastEarnedAt.getTime()) / (1000 * 60 * 60 * 24);
  return ageDays > STAMP_EXPIRY_DAYS;
}

/** Statut de fidélité pour un e-mail donné (crée le client s'il n'existe pas encore). */
export async function getLoyaltyStatus(email: string): Promise<LoyaltyStatus> {
  const customer = await prisma.customer.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
    include: { loyaltyCard: true },
  });
  if (!customer?.loyaltyCard) {
    return { stampCount: 0, eligibleForFreeItem: false, stampsUntilFree: STAMPS_REQUIRED_FOR_FREE_ITEM };
  }

  const expired = isExpired(customer.loyaltyCard.lastEarnedAt);
  const stampCount = expired ? 0 : customer.loyaltyCard.stampCount;

  return {
    stampCount,
    eligibleForFreeItem: stampCount >= STAMPS_REQUIRED_FOR_FREE_ITEM,
    stampsUntilFree: Math.max(0, STAMPS_REQUIRED_FOR_FREE_ITEM - stampCount),
  };
}

/**
 * Crédite/débite la carte de fidélité au moment où le paiement d'une commande
 * est confirmé (jamais avant — un paiement échoué ne doit ni faire gagner ni
 * consommer de tampon). `stampsEarned` et `redeemed` sont ceux déjà figés sur
 * la commande au moment de sa création (§8, "snapshot").
 */
export async function settleLoyaltyForOrder(customerId: string, stampsEarned: number, redeemed: boolean) {
  await prisma.$transaction(async (tx) => {
    const card = await tx.loyaltyCard.upsert({
      where: { customerId },
      update: {},
      create: { customerId },
    });

    let current = isExpired(card.lastEarnedAt) ? 0 : card.stampCount;
    if (redeemed) current = Math.max(0, current - STAMPS_REQUIRED_FOR_FREE_ITEM);
    current += stampsEarned;

    await tx.loyaltyCard.update({
      where: { customerId },
      data: {
        stampCount: current,
        lastEarnedAt: stampsEarned > 0 ? new Date() : card.lastEarnedAt,
        lastRedeemedAt: redeemed ? new Date() : card.lastRedeemedAt,
      },
    });
  });
}
