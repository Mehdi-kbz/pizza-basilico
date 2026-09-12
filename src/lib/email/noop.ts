import type { EmailProvider, SendEmailInput } from "./types";

/**
 * Utilisé tant qu'EMAIL_API_KEY n'est pas renseigné (§10.4/§11.4 pas encore
 * activés côté infra) : n'envoie rien mais ne fait jamais échouer la commande
 * en cours à cause d'un e-mail — juste une trace en log.
 */
export class NoopEmailProvider implements EmailProvider {
  readonly name = "noop";

  async send(input: SendEmailInput) {
    console.warn(`[email] EMAIL_API_KEY non configuré — e-mail à "${input.to}" (${input.subject}) non envoyé.`);
  }
}
