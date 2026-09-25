import { Suspense } from "react";
import { ConnexionForm } from "../connexion/ConnexionForm";

export const metadata = { title: "Mot de passe — Pizza Basilico" };

export default function ForgotPage() {
  return (
    <main className="mx-auto max-w-md px-4 pt-12 pb-24 md:pt-20">
      <p className="eyebrow">Mon compte</p>
      <h1 className="display mt-3 text-[clamp(2rem,6vw,3rem)]">Votre mot de passe.</h1>
      <p className="mt-3 text-sm leading-relaxed text-fg-dim">
        Entrez votre e-mail : on vous envoie un lien pour choisir un mot de passe. Il active aussi votre compte si vous avez déjà commandé.
      </p>
      <div className="card mt-7 p-5 sm:p-6">
        <Suspense fallback={null}>
          <ConnexionForm initialMode="forgot" />
        </Suspense>
      </div>
    </main>
  );
}
