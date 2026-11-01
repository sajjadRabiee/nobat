// Official holidays, ported from Excel Divider 2.
// Lunar (Islamic) holidays move every year; dates below are approximate and
// only 1403–1405 have year-specific values. Other years use a generic fallback.

const FIXED = [
  [1, 1, 'نوروز'],
  [1, 2, 'عید نوروز'],
  [1, 3, 'عید نوروز'],
  [1, 4, 'عید نوروز'],
  [1, 12, 'روز جمهوری اسلامی'],
  [1, 13, 'سیزده بدر'],
  [3, 14, 'رحلت امام خمینی'],
  [3, 15, 'قیام 15 خرداد'],
  [4, 17, 'شهادت علی (ع)'],
  [6, 30, 'شهادت دکتر بهشتی'],
  [7, 8, 'روز دفاع مقدس'],
  [9, 27, 'شهادت فاطمه زهرا (س)'],
  [11, 22, 'پیروزی انقلاب'],
  [12, 29, 'ملی شدن نفت'],
];

const ISLAMIC_NAMES = ['عید فطر', 'عید فطر', 'عید قربان', 'عید غدیر', 'تاسوعا', 'عاشورا', 'اربعین'];

const ISLAMIC_DATES = {
  1403: [[4, 28], [4, 29], [7, 6], [7, 27], [8, 15], [8, 16], [8, 26]],
  1404: [[4, 17], [4, 18], [6, 24], [7, 15], [8, 4], [8, 5], [8, 15]],
  1405: [[4, 6], [4, 7], [6, 13], [7, 4], [7, 23], [7, 24], [9, 3]],
  default: [[4, 20], [4, 21], [6, 27], [7, 18], [8, 7], [8, 8], [8, 18]],
};

/** Map of "month-day" → holiday name for Jalali year jy. Fixed holidays win on clashes. */
export function holidaysFor(jy) {
  const map = new Map();
  const islamic = ISLAMIC_DATES[jy] || ISLAMIC_DATES.default;
  islamic.forEach(([m, d], i) => map.set(`${m}-${d}`, ISLAMIC_NAMES[i]));
  FIXED.forEach(([m, d, name]) => map.set(`${m}-${d}`, name));
  return map;
}

export function hasExactLunarDates(jy) {
  return Boolean(ISLAMIC_DATES[jy]);
}
