import { LegalShell } from "@/components/LegalShell";

export const metadata = { title: "Confidentialité — Pizza Basilico" };

export default function ConfidentialitePage() {
  return (
    <LegalShell
      title="Protection des données"
      intro="Quelles données nous collectons, pourquoi, et pendant combien de temps."
      sections={[
        {
          heading: "Données collectées",
          body: "Pour une commande : votre adresse e-mail, un nom pour le retrait, le détail de la commande et, si vous en ajoutez une, une note de préparation. Aucun numéro de téléphone n'est demandé. Aucune donnée de carte bancaire n'est stockée par nos serveurs.",
        },
        {
          heading: "Finalités",
          body: "Traiter et vous restituer votre commande, vous envoyer votre reçu, alimenter votre carte de fidélité, et — uniquement si vous y avez consenti — vous informer de nos prochains emplacements.",
        },
        {
          heading: "Consentement marketing",
          body: "L'inscription à la newsletter est facultative et distincte de la commande. Le consentement est conservé trois ans, conformément aux recommandations de la CNIL, avec une demande de reconfirmation à l'issue de cette période. La désinscription est possible à tout moment.",
        },
        {
          heading: "Durées de conservation",
          body: "Les registres comptables sont conservés selon les durées légales applicables. Les données de contact utilisées à des fins commerciales sont supprimées ou anonymisées à l'expiration du consentement.",
        },
        {
          heading: "Vos droits",
          body: "Vous pouvez demander l'accès, la rectification ou la suppression de vos données depuis la page Mon compte, ou en nous contactant. Nous y répondons dans les délais prévus par le RGPD.",
        },
        {
          heading: "Mesure d'audience et cookies",
          body: "Aucun outil de mesure d'audience tiers n'est installé sur ce site et aucun cookie publicitaire n'est déposé. Seuls des cookies strictement nécessaires au fonctionnement (session de commande, connexion à votre compte) sont utilisés.",
        },
      ]}
    />
  );
}
