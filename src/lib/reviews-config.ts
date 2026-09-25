/**
 * Bandeau « avis Google » de l'accueil. Chiffres à tenir à jour ici (un seul endroit) :
 * ils sont affichés tels quels, il faut donc qu'ils correspondent à la fiche Google Maps.
 */
export const REVIEWS = {
  /** Fiche Google Maps de l'établissement (sans paramètres de suivi). */
  url: "https://www.google.com/maps/place/Pizza+basilico/@43.5506187,1.5087801,633m/data=!3m2!1e3!4b1!4m6!3m5!1s0x12aebd7abe1d468f:0x3dcdb005140f5c31!8m2!3d43.5506187!4d1.511355!16s%2Fg%2F11rb1h3qpz",
  /** Nombre d'avis affiché (le « + » est ajouté à l'affichage). */
  count: 400,
  /** Étoiles pleines affichées (1 à 5). */
  stars: 5,
} as const;
