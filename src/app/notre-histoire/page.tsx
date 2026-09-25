import Link from "next/link";
import { StoryPhoto } from "@/components/StoryPhoto";

export const metadata = {
  title: "Notre histoire — Pizza Basilico",
  description: "Samir, pizzaiolo passionné : un camion à pizzas au feu de bois à Toulouse, du rêve de 2009 au Championnat du monde de la pizza à Parme.",
};

const HIGHLIGHTS = [
  { big: "2009", small: "Le début" },
  { big: "Toulouse", small: "et alentours" },
  { big: "Parme", small: "Championnat du monde" },
  { big: "2026", small: "Restaurant Guru" },
];

const CHAPTERS = [
  {
    eyebrow: "Le rêve",
    title: "Tout commence en 2009.",
    text: "Samir, pizzaiolo passionné, décide de faire de la cuisine italienne son métier. Des débuts difficiles, des journées sans fin, mais jamais l'envie d'abandonner.",
    photo: { file: "samir.webp", label: "Samir devant son camion (noir & blanc)", emoji: "👨‍🍳", aspect: "aspect-[4/5]" },
  },
  {
    eyebrow: "Le four",
    title: "Le feu de bois change tout.",
    text: "Pâte maison, produits soigneusement choisis, cuisson au feu de bois. Des recettes traditionnelles et des créations originales.",
    photo: { file: "four.webp", label: "Le four à bois", emoji: "🔥", aspect: "aspect-[4/3]" },
  },
  {
    eyebrow: "Le camion",
    title: "Toute la région toulousaine.",
    text: "Toulouse, Saint-Orens, Ramonville… et vos événements privés ou professionnels, des mariages aux soirées d'entreprise.",
    photo: { file: "camion.webp", label: "Le camion Pizza Basilico", emoji: "🚚", aspect: "aspect-[4/3]" },
  },
  {
    eyebrow: "Le lieu",
    title: "Plus qu'un camion à pizzas.",
    text: "Un vrai lieu de rencontre, avec un espace d'arcade pour petits et grands. Et la livraison à domicile.",
    photo: { file: "arcade.webp", label: "L'espace arcade du camion", emoji: "🕹️", aspect: "aspect-[4/3]" },
  },
  {
    eyebrow: "Parme",
    title: "Jusqu'au Championnat du monde.",
    text: "Pizza Basilico a participé au Championnat du monde de la pizza, à Parme. En 2026, Restaurant Guru recommande l'adresse.",
    photo: { file: "championnat.webp", label: "Le Championnat du monde de la pizza, Parme", emoji: "🏆", aspect: "aspect-[4/3]" },
  },
];

export default function NotreHistoirePage() {
  return (
    <main className="mx-auto max-w-5xl px-3 sm:px-5 pt-4 pb-10">
      <section className="panel-peach px-6 py-12 text-center sm:px-10 md:py-16">
        <p className="eyebrow">Notre histoire</p>
        <h1 className="display mx-auto mt-3 max-w-[16ch] text-[clamp(2.4rem,7vw,4.4rem)]">
          Une pâte, une braise, <span className="italic text-ember">une passion.</span>
        </h1>
        <p className="lede mx-auto mt-4">L&rsquo;histoire de Samir, pizzaiolo toulousain.</p>
      </section>

      <section aria-label="Repères" className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {HIGHLIGHTS.map((h) => (
          <div key={h.big} className="card p-4 text-center">
            <p className="display text-[clamp(1.4rem,3.4vw,2rem)] text-ember">{h.big}</p>
            <p className="mt-0.5 text-xs text-fg-dim">{h.small}</p>
          </div>
        ))}
      </section>

      <div className="mt-14 flex flex-col gap-16 md:mt-20 md:gap-24">
        {CHAPTERS.map((c, i) => (
          <article key={c.eyebrow} className={`grid items-center gap-7 md:grid-cols-2 md:gap-14 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
            <StoryPhoto {...c.photo} className={c.photo.aspect === "aspect-[4/5]" ? "mx-auto max-w-sm" : ""} />
            <div className="px-1">
              <p className="eyebrow">{c.eyebrow}</p>
              <h2 className="display mt-3 text-[clamp(1.7rem,4.2vw,2.5rem)]">{c.title}</h2>
              <p className="mt-4 max-w-md text-[1.02rem] leading-relaxed text-fg-dim">{c.text}</p>
            </div>
          </article>
        ))}
      </div>

      <section className="mx-auto mt-20 max-w-3xl text-center">
        <span className="hairline mb-8 block" />
        <p className="display text-[clamp(1.4rem,3.8vw,2.1rem)] italic leading-tight">Merci à nos clients fidèles, à nos familles et à nos amis.</p>
        <span className="hairline mt-8 block" />
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/#pizzas" className="btn btn-primary">Découvrir la carte</Link>
          <Link href="/traiteur" className="btn btn-ghost">Événements &amp; traiteur</Link>
        </div>
      </section>
    </main>
  );
}
