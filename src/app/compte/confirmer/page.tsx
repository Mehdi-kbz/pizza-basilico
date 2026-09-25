import { Suspense } from "react";
import { ConfirmForm } from "./ConfirmForm";

export const metadata = { title: "Confirmer mon e-mail — Pizza Basilico" };

export default function ConfirmPage() {
  return (
    <main className="mx-auto max-w-md px-4 pt-12 pb-24 md:pt-20">
      <Suspense fallback={null}>
        <ConfirmForm />
      </Suspense>
    </main>
  );
}
