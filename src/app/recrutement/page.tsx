import { StoryPhoto } from "@/components/StoryPhoto";
import { JoinForm } from "./JoinForm";

export const metadata = {
  title: "Rejoignez-nous — Pizza Basilico",
  description: "Envoyez votre candidature spontanée à l'équipe Pizza Basilico.",
};

export default function RecrutementPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-5 pt-10 md:pt-14 pb-24">
      <div className="grid items-center gap-7 md:grid-cols-[1.2fr_1fr] md:gap-10">
        <div className="text-center md:text-left">
          <p className="eyebrow">Recrutement</p>
          <h1 className="display text-[clamp(2.2rem,6.5vw,3.6rem)] mt-3">
            Rejoignez <span className="italic text-ember">l&rsquo;équipe.</span>
          </h1>
          <p className="lede mx-auto mt-4 md:mx-0">Un four, une équipe, de bonnes pizzas. Envoyez-nous votre CV.</p>
        </div>
        <StoryPhoto file="samir-pate.webp" label="Samir travaille la pâte" emoji="🍕" aspect="aspect-[4/3] md:aspect-[4/5]" position="center 35%" className="mx-auto max-w-sm md:max-w-none" />
      </div>
      <JoinForm />
    </main>
  );
}
