// Jours fériés français (dates fixes valables chaque année + dates mobiles 2026).
// À compléter si la programmation doit un jour couvrir au-delà de 2026.
const FRENCH_HOLIDAYS = new Set([
  "2026-01-01", // Nouvel An
  "2026-04-06", // Lundi de Pâques
  "2026-05-01", // Fête du Travail
  "2026-05-08", // Victoire 1945
  "2026-05-14", // Ascension
  "2026-05-25", // Lundi de Pentecôte
  "2026-07-14", // Fête Nationale
  "2026-08-15", // Assomption
  "2026-11-01", // Toussaint
  "2026-11-11", // Armistice
  "2026-12-25", // Noël
]);

const CATEGORY_ORDER = ["GRANDE_MARQUE", "PME_STARTUP", "INDEPENDANT"];

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function isWorkday(d: Date): boolean {
  const day = d.getDay();
  if (day === 0 || day === 6) return false;
  return !FRENCH_HOLIDAYS.has(toDateStr(d));
}

function firstWorkdayFrom(d: Date): Date {
  let cursor = startOfDay(d);
  while (!isWorkday(cursor)) cursor = addDays(cursor, 1);
  return cursor;
}

function categoryRank(cat: string | null): number {
  const idx = CATEGORY_ORDER.indexOf(cat ?? "INDEPENDANT");
  return idx === -1 ? CATEGORY_ORDER.length - 1 : idx;
}

function nextWorkday(d: Date): Date {
  return firstWorkdayFrom(addDays(startOfDay(d), 1));
}

/** Avance de n jours ouvrés (jours fériés français exclus) à partir de `from`. */
function addWorkdays(from: Date, n: number): Date {
  let cursor = startOfDay(from);
  for (let i = 0; i < n; i++) cursor = nextWorkday(cursor);
  return cursor;
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

  const floor = startOfDay(ctx.minStartDate);
  const lastPastFloor = ctx.lastScheduledDate && startOfDay(ctx.lastScheduledDate) >= floor ? startOfDay(ctx.lastScheduledDate) : null;

  let currentDate = lastPastFloor ? addWorkdays(lastPastFloor, ctx.spacingDays) : firstWorkdayFrom(floor);

  const result = new Map<string, Date>();

  for (const p of sorted) {
    result.set(p.id, currentDate);
    currentDate = addWorkdays(currentDate, ctx.spacingDays);
  }

  return result;
}
