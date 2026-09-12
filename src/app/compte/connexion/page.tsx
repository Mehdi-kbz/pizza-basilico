import { Suspense } from "react";
import { ConnexionForm } from "./ConnexionForm";

export default function ConnexionPage() {
  return (
    <main className="mx-auto max-w-sm w-full px-5 py-16 flex-1">
      <p className="text-xs tracking-[0.14em] uppercase text-[#a5462d] font-medium">Pizza Basilico</p>
      <h1 className="text-xl font-semibold mt-1 mb-2">Mon compte</h1>
      <p className="text-[#585a4d] text-sm mb-6">
        Pas de mot de passe — on vous envoie un lien de connexion par e-mail.
      </p>
      <Suspense fallback={null}>
        <ConnexionForm />
      </Suspense>
    </main>
  );
}
