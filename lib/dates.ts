/**
 * Règles de dates de COCO — UNE seule source pour tout le code.
 *
 * Principe : une date « jour » (relance, rappel, échéance…) est toujours lue comme
 * un jour du calendrier À PARIS, quel que soit le fuseau du serveur (Vercel = UTC).
 *
 * Les dates déjà enregistrées existent sous deux formes, toutes deux lues correctement :
 * - minuit à Paris (calendrier DatePicker) : 2026-11-26T23:00Z → jour « 2026-11-27 » ;
 * - minuit UTC (champ date classique)      : 2026-11-27T00:00Z → jour « 2026-11-27 ».
 *
 * Un jour est représenté par une clé texte « AAAA-MM-JJ » (comparable avec < et >).
 */

export const PARIS_TZ = "Europe/Paris";

export type DayKey = string;

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: PARIS_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const offsetFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: PARIS_TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function toDate(d: Date | string): Date {
  return typeof d === "string" ? new Date(d) : d;
}

/** Jour du calendrier à Paris pour un instant donné. */
export function parisDayKey(d: Date | string): DayKey {
  return dayKeyFormatter.format(toDate(d));
}

/** Aujourd'hui, à Paris. */
export function parisToday(now: Date = new Date()): DayKey {
  return parisDayKey(now);
}

function keyParts(key: DayKey): [number, number, number] {
  const [y, m, d] = key.split("-").map(Number);
  return [y, m, d];
}

function keyFromUtc(date: Date): DayKey {
  return date.toISOString().slice(0, 10);
}

/** Ajoute (ou retire) des jours calendaires à une clé de jour. */
export function addDaysToKey(key: DayKey, days: number): DayKey {
  const [y, m, d] = keyParts(key);
  return keyFromUtc(new Date(Date.UTC(y, m - 1, d + days, 12)));
}

/** 0 = dimanche … 6 = samedi. */
export function weekdayOfKey(key: DayKey): number {
  const [y, m, d] = keyParts(key);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

/** Décalage de Paris par rapport à UTC (en minutes) à un instant donné : +60 l'hiver, +120 l'été. */
function parisOffsetMinutes(instant: Date): number {
  const parts = Object.fromEntries(offsetFormatter.formatToParts(instant).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/** Instant de minuit à Paris pour un jour donné (pour enregistrer une date ou filtrer en base). */
export function parisMidnight(key: DayKey): Date {
  const [y, m, d] = keyParts(key);
  const guess = Date.UTC(y, m - 1, d);
  return new Date(guess - parisOffsetMinutes(new Date(guess)) * 60000);
}

/** Premier jour du mois (à Paris) contenant `now`. */
export function parisMonthStartKey(now: Date = new Date()): DayKey {
  return `${parisToday(now).slice(0, 7)}-01`;
}

/** Année et mois (1-12) à Paris d'un instant. */
export function parisYearMonth(d: Date | string): { year: number; month: number } {
  const [year, month] = keyParts(parisDayKey(d));
  return { year, month };
}

// ---------------------------------------------------------------------------
// Jours fériés français (métropole), calculés pour n'importe quelle année.
// ---------------------------------------------------------------------------

/** Dimanche de Pâques (algorithme de Meeus/Jones/Butcher, calendrier grégorien). */
export function easterSunday(year: number): DayKey {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const holidayCache = new Map<number, Map<DayKey, string>>();

/** Les 11 jours fériés français d'une année, avec leur nom. */
export function frenchHolidays(year: number): Map<DayKey, string> {
  const cached = holidayCache.get(year);
  if (cached) return cached;
  const easter = easterSunday(year);
  const list: [DayKey, string][] = [
    [`${year}-01-01`, "Jour de l'An"],
    [addDaysToKey(easter, 1), "Lundi de Pâques"],
    [`${year}-05-01`, "Fête du Travail"],
    [`${year}-05-08`, "Victoire 1945"],
    [addDaysToKey(easter, 39), "Ascension"],
    [addDaysToKey(easter, 50), "Lundi de Pentecôte"],
    [`${year}-07-14`, "Fête nationale"],
    [`${year}-08-15`, "Assomption"],
    [`${year}-11-01`, "Toussaint"],
    [`${year}-11-11`, "Armistice 1918"],
    [`${year}-12-25`, "Noël"],
  ];
  const map = new Map(list);
  holidayCache.set(year, map);
  return map;
}

export function isFrenchHoliday(key: DayKey): boolean {
  return frenchHolidays(keyParts(key)[0]).has(key);
}

/** Jour ouvré = du lundi au vendredi, hors jours fériés français. */
export function isBusinessDayKey(key: DayKey): boolean {
  const wd = weekdayOfKey(key);
  return wd !== 0 && wd !== 6 && !isFrenchHoliday(key);
}

/** Premier jour ouvré à partir de `key` (inclus). */
export function firstBusinessDayFrom(key: DayKey): DayKey {
  let cursor = key;
  while (!isBusinessDayKey(cursor)) cursor = addDaysToKey(cursor, 1);
  return cursor;
}

/** Avance de `days` jours ouvrés après `key` (exclu). */
export function addBusinessDaysToKey(key: DayKey, days: number): DayKey {
  let cursor = key;
  let remaining = days;
  while (remaining > 0) {
    cursor = addDaysToKey(cursor, 1);
    if (isBusinessDayKey(cursor)) remaining--;
  }
  return cursor;
}

/** Nombre de jours ouvrés strictement après le jour de `start`, jusqu'au jour de `end` inclus. */
export function countBusinessDaysBetweenKeys(startKey: DayKey, endKey: DayKey): number {
  if (endKey <= startKey) return 0;
  let count = 0;
  let cursor = addDaysToKey(startKey, 1);
  while (cursor <= endKey) {
    if (isBusinessDayKey(cursor)) count++;
    cursor = addDaysToKey(cursor, 1);
  }
  return count;
}

/** Dernier instant de la journée d'aujourd'hui à Paris (23:59:59.999) : « tout ce qui est dû aujourd'hui ». */
export function parisEndOfToday(now: Date = new Date()): Date {
  return new Date(parisMidnight(addDaysToKey(parisToday(now), 1)).getTime() - 1);
}

/** Ajoute des mois à une clé de jour (le 31 janvier + 1 mois = le 28/29 février). */
export function addMonthsToKey(key: DayKey, months: number): DayKey {
  const [y, m, d] = keyParts(key);
  const target = new Date(Date.UTC(y, m - 1 + months, 1, 12));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return keyFromUtc(target);
}

/** Nombre de mois calendaires (à Paris) entre deux dates : janvier → mars = 2. */
export function monthsBetween(start: Date | string, end: Date | string): number {
  const a = parisYearMonth(start);
  const b = parisYearMonth(end);
  return (b.year - a.year) * 12 + (b.month - a.month);
}
