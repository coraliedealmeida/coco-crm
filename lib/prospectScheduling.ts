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

function nextMonday(from: Date): Date {
  const d = startOfDay(from);
  const dow = d.getDay();
  const daysUntilMonday = dow === 1 ? 0 : (8 - dow) % 7;
  return addDays(d, daysUntilMonday);
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
  /** Nombre de marques déjà programmées exactement à lastScheduledDate. */
  countAtLastScheduledDate: number;
  /** Cadence maximale de nouvelles marques par semaine. */
  maxPerWeek: number;
  /** Aucune date programmée ne peut être antérieure à cette date (ex : reprise après l'été). */
  minStartDate: Date;
}

/**
 * Programme une liste de prospects validés ("Oui") : ordre = priorité de catégorie
 * (Grande marque > PME/Startup > Indépendant), en respectant la cadence max/semaine,
 * les jours ouvrés (jours fériés français exclus), une date plancher (minStartDate),
 * et en continuant après la dernière date déjà attribuée (jamais de reset sur une date fixe).
 */
export function scheduleProspects(
  prospects: ScheduleInput[],
  ctx: ScheduleContext
): Map<string, Date> {
  const sorted = [...prospects].sort((a, b) => categoryRank(a.brandCategory) - categoryRank(b.brandCategory));

  const floor = startOfDay(ctx.minStartDate);
  const lastPastFloor = ctx.lastScheduledDate && startOfDay(ctx.lastScheduledDate) >= floor ? startOfDay(ctx.lastScheduledDate) : null;

  let currentDate: Date;
  let countThisSlot: number;

  if (lastPastFloor && ctx.countAtLastScheduledDate < ctx.maxPerWeek) {
    currentDate = lastPastFloor;
    countThisSlot = ctx.countAtLastScheduledDate;
  } else {
    const base = lastPastFloor ? addDays(lastPastFloor, 7) : floor;
    currentDate = firstWorkdayFrom(nextMonday(base));
    countThisSlot = 0;
  }

  const result = new Map<string, Date>();

  for (const p of sorted) {
    if (countThisSlot >= ctx.maxPerWeek) {
      currentDate = firstWorkdayFrom(addDays(currentDate, 7));
      countThisSlot = 0;
    }
    result.set(p.id, currentDate);
    countThisSlot++;
  }

  return result;
}
