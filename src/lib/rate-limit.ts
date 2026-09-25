/**
 * Limiteur d'essais en mémoire (un seul conteneur). Sert à freiner les attaques
 * par force brute sur la connexion admin : au-delà de `max` échecs dans la
 * fenêtre, on refuse les essais suivants jusqu'à expiration.
 */
const buckets = new Map<string, number[]>();

export function tooManyAttempts(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  buckets.set(key, recent);
  return recent.length >= max;
}

export function recordAttempt(key: string) {
  buckets.set(key, [...(buckets.get(key) ?? []), Date.now()]);
}

export function clearAttempts(key: string) {
  buckets.delete(key);
}
