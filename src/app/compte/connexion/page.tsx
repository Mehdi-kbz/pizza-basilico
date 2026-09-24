import { Suspense } from "react";
import { ConnexionForm } from "./ConnexionForm";

export const metadata = { title: "Mon compte — Pizza Basilico" };

export default function ConnexionPage() {
  return (
    <main className="relative">
      <div
        className="absolute inset-x-0 top-0 h-[320px] -z-10"
        aria-hidden="true"
        style={{ background: "radial-gradient(700px 300px at 55% 0%, rgba(255,122,47,0.12), transparent 62%)" }}
      />
      <div className="mx-auto max-w-md px-5 lg:px-8 pt-16 md:pt-24 pb-24">
        <p className="eyebrow">Mon compte</p>
        <h1 className="display text-[clamp(2rem,6vw,3rem)] mt-3">Pas de mot de passe.</h1>
        <p className="text-sm text-fg-dim mt-4 leading-relaxed">
          On vous envoie un lien de connexion par e-mail. Vous y retrouvez votre historique de
          commandes et votre carte de fidélité.
        </p>
        <div className="card p-6 mt-8">
          <Suspense fallback={null}>
            <ConnexionForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
