// Solar Hijri (Jalali) calendar helpers.
// Year-start math follows the jalaali-js algorithm (Borkowski's 2820-year breaks).

const BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635,
  2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

const div = (a, b) => ~~(a / b);
const mod = (a, b) => a - ~~(a / b) * b;

export const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

// Index 0 = Saturday, the first day of the Persian week.
export const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];

/** Returns { leap, gy, march } for Jalali year jy (march = day in March of Farvardin 1). */
function jalCal(jy) {
  const gy = jy + 621;
  let leapJ = -14;
  let jp = BREAKS[0];
  let jump = 0;
  for (let i = 1; i < BREAKS.length; i++) {
    const jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

export function isLeapYear(jy) {
  return jalCal(jy).leap === 0;
}

export function monthLength(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapYear(jy) ? 30 : 29;
}

/** Every day of Jalali year jy, in order. Dates are UTC so no DST shifts. */
export function yearDays(jy) {
  const { gy, march } = jalCal(jy);
  const start = Date.UTC(gy, 2, march);
  const days = [];
  let offset = 0;
  for (let jm = 1; jm <= 12; jm++) {
    const len = monthLength(jy, jm);
    for (let jd = 1; jd <= len; jd++) {
      const date = new Date(start + offset * 86400000);
      days.push({
        jy, jm, jd,
        weekday: (date.getUTCDay() + 1) % 7, // 0 = Saturday … 6 = Friday
        gregorian: date.toISOString().slice(0, 10),
      });
      offset++;
    }
  }
  return days;
}

/** Jalali year that contains the given JS Date (defaults to today). */
export function currentJalaliYear(now = new Date()) {
  const gy = now.getFullYear();
  const jy = gy - 621;
  const { march } = jalCal(jy);
  const nowUtc = Date.UTC(gy, now.getMonth(), now.getDate());
  return nowUtc >= Date.UTC(gy, 2, march) ? jy : jy - 1;
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
export function faNum(value) {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[d]);
}
