import type { PaymentProvider } from "./types";
import { StripePaymentProvider } from "./stripe";

export type { PaymentProvider, NormalizedWebhookEvent } from "./types";

let provider: PaymentProvider | null = null;

/** Prestataire actif — Stripe par défaut, changement de prestataire = un seul point à modifier. */
export function getPaymentProvider(): PaymentProvider {
  if (!provider) provider = new StripePaymentProvider();
  return provider;
}
