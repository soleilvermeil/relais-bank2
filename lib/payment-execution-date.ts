/**
 * Local-calendar helpers for payment execution dates.
 * Matches `<input type="date">` (YYYY-MM-DD) and mock data (DD.MM.YYYY).
 */

export function formatLocalIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Swiss calendar date for mock lists (matches seed data). */
export function formatSwissLocalDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getTomorrowLocalIso(now: Date = new Date()): string {
  const t = startOfLocalDay(now);
  t.setDate(t.getDate() + 1);
  return formatLocalIsoDate(t);
}

export function parseExecutionDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    if (!isFiniteDateParts(year, month, day)) return null;
    return startOfLocalDay(new Date(year, month - 1, day));
  }

  const swiss = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(trimmed);
  if (swiss) {
    const day = Number(swiss[1]);
    const month = Number(swiss[2]);
    const year = Number(swiss[3]);
    if (!isFiniteDateParts(year, month, day)) return null;
    return startOfLocalDay(new Date(year, month - 1, day));
  }

  return null;
}

function isFiniteDateParts(year: number, month: number, day: number) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

/** Start of today's calendar day in local time. */
export function getStartOfTodayLocal(now: Date = new Date()): Date {
  return startOfLocalDay(now);
}

/** Start of tomorrow's calendar day in local time. */
export function getStartOfTomorrowLocal(now: Date = new Date()): Date {
  const t = startOfLocalDay(now);
  t.setDate(t.getDate() + 1);
  return t;
}

export function isExecutionDateStrictlyBeforeToday(
  value: string,
  now: Date = new Date(),
): boolean {
  const parsed = parseExecutionDate(value);
  if (!parsed) return false;
  return parsed.getTime() < getStartOfTodayLocal(now).getTime();
}

export function isExecutionDateTodayOrLater(
  value: string,
  now: Date = new Date(),
): boolean {
  const parsed = parseExecutionDate(value);
  if (!parsed) return false;
  return parsed.getTime() >= getStartOfTodayLocal(now).getTime();
}

export function isExecutionDateAtLeastTomorrow(
  value: string,
  now: Date = new Date(),
): boolean {
  const parsed = parseExecutionDate(value);
  if (!parsed) return false;
  return parsed.getTime() >= getStartOfTomorrowLocal(now).getTime();
}

export function assertExecutionDateAtLeastTomorrow(
  value: string,
  now: Date = new Date(),
): void {
  if (!isExecutionDateAtLeastTomorrow(value, now)) {
    throw new Error("Execution date must be at least one day after today");
  }
}
