import Stripe from "stripe";
import type {
  PaymentProvider,
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  RefundInput,
  NormalizedWebhookEvent,
} from "./types";

/**
 * Adaptateur Stripe — prestataire retenu pour le développement initial (§9.1).
 * Aucune donnée de carte ne transite par nos serveurs : la saisie se fait via
 * les champs hébergés Stripe (Payment Element) côté client, à partir du
 * `clientSecret` renvoyé ici.
 */
export class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe";
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) throw new Error("STRIPE_SECRET_KEY manquant.");
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
    this.stripe = new Stripe(apiKey);
  }

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult> {
    const intent = await this.stripe.paymentIntents.create({
      amount: input.amountCents,
      currency: input.currency,
      receipt_email: input.customerEmail,
      metadata: { orderId: input.orderId },
      payment_method: input.savedPaymentMethodId,
      automatic_payment_methods: { enabled: true },
    });
    if (!intent.client_secret) throw new Error("Stripe n'a pas renvoyé de client_secret.");
    return { provider: this.name, providerRef: intent.id, clientSecret: intent.client_secret };
  }

  async refund(input: RefundInput) {
    const refund = await this.stripe.refunds.create({
      payment_intent: input.providerRef,
      amount: input.amountCents,
      reason: "requested_by_customer",
    });
    return { providerRefundId: refund.id };
  }

  parseWebhookEvent(rawBody: string, signatureHeader: string | null): NormalizedWebhookEvent | null {
    if (!signatureHeader) return null;
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signatureHeader, this.webhookSecret);
    } catch {
      return null;
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        return { type: "payment_succeeded", providerRef: (event.data.object as Stripe.PaymentIntent).id };
      case "payment_intent.payment_failed":
        return { type: "payment_failed", providerRef: (event.data.object as Stripe.PaymentIntent).id };
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        return { type: "refunded", providerRef: String(charge.payment_intent) };
      }
      default:
        return null;
    }
  }
}
