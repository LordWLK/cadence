import type { Checkin } from '@/lib/supabase/types';

/**
 * Calculate the current streak of consecutive days with at least one check-in.
 * Returns { current, longest, todayDone }.
 */
export function calculateStreak(checkins: Checkin[]): {
  current: number;
  longest: number;
  todayDone: boolean;
} {
  if (checkins.length === 0) return { current: 0, longest: 0, todayDone: false };

  // Get unique dates sorted descending
  const uniqueDates = [...new Set(checkins.map((c) => c.date))].sort((a, b) => b.localeCompare(a));

  const today = new Date().toISOString().split('T')[0];
  const todayDone = uniqueDates[0] === today;

  // Calculate current streak (starting from today or yesterday)
  let current = 0;
  const startDate = new Date(todayDone ? today : uniqueDates[0] <= today ? uniqueDates[0] : today);

  // Start from today and go backwards
  const checkDate = new Date(today);
  const dateSet = new Set(uniqueDates);

  // If today is not done, check if yesterday starts the streak
  if (!todayDone) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];
    if (!dateSet.has(yesterdayISO)) {
      // No check-in today or yesterday — streak is 0
      return { current: 0, longest: calculateLongest(uniqueDates), todayDone: false };
    }
    checkDate.setDate(checkDate.getDate() - 1); // start from yesterday
  }

  // Count consecutive days backwards
  while (true) {
    const iso = checkDate.toISOString().split('T')[0];
    if (dateSet.has(iso)) {
      current++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { current, longest: Math.max(current, calculateLongest(uniqueDates)), todayDone };
}

function calculateLongest(sortedDatesDesc: string[]): number {
  if (sortedDatesDesc.length === 0) return 0;

  let longest = 1;
  let currentRun = 1;

  // Sort ascending for easier consecutive check
  const dates = [...sortedDatesDesc].sort();

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentRun++;
      longest = Math.max(longest, currentRun);
    } else if (diffDays > 1) {
      currentRun = 1;
    }
    // diffDays === 0 means same date, skip
  }

  return longest;
}
