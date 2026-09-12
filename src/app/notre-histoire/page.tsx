import Link from "next/link";

export const metadata = {
  title: "Notre histoire — Pizza Basilico",
  description:
    "Un pizzaïolo, un four à bois, et plusieurs championnats internationaux de pizza. L'histoire derrière le camion.",
};

export default function NotreHistoirePage() {
  return (
    <main className="relative">
      <div
        className="absolute inset-x-0 top-0 h-[520px] -z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(900px 420px at 68% 0%, rgba(217,173,95,0.13), transparent 62%), radial-gradient(700px 340px at 6% 18%, rgba(255,122,47,0.1), transparent 65%)",
        }}
      />

      {/* ------------------------------- Intro ------------------------------- */}
      <section className="mx-auto max-w-4xl px-5 lg:px-8 pt-12 md:pt-16">
        <p className="eyebrow">Notre histoire</p>
        <h1 className="display text-[clamp(2.4rem,7vw,4.4rem)] mt-3 max-w-[20ch]">
          Une pâte, une braise, <span className="italic text-brass">une exigence.</span>
        </h1>
        <p className="lede mt-6">
          Pizza Basilico, c&rsquo;est un camion, un four à bois, et un pizzaïolo qui a défendu son
          travail dans plusieurs championnats internationaux de pizza. La même farine, le même geste
          et la même cuisson qu&rsquo;en compétition — servis sur la place du village.
        </p>
      </section>

      {/* ------------------------------ Palmarès ----------------------------- */}
      <section className="mx-auto max-w-4xl px-5 lg:px-8 mt-14">
        <div className="card p-8 md:p-10 relative overflow-hidden">
          <div
            className="absolute -top-24 -right-16 w-72 h-72 rounded-full blur-3xl opacity-40"
            aria-hidden="true"
            style={{ background: "radial-gradient(circle, rgba(217,173,95,0.45), transparent 70%)" }}
          />
          <div className="relative">
            <span className="chip chip-brass">Compétition</span>
            <h2 className="display text-[clamp(1.6rem,4vw,2.4rem)] mt-5 max-w-[26ch]">
              Plusieurs championnats internationaux de pizza
            </h2>
            <p className="text-cream-dim mt-4 leading-relaxed max-w-2xl">
              Se confronter aux meilleurs, c&rsquo;est accepter d&rsquo;être jugé sur des détails que
              personne ne voit : l&rsquo;hydratation de la pâte, la régularité du cornicione, la
              maîtrise d&rsquo;une cuisson qui ne dure qu&rsquo;une minute et demie. Ce niveau
              d&rsquo;exigence, on ne le range pas au placard en rentrant au camion.
            </p>
            <p className="text-xs text-cream-faint mt-6 border-l-2 border-line-warm pl-4 leading-relaxed">
              Le détail des compétitions, années et classements sera ajouté ici — ainsi que les photos
              de concours.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------- Méthode ----------------------------- */}
      <section className="mx-auto max-w-5xl px-5 lg:px-8 mt-20">
        <p className="eyebrow">La méthode</p>
        <h2 className="display text-[clamp(1.8rem,4.4vw,2.8rem)] mt-3 mb-10">Trois choses non négociables</h2>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              tag: "La pâte",
              title: "Travaillée à la main",
              text: "Une pâte qui a pris son temps : c'est elle qui donne la légèreté et ce bord aéré qu'on reconnaît à la première bouchée.",
            },
            {
              tag: "La braise",
              title: "Un vrai four à bois",
              text: "Le bois donne une chaleur vive et sèche qu'aucune résistance électrique n'imite. Quelques dizaines de secondes, et la pizza est saisie.",
            },
            {
              tag: "Le service",
              title: "Rien de préparé d'avance",
              text: "Chaque pizza est garnie au moment où elle part au four. C'est plus contraignant à organiser — d'où notre système de créneaux.",
            },
          ].map((block) => (
            <article key={block.tag} className="card p-6">
              <span className="chip chip-flame">{block.tag}</span>
              <h3 className="display text-xl mt-4 text-cream">{block.title}</h3>
              <p className="text-sm text-cream-dim mt-2.5 leading-relaxed">{block.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------- Citation ---------------------------- */}
      <section className="mx-auto max-w-3xl px-5 lg:px-8 mt-20 text-center">
        <span className="hairline block mb-10" />
        <p className="display text-[clamp(1.5rem,4vw,2.3rem)] italic text-cream leading-tight">
          « Une bonne pizza, ça ne s&rsquo;improvise pas. Ça se prépare, puis ça se joue en quatre-vingt-dix secondes. »
        </p>
        <span className="hairline block mt-10" />
      </section>

      {/* --------------------------------- CTA ------------------------------- */}
      <section className="mx-auto max-w-4xl px-5 lg:px-8 mt-16 md:mt-20">
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/carte" className="btn btn-primary">
            Découvrir la carte
          </Link>
          <Link href="/#nous-trouver" className="btn btn-ghost">
            Où nous trouver
          </Link>
        </div>
      </section>
    </main>
  );
}
