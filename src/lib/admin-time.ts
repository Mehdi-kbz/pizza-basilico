/** Début de journée à Paris (le serveur tourne en UTC) — pour les chiffres « aujourd'hui ». */
export function startOfDayParis(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const [y, m, d] = parts.split("-").map(Number);
  // minuit heure de Paris exprimé en UTC : on teste les deux décalages possibles (CET / CEST)
  for (const offset of [2, 1]) {
    const candidate = new Date(Date.UTC(y, m - 1, d, -offset, 0, 0));
    const back = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hour12: false }).format(candidate);
    if (back === "00" || back === "24") return candidate;
  }
  return new Date(Date.UTC(y, m - 1, d));
}

export const PAID_STATUSES = ["CONFIRMED", "IN_PREP", "READY", "COMPLETED"] as const;
