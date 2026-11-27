/**
 * Limite les essais de mot de passe : après 5 échecs en 15 minutes depuis la même
 * adresse, la connexion est bloquée 15 minutes.
 *
 * Limite connue : le compteur vit dans la mémoire du serveur. Vercel peut faire
 * tourner plusieurs serveurs en parallèle et les redémarre souvent : c'est un frein
 * (qui ralentit fortement une attaque), pas un verrou absolu.
 */
export const MAX_FAILURES = 5;
export const WINDOW_MS = 15 * 60 * 1000;

type Entry = { failures: number[] };
const attempts = new Map<string, Entry>();

function recent(entry: Entry | undefined, now: number): number[] {
  return (entry?.failures ?? []).filter((t) => now - t < WINDOW_MS);
}

/** Nombre de secondes d'attente restantes (0 = l'essai est autorisé). */
export function retryAfterSeconds(key: string, now = Date.now()): number {
  const failures = recent(attempts.get(key), now);
  if (failures.length < MAX_FAILURES) return 0;
  const oldest = failures[failures.length - MAX_FAILURES];
  return Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
}

export function recordFailure(key: string, now = Date.now()): void {
  const failures = recent(attempts.get(key), now);
  failures.push(now);
  attempts.set(key, { failures });
  if (attempts.size > 1000) {
    for (const [k, e] of attempts) if (recent(e, now).length === 0) attempts.delete(k);
  }
}

export function resetFailures(key: string): void {
  attempts.delete(key);
}
