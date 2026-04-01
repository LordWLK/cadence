import { startOfWeek, endOfWeek, addWeeks, format, isToday as isTodayFns, isFriday as isFridayFns, eachDayOfInterval, parseISO } from 'date-fns';
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
