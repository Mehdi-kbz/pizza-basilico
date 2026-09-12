import Link from "next/link";

/**
 * Coquille commune aux pages légales. Le contenu définitif viendra d'un
 * générateur de modèles juridiques relu par le client (cahier des
 * spécifications §12.1) : la page existe et est honnête sur ce statut plutôt
 * que d'afficher un texte inventé.
 */
export function LegalShell({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 lg:px-8 pt-12 md:pt-16">
      <p className="eyebrow">Informations légales</p>
      <h1 className="display text-[clamp(2rem,5.5vw,3.2rem)] mt-3">{title}</h1>
      <p className="lede mt-5">{intro}</p>

      <div className="card p-5 mt-8 border-l-2 border-l-ember">
        <p className="text-sm text-cream-dim leading-relaxed">
          <strong className="text-cream">Document en cours de finalisation.</strong> Le texte
          définitif est établi avec un service de modèles juridiques et validé avant l&rsquo;ouverture
          des paiements réels. Pour toute question d&rsquo;ici là :{" "}
          <a href="tel:+33645230656" className="text-ember hover:underline tnum">
            06 45 23 06 56
          </a>
          .
        </p>
      </div>

      <div className="flex flex-col gap-8 mt-12">
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className="display text-xl text-cream">{s.heading}</h2>
            <p className="text-sm text-cream-dim mt-2.5 leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>

      <div className="hairline my-12" />

      <div className="flex flex-wrap gap-5 text-sm text-cream-faint">
        <Link href="/mentions-legales" className="hover:text-cream-dim transition-colors">Mentions légales</Link>
        <Link href="/cgv" className="hover:text-cream-dim transition-colors">CGV</Link>
        <Link href="/confidentialite" className="hover:text-cream-dim transition-colors">Confidentialité</Link>
      </div>
    </main>
  );
}
