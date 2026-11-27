/**
 * Jours ouvrés (lundi-vendredi, hors jours fériés français), comptés en jours de
 * calendrier à Paris. Règles détaillées : `lib/dates.ts`.
 */
import {
  addBusinessDaysToKey,
  countBusinessDaysBetweenKeys,
  parisDayKey,
  parisMidnight,
} from "@/lib/dates";

/** Nombre de jours ouvrés écoulés strictement entre deux dates (hors week-ends, hors jours fériés). */
export function countBusinessDays(start: Date | string, end: Date | string): number {
  return countBusinessDaysBetweenKeys(parisDayKey(start), parisDayKey(end));
}

/** Ajoute N jours ouvrés à une date ; renvoie minuit (heure de Paris) du jour obtenu. */
export function addBusinessDays(start: Date | string, days: number): Date {
  return parisMidnight(addBusinessDaysToKey(parisDayKey(start), days));
}

/** Le jour (à Paris) de `date` est-il aujourd'hui ou avant celui de `reference` ? */
export function isSameDayOrBefore(date: Date | string, reference: Date | string): boolean {
  return parisDayKey(date) <= parisDayKey(reference);
}
