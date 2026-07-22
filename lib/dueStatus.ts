import { countBusinessDays } from "@/lib/business-days";

export type DueBadge = { variant: "today" | "late"; lateDays: number };

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Badge Aujourd'hui/En retard à partir d'une date d'action explicite (ex: nextActionDate). */
export function dueBadgeFromDate(date: Date | string | null | undefined, now: Date): DueBadge | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (isSameCalendarDay(d, now)) return { variant: "today", lateDays: 0 };
  if (d > now) return null;
  return { variant: "late", lateDays: countBusinessDays(d, now) };
}

/**
 * Badge Aujourd'hui/En retard pour la routine d'engagement, où il n'y a pas de date d'action
 * stockée : on compare directement les jours ouvrés déjà écoulés au seuil du feu vert (le jour
 * où le seuil est atteint joue le rôle de "date d'action").
 */
export function dueBadgeFromThreshold(elapsedDays: number, threshold: number): DueBadge | null {
  if (elapsedDays < threshold) return null;
  if (elapsedDays === threshold) return { variant: "today", lateDays: 0 };
  return { variant: "late", lateDays: elapsedDays - threshold };
}

/**
 * Clé de tri croissante : les retards les plus importants en tête, puis les "Aujourd'hui",
 * puis le reste (pas encore dû) dans son ordre d'origine.
 */
export function dueSortKey(badge: DueBadge | null): number {
  if (!badge) return 1_000_000;
  if (badge.variant === "today") return -1;
  return -1000 - badge.lateDays;
}
