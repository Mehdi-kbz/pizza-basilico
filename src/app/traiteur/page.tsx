import { CateringForm } from "./CateringForm";

export const metadata = {
  title: "Traiteur & événements — Pizza Basilico",
  description: "Privatiser le camion pour un mariage, un anniversaire ou un événement d'entreprise.",
};

export default function TraiteurPage() {
  return (
    <main className="relative">
      <div
        className="absolute inset-x-0 top-0 h-[420px] -z-10"
        aria-hidden="true"
        style={{
          background: "radial-gradient(800px 360px at 72% 0%, rgba(255,122,47,0.13), transparent 62%)",
        }}
      />

      <section className="mx-auto max-w-4xl px-5 lg:px-8 pt-12 md:pt-16">
        <p className="eyebrow">Traiteur & événements</p>
        <h1 className="display text-[clamp(2.3rem,6.5vw,4rem)] mt-3 max-w-[22ch]">
          Le camion, <span className="italic text-ember">rien que pour vous.</span>
        </h1>
        <p className="lede mt-6">
          Mariage, anniversaire, événement d&rsquo;entreprise, fête de village : on installe le four à
          bois chez vous et on cuit à la chaîne pendant toute la soirée. Dites-nous ce que vous avez en
          tête, on revient vers vous avec une proposition.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-5 lg:px-8 mt-12 grid gap-8 lg:grid-cols-[1.1fr_1fr] items-start">
        <div className="card p-7 md:p-8">
          <h2 className="display text-2xl mb-5">Votre demande</h2>
          <CateringForm />
        </div>

        <aside className="flex flex-col gap-4">
          {[
            { title: "À partir de combien de personnes ?", text: "On s'adapte, mais le four prend tout son sens à partir d'une trentaine de convives." },
            { title: "Ce qu'il nous faut sur place", text: "Un accès pour le camion et un espace dégagé et sécurisé autour du four." },
            { title: "Combien de temps à l'avance ?", text: "Le plus tôt possible pour les week-ends de printemps et d'été, qui partent vite." },
          ].map((f) => (
            <div key={f.title} className="card p-5">
              <h3 className="text-cream font-semibold text-[0.95rem]">{f.title}</h3>
              <p className="text-sm text-cream-dim mt-2 leading-relaxed">{f.text}</p>
            </div>
          ))}
          <p className="text-xs text-cream-faint leading-relaxed px-1">
            Vous préférez le téléphone ?{" "}
            <a href="tel:+33645230656" className="text-ember hover:underline tnum">
              06 45 23 06 56
            </a>
          </p>
        </aside>
      </section>
    </main>
  );
}
