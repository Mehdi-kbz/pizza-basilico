import { LegalShell } from "@/components/LegalShell";

export const metadata = { title: "Mentions légales — Pizza Basilico" };

export default function MentionsLegalesPage() {
  return (
    <LegalShell
      title="Mentions légales"
      intro="Informations relatives à l'éditeur de ce site et à son hébergement."
      sections={[
        {
          heading: "Éditeur du site",
          body: "Pizza Basilico — food truck de pizzas artisanales au feu de bois. Raison sociale, forme juridique, numéro SIRET, adresse du siège et numéro de TVA intracommunautaire seront publiés ici.",
        },
        {
          heading: "Contact",
          body: "Par téléphone au 06 45 23 06 56, ou via le formulaire de la page Traiteur & événements.",
        },
        {
          heading: "Hébergement",
          body: "Le site est hébergé sur un serveur dédié en Europe. Les coordonnées complètes de l'hébergeur seront publiées ici.",
        },
        {
          heading: "Propriété intellectuelle",
          body: "L'ensemble des contenus de ce site (textes, visuels, recettes, identité visuelle) est la propriété de Pizza Basilico, sauf mention contraire.",
        },
      ]}
    />
  );
}
