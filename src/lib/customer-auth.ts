import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, signCustomerSession } from "@/lib/auth";

/**
 * Comptes clients — on peut toujours commander sans compte (simple e-mail).
 * Un mot de passe optionnel protège la carte de fidélité : il est requis pour
 * utiliser une pizza offerte, et l'e-mail doit être confirmé par lien.
 *
 * Les liens de confirmation / réinitialisation sont des jetons signés sans état
 * (aucune table) : ils portent l'empreinte du mot de passe courant, donc ils
 * cessent de fonctionner dès que le mot de passe change (usage unique de fait).
 */

const SECRET = process.env.SESSION_SECRET!;
export const MIN_PASSWORD_LENGTH = 8;

export function publicUrl() {
  return (process.env.PUBLIC_URL ?? "https://pizza.mehdi.website").replace(/\/$/, "");
}

/** Empreinte courte du mot de passe : lie un jeton à *ce* mot de passe. */
const fingerprint = (hash: string | null) => (hash ? hash.slice(-16) : "none");

export type TokenPurpose = "verify" | "reset";

export function signAccountToken(purpose: TokenPurpose, customer: { id: string; passwordHash: string | null }) {
  const expiresIn = purpose === "reset" ? "1h" : "7d";
  return jwt.sign({ sub: customer.id, purpose, fp: fingerprint(customer.passwordHash) }, SECRET, { expiresIn });
}

export async function readAccountToken(token: string, purpose: TokenPurpose) {
  try {
    const payload = jwt.verify(token, SECRET) as { sub: string; purpose: string; fp: string };
    if (payload.purpose !== purpose) return null;
    const customer = await prisma.customer.findUnique({ where: { id: payload.sub } });
    if (!customer || fingerprint(customer.passwordHash) !== payload.fp) return null;
    return customer;
  } catch {
    return null;
  }
}

export const verifyUrlFor = (c: { id: string; passwordHash: string | null }) => `${publicUrl()}/compte/confirmer?token=${signAccountToken("verify", c)}`;
export const resetUrlFor = (c: { id: string; passwordHash: string | null }) => `${publicUrl()}/compte/reinitialiser?token=${signAccountToken("reset", c)}`;

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Mot de passe : ${MIN_PASSWORD_LENGTH} caractères minimum.`;
  if (password.length > 100) return "Mot de passe trop long.";
  return null;
}

export const setPassword = async (customerId: string, password: string, verified: boolean) =>
  prisma.customer.update({
    where: { id: customerId },
    data: { passwordHash: await hashPassword(password), hasAccount: true, ...(verified ? { emailVerifiedAt: new Date() } : {}) },
  });

/** Cookie de session client (30 jours). */
export function customerSessionCookie(customer: { id: string; email: string }) {
  return {
    name: "customer_session",
    value: signCustomerSession({ sub: customer.id, email: customer.email }),
    options: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 30 },
  };
}

export type AccountState = "none" | "guest" | "password";

/** État d'un e-mail pour le tunnel de commande. */
export async function accountState(email: string) {
  const customer = await prisma.customer.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: { _count: { select: { orders: { where: { status: { notIn: ["PENDING_PAYMENT", "CANCELLED"] } } } } } },
  });
  const state: AccountState = customer?.passwordHash ? "password" : customer && customer._count.orders > 0 ? "guest" : "none";
  return { customer, state, verified: !!customer?.emailVerifiedAt };
}

/** Le client peut-il utiliser sa pizza offerte ? (mot de passe correct + e-mail confirmé) */
export async function checkRedeemCredentials(
  customer: { passwordHash: string | null; emailVerifiedAt: Date | null } | null,
  password: string | undefined
): Promise<{ ok: true } | { ok: false; code: "NO_PASSWORD" | "NOT_VERIFIED" | "BAD_PASSWORD"; message: string }> {
  if (!customer?.passwordHash) {
    return { ok: false, code: "NO_PASSWORD", message: "Créez d'abord un mot de passe pour utiliser votre pizza offerte." };
  }
  if (!customer.emailVerifiedAt) {
    return { ok: false, code: "NOT_VERIFIED", message: "Confirmez d'abord votre e-mail (lien dans votre dernier reçu) pour utiliser votre pizza offerte." };
  }
  if (!password || !(await verifyPassword(password, customer.passwordHash))) {
    return { ok: false, code: "BAD_PASSWORD", message: "Mot de passe incorrect." };
  }
  return { ok: true };
}
