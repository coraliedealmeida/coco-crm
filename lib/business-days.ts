function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Nombre de jours ouvrés écoulés strictement entre deux dates (hors week-ends, hors jours fériés). */
export function countBusinessDays(start: Date, end: Date): number {
  const from = startOfDay(start);
  const to = startOfDay(end);
  if (to <= from) return 0;

  let count = 0;
  const cursor = new Date(from);
  cursor.setDate(cursor.getDate() + 1);

  while (cursor <= to) {
    if (!isWeekend(cursor)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }

  return count;
}

/** Ajoute N jours ouvrés à une date (hors week-ends). */
export function addBusinessDays(start: Date, days: number): Date {
  const result = startOfDay(start);
  let remaining = days;

  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) remaining--;
  }

  return result;
}

export function isSameDayOrBefore(date: Date, reference: Date): boolean {
  return startOfDay(date) <= startOfDay(reference);
}
