/**
 * Couche d'abstraction du paiement (cahier des spécifications §9.1).
 * Le reste de l'application ne parle jamais directement à Stripe/Adyen/Mollie :
 * uniquement à cette interface. Changer de prestataire = écrire un nouvel adaptateur.
 */

export interface CreatePaymentIntentInput {
  amountCents: number;
  currency: string; // "eur"
  orderId: string;
  customerEmail: string;
  /** Jeton de carte enregistrée (facultatif) pour un paiement en un clic. */
  savedPaymentMethodId?: string;
}

export interface CreatePaymentIntentResult {
  provider: string;
  providerRef: string; // id du PaymentIntent (ou équivalent)
  clientSecret: string; // à transmettre au client pour finaliser le paiement
}

export interface RefundInput {
  providerRef: string;
  amountCents?: number; // remboursement partiel si fourni, sinon total
  reason?: string;
}

export interface PaymentProvider {
  readonly name: string;
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult>;
  refund(input: RefundInput): Promise<{ providerRefundId: string }>;
  /** Vérifie la signature d'un webhook entrant et renvoie l'évènement normalisé, ou null si invalide. */
  parseWebhookEvent(rawBody: string, signatureHeader: string | null): NormalizedWebhookEvent | null;
}

export type NormalizedWebhookEvent =
  | { type: "payment_succeeded"; providerRef: string }
  | { type: "payment_failed"; providerRef: string }
  | { type: "refunded"; providerRef: string };
