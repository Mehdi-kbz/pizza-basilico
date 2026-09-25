import { Suspense } from "react";
import { ConnexionForm } from "./ConnexionForm";

export const metadata = { title: "Mon compte — Pizza Basilico" };

export default function ConnexionPage() {
  return (
    <main className="mx-auto max-w-md px-4 pt-12 pb-24 md:pt-20">
      <p className="eyebrow">Mon compte</p>
      <h1 className="display mt-3 text-[clamp(2rem,6vw,3rem)]">Bon retour.</h1>
      <p className="mt-3 text-sm leading-relaxed text-fg-dim">Retrouvez vos commandes et votre carte de fidélité.</p>
      <div className="card mt-7 p-5 sm:p-6">
        <Suspense fallback={null}>
          <ConnexionForm />
        </Suspense>
      </div>
    </main>
  );
}
