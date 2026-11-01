import { yearDays } from './calendar.js';
import { holidaysFor } from './holidays.js';

/**
 * Builds the year plan.
 * options: { year, perDay, onThursdays, onFridays, onHolidays }
 * Returns { days, counts, workingDays, expected }, where each day has
 * { …calendarDay, holiday, off, offReason, people: string[] }.
 */
export function buildPlan(names, options, random = Math.random) {
  const { year, perDay, onThursdays, onFridays, onHolidays } = options;
  if (names.length < perDay) {
    throw new Error(`برای ${perDay} نفر در روز دست‌کم ${perDay} نام لازم است.`);
  }

  const holidays = holidaysFor(year);
  const days = yearDays(year).map((day) => {
    const holiday = holidays.get(`${day.jm}-${day.jd}`) || '';
    let offReason = '';
    if (day.weekday === 5 && !onThursdays) offReason = 'پنج‌شنبه (تعطیل)';
    else if (day.weekday === 6 && !onFridays) offReason = 'جمعه (تعطیل)';
    else if (holiday && !onHolidays) offReason = holiday;
    return { ...day, holiday, off: Boolean(offReason), offReason, people: [] };
  });

  const counts = new Array(names.length).fill(0);
  const lastDay = new Array(names.length).fill(-1);
  const indexes = names.map((_, i) => i);
  let workIndex = 0;

  for (const day of days) {
    if (day.off) continue;
    // Fewest shifts first, then whoever waited longest, then random.
    const tiebreak = indexes.map(() => random());
    const picked = [...indexes]
      .sort((a, b) => counts[a] - counts[b] || lastDay[a] - lastDay[b] || tiebreak[a] - tiebreak[b])
      .slice(0, perDay);
    for (const i of picked) {
      counts[i]++;
      lastDay[i] = workIndex;
    }
    day.people = picked.map((i) => names[i]);
    workIndex++;
  }

  return {
    days,
    counts,
    workingDays: workIndex,
    expected: (workIndex * perDay) / names.length,
  };
}

/** Pulls names from the first column of rows (array of arrays), skipping blanks. */
export function namesFromRows(rows) {
  return rows
    .map((row) => (row && row[0] != null ? String(row[0]).trim() : ''))
    .filter(Boolean);
}

/** Splits pasted text into names, one per line. */
export function namesFromText(text) {
  return text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}
