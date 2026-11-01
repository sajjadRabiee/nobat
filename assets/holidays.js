// Iran's official public holidays.
// Solar holidays sit on fixed Jalali dates. Religious holidays follow the lunar
// Hijri calendar; their dates come from the browser's Umm al-Qura calendar.
// Iran sets lunar months by moon sighting, so a date can differ by one day.

import { yearDays } from './calendar.js';

const SOLAR = [
  [1, 1, 'نوروز'],
  [1, 2, 'نوروز'],
  [1, 3, 'نوروز'],
  [1, 4, 'نوروز'],
  [1, 12, 'روز جمهوری اسلامی'],
  [1, 13, 'روز طبیعت'],
  [3, 14, 'رحلت امام خمینی'],
  [3, 15, 'قیام ۱۵ خرداد'],
  [11, 22, 'پیروزی انقلاب اسلامی'],
  [12, 29, 'ملی شدن صنعت نفت'],
];

// [hijri month, hijri day, name]
const LUNAR = [
  [1, 9, 'تاسوعا'],
  [1, 10, 'عاشورا'],
  [2, 20, 'اربعین'],
  [2, 28, 'رحلت پیامبر و شهادت امام حسن (ع)'],
  [3, 8, 'شهادت امام حسن عسکری (ع)'],
  [3, 17, 'میلاد پیامبر و امام جعفر صادق (ع)'],
  [6, 3, 'شهادت حضرت فاطمه (س)'],
  [7, 13, 'ولادت امام علی (ع)'],
  [7, 27, 'مبعث'],
  [8, 15, 'نیمه شعبان'],
  [9, 21, 'شهادت امام علی (ع)'],
  [10, 1, 'عید فطر'],
  [10, 2, 'عید فطر'],
  [10, 25, 'شهادت امام جعفر صادق (ع)'],
  [12, 10, 'عید قربان'],
  [12, 18, 'عید غدیر'],
];
const IMAM_REZA = 'شهادت امام رضا (ع)'; // last day of Safar (29th or 30th)

function hijriFormatter() {
  for (const calendar of ['islamic-umalqura', 'islamic-civil']) {
    const fmt = new Intl.DateTimeFormat(`en-u-ca-${calendar}`, {
      month: 'numeric', day: 'numeric', timeZone: 'UTC',
    });
    if (fmt.resolvedOptions().calendar === calendar) return fmt;
  }
  throw new Error('This browser has no Islamic calendar support.');
}

let formatter;
/** Hijri { month, day } for a YYYY-MM-DD Gregorian date. */
export function hijriDate(gregorian) {
  formatter ??= hijriFormatter();
  const parts = formatter.formatToParts(new Date(`${gregorian}T00:00:00Z`));
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return { month: get('month'), day: get('day') };
}

const nextDay = (gregorian) => new Date(Date.parse(`${gregorian}T00:00:00Z`) + 86400000)
  .toISOString().slice(0, 10);

/** Map of "jalaliMonth-jalaliDay" → holiday name for Jalali year jy. */
export function holidaysFor(jy) {
  const map = new Map();
  const add = (key, name) => map.set(key, map.has(key) ? `${map.get(key)}، ${name}` : name);

  for (const [m, d, name] of SOLAR) add(`${m}-${d}`, name);

  for (const day of yearDays(jy)) {
    const key = `${day.jm}-${day.jd}`;
    const h = hijriDate(day.gregorian);
    for (const [m, d, name] of LUNAR) if (h.month === m && h.day === d) add(key, name);
    if (h.month === 2 && h.day >= 29 && hijriDate(nextDay(day.gregorian)).month === 3) add(key, IMAM_REZA);
  }
  return map;
}
