import { LegalShell } from "@/components/LegalShell";

export const metadata = { title: "Conditions générales de vente — Pizza Basilico" };

export default function CgvPage() {
  return (
    <LegalShell
      title="Conditions générales de vente"
      intro="Conditions applicables aux commandes passées en ligne et retirées au camion."
      sections={[
        {
          heading: "Objet",
          body: "Les présentes conditions régissent la vente de produits alimentaires préparés à la commande, exclusivement en vente à emporter, retirés sur place au camion. Aucune livraison n'est proposée.",
        },
        {
          heading: "Commande et créneau de retrait",
          body: "Chaque commande est rattachée à un créneau de cuisson dont la capacité est limitée. Le créneau proposé au moment du paiement correspond à la prochaine fenêtre réellement disponible. La commande est ferme dès la confirmation du paiement.",
        },
        {
          heading: "Prix et paiement",
          body: "Les prix sont indiqués en euros, toutes taxes comprises. Le paiement s'effectue en ligne au moment de la commande ; les données de carte bancaire ne transitent jamais par nos serveurs et sont traitées par notre prestataire de paiement certifié.",
        },
        {
          heading: "Droit de rétractation",
          body: "Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux denrées alimentaires périssables préparées à la commande.",
        },
        {
          heading: "Annulation et non-retrait",
          body: "La vente est ferme après paiement. En cas d'incident de notre fait (rupture d'un ingrédient après paiement, immobilisation du camion), la commande est annulée et remboursée intégralement. Une commande non retirée reste due.",
        },
        {
          heading: "Réclamations",
          body: "Tout problème peut être signalé depuis la page de suivi de votre commande, ou directement au comptoir le jour du service.",
        },
      ]}
    />
  );
}
