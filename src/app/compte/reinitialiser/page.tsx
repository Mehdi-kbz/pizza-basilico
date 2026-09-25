import { Suspense } from "react";
import { ResetForm } from "./ResetForm";

export const metadata = { title: "Choisir mon mot de passe — Pizza Basilico" };

export default function ResetPage() {
  return (
    <main className="mx-auto max-w-md px-4 pt-12 pb-24 md:pt-20">
      <p className="eyebrow">Mon compte</p>
      <h1 className="display mt-3 text-[clamp(2rem,6vw,3rem)]">Choisissez votre mot de passe.</h1>
      <div className="card mt-7 p-5 sm:p-6">
        <Suspense fallback={null}>
          <ResetForm />
        </Suspense>
      </div>
    </main>
  );
}
