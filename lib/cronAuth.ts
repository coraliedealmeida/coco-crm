import { timingSafeEqual } from "node:crypto";

/**
 * Vérifie l'en-tête `Authorization: Bearer <CRON_SECRET>` envoyé par Vercel aux
 * tâches automatiques. Refuse tout si `CRON_SECRET` est absent
 * (avant : un secret manquant faisait accepter le mot « undefined »).
 */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return safeEqual(header, `Bearer ${secret}`);
}

/** Comparaison de deux textes en temps constant (ne révèle pas où ils diffèrent). */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
