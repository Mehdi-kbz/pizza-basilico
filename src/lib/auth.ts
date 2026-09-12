import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as OTPAuth from "otpauth";
import crypto from "node:crypto";

/**
 * Authentification — personnel (mot de passe + 2FA obligatoire) et clients
 * (lien magique sans mot de passe). Cahier des spécifications §10.1 et §8.
 */

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("SESSION_SECRET manquant en production.");
}

// ---------------------------------------------------------------------------
// Personnel : mot de passe + TOTP obligatoire
// ---------------------------------------------------------------------------

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateTotpSecret(label: string) {
  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: "Pizza Basilico",
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
  return { base32Secret: secret.base32, otpauthUrl: totp.toString() };
}

export function verifyTotpCode(base32Secret: string, code: string) {
  const totp = new OTPAuth.TOTP({
    issuer: "Pizza Basilico",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(base32Secret),
  });
  // tolère un décalage d'une période (30s) avant/après pour l'horloge du téléphone
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

export interface StaffSessionPayload {
  sub: string; // staffUserId
  role: "OWNER" | "STAFF";
}

export function signStaffSession(payload: StaffSessionPayload) {
  return jwt.sign(payload, SESSION_SECRET!, { expiresIn: "12h" });
}

export function verifyStaffSession(token: string): StaffSessionPayload | null {
  try {
    return jwt.verify(token, SESSION_SECRET!) as StaffSessionPayload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Clients : compte optionnel sans mot de passe (lien magique par e-mail) — §3.1/§8
// ---------------------------------------------------------------------------

export function generateMagicLinkToken() {
  const raw = crypto.randomBytes(32).toString("base64url");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashMagicLinkToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export interface CustomerSessionPayload {
  sub: string; // customerId
  email: string;
}

export function signCustomerSession(payload: CustomerSessionPayload) {
  return jwt.sign(payload, SESSION_SECRET!, { expiresIn: "30d" });
}

export function verifyCustomerSession(token: string): CustomerSessionPayload | null {
  try {
    return jwt.verify(token, SESSION_SECRET!) as CustomerSessionPayload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Jeton non devinable pour la page de suivi de commande (§12.3)
// ---------------------------------------------------------------------------

export function signOrderTrackingToken(orderId: string) {
  return jwt.sign({ sub: orderId }, SESSION_SECRET!, { expiresIn: "30d" });
}

export function verifyOrderTrackingToken(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, SESSION_SECRET!) as { sub: string };
  } catch {
    return null;
  }
}
