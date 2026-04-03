import { startOfWeek, endOfWeek, addWeeks, addDays, subDays, format, isToday as isTodayFns, isFriday as isFridayFns, eachDayOfInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekEnd(date: Date = new Date()): Date {
  return endOfWeek(date, { weekStartsOn: 1 });
}

export function getNextWeekStart(date: Date = new Date()): Date {
  return addWeeks(getWeekStart(date), 1);
}

export function getWeekDays(weekStart: Date): Date[] {
  return eachDayOfInterval({ start: weekStart, end: addWeeks(weekStart, 0) }).length === 1
    ? eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) })
    : eachDayOfInterval({ start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) });
}

export function formatDate(date: Date | string, pattern: string = 'dd MMM'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern, { locale: fr });
}

export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getDayName(date: Date): string {
  return format(date, 'EEEE', { locale: fr });
}

export function getDayShort(date: Date): string {
  return format(date, 'EEE', { locale: fr });
}

export function isToday(date: Date): boolean {
  return isTodayFns(date);
}

export function isFriday(date: Date = new Date()): boolean {
  return isFridayFns(date);
}

export function getRollingDays(count: number = 14): Date[] {
  const today = new Date();
  return eachDayOfInterval({ start: today, end: addDays(today, count - 1) });
}

/** Returns { startISO, endISO } for a date range ending today, going back `days` days */
export function getDateRangeISO(days: number): { startISO: string; endISO: string } {
  const end = new Date();
  const start = subDays(end, days);
  return { startISO: format(start, 'yyyy-MM-dd'), endISO: format(end, 'yyyy-MM-dd') };
}

/** Returns 'morning' or 'evening' based on current hour (cutoff at 14h) */
export function getTimeOfDay(): 'morning' | 'evening' {
  return new Date().getHours() < 14 ? 'morning' : 'evening';
}

/** Groups checkins by date into a Record<dateString, Checkin[]> */
export function groupByDate<T extends { date: string }>(items: T[]): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const item of items) {
    if (!grouped[item.date]) grouped[item.date] = [];
    grouped[item.date].push(item);
  }
  return grouped;
}
