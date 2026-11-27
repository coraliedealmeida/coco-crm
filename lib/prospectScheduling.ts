import {
  addBusinessDaysToKey,
  firstBusinessDayFrom,
  isBusinessDayKey,
  parisDayKey,
  parisMidnight,
} from "@/lib/dates";

// Jours ouvrés et jours fériés français (calculés pour toutes les années) : voir lib/dates.ts.

const CATEGORY_ORDER = ["GRANDE_MARQUE", "PME_STARTUP", "INDEPENDANT"];

/** Jour ouvré (à Paris) : lundi-vendredi hors jours fériés. */
export function isWorkday(d: Date): boolean {
  return isBusinessDayKey(parisDayKey(d));
}

function categoryRank(cat: string | null): number {
  const idx = CATEGORY_ORDER.indexOf(cat ?? "INDEPENDANT");
  return idx === -1 ? CATEGORY_ORDER.length - 1 : idx;
}

export interface ScheduleInput {
  id: string;
  brandCategory: string | null;
}

export interface ScheduleContext {
  /** Dernière date déjà programmée toutes marques confondues (null si aucune). */
  lastScheduledDate: Date | null;
  /** Nombre de jours ouvrés à laisser entre deux nouvelles marques activées. */
  spacingDays: number;
  /** Aucune date programmée ne peut être antérieure à cette date (ex : reprise après l'été). */
  minStartDate: Date;
}

/**
 * Programme une liste de prospects validés ("Oui") : ordre = priorité de catégorie
 * (Grande marque > PME/Startup > Indépendant), une marque par jour ouvré programmé
 * (jamais plusieurs le même jour), espacées de `spacingDays` jours ouvrés pour éviter
 * de surcharger la routine d'engagement quotidienne, avec une date plancher (minStartDate)
 * et en continuant après la dernière date déjà attribuée (jamais de reset sur une date fixe).
 */
export function scheduleProspects(
  prospects: ScheduleInput[],
  ctx: ScheduleContext
): Map<string, Date> {
  const sorted = [...prospects].sort((a, b) => categoryRank(a.brandCategory) - categoryRank(b.brandCategory));

  const floor = parisDayKey(ctx.minStartDate);
  const last = ctx.lastScheduledDate ? parisDayKey(ctx.lastScheduledDate) : null;
  const lastPastFloor = last && last >= floor ? last : null;

  let currentDay = lastPastFloor
    ? addBusinessDaysToKey(lastPastFloor, ctx.spacingDays)
    : firstBusinessDayFrom(floor);

  // Date enregistrée = minuit à Paris du jour programmé.
  const result = new Map<string, Date>();

  for (const p of sorted) {
    result.set(p.id, parisMidnight(currentDay));
    currentDay = addBusinessDaysToKey(currentDay, ctx.spacingDays);
  }

  return result;
}
