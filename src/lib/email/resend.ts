import type { EmailProvider, SendEmailInput } from "./types";

/**
 * Adaptateur Resend — API HTTP simple, pas de SDK nécessaire. Comme pour les
 * paiements (§9.1), le reste de l'app ne parle qu'à l'interface EmailProvider.
 */
export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";
  private apiKey: string;
  private from: string;

  constructor() {
    this.apiKey = process.env.EMAIL_API_KEY!;
    this.from = process.env.EMAIL_FROM || "commandes@pizza.mehdi.website";
  }

  async send(input: SendEmailInput) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: this.from, to: input.to, subject: input.subject, html: input.html }),
    });
    if (!res.ok) {
      throw new Error(`Échec d'envoi e-mail (Resend) : ${res.status} ${await res.text()}`);
    }
  }
}
