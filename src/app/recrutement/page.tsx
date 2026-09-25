import { JoinForm } from "./JoinForm";

export const metadata = {
  title: "Rejoignez-nous — Pizza Basilico",
  description: "Envoyez votre candidature spontanée à l'équipe Pizza Basilico.",
};

export default function RecrutementPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-5 pt-10 md:pt-14 pb-24">
      <div className="text-center">
        <p className="eyebrow">Recrutement</p>
        <h1 className="display text-[clamp(2.2rem,6.5vw,3.6rem)] mt-3">
          Rejoignez <span className="italic text-ember">l&rsquo;équipe.</span>
        </h1>
        <p className="lede mx-auto mt-4">Un four, une équipe, de bonnes pizzas. Envoyez-nous votre CV.</p>
      </div>
      <JoinForm />
    </main>
  );
}
