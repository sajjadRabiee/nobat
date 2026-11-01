import test from 'node:test';
import assert from 'node:assert/strict';
import { yearDays, isLeapYear, currentJalaliYear } from '../assets/calendar.js';
import { buildPlan, namesFromRows, namesFromText } from '../assets/scheduler.js';

const fmt = new Intl.DateTimeFormat('en-u-ca-persian', {
  year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'UTC',
});

test('calendar matches Intl persian calendar for 1380–1480', () => {
  for (let y = 1380; y <= 1480; y++) {
    for (const d of yearDays(y)) {
      const expected = fmt.format(new Date(`${d.gregorian}T00:00:00Z`));
      assert.equal(`${d.jm}/${d.jd}/${d.jy} AP`, expected);
    }
  }
});

test('known anchors: 1 Farvardin 1405 is Saturday 2026-03-21; 1403 and 1408 are leap', () => {
  const first = yearDays(1405)[0];
  assert.equal(first.gregorian, '2026-03-21');
  assert.equal(first.weekday, 0);
  assert.ok(isLeapYear(1403));
  assert.ok(isLeapYear(1408));
  assert.ok(!isLeapYear(1405));
  assert.equal(yearDays(1408).length, 366);
});

test('current year is computed around Nowruz', () => {
  assert.equal(currentJalaliYear(new Date(2026, 2, 20)), 1404);
  assert.equal(currentJalaliYear(new Date(2026, 2, 21)), 1405);
});

const names = Array.from({ length: 13 }, (_, i) => `p${i}`);

for (const flags of [
  { onThursdays: false, onFridays: false, onHolidays: false },
  { onThursdays: true, onFridays: true, onHolidays: true },
  { onThursdays: true, onFridays: false, onHolidays: false },
]) {
  test(`plan is balanced and respects day rules ${JSON.stringify(flags)}`, () => {
    const plan = buildPlan(names, { year: 1405, perDay: 3, ...flags });
    assert.equal(plan.days.length, 365);
    assert.ok(Math.max(...plan.counts) - Math.min(...plan.counts) <= 1);
    assert.equal(plan.counts.reduce((a, b) => a + b, 0), plan.workingDays * 3);
    for (const day of plan.days) {
      if (day.off) {
        assert.equal(day.people.length, 0);
      } else {
        assert.equal(new Set(day.people).size, 3, 'no duplicate person on a day');
        if (!flags.onThursdays) assert.notEqual(day.weekday, 5);
        if (!flags.onFridays) assert.notEqual(day.weekday, 6);
        if (!flags.onHolidays) assert.equal(day.holiday, '');
      }
    }
  });
}

test('nobody works two days in a row when there are enough people', () => {
  const plan = buildPlan(names, { year: 1405, perDay: 3, onThursdays: true, onFridays: true, onHolidays: true });
  const work = plan.days.filter((d) => !d.off);
  for (let i = 1; i < work.length; i++) {
    for (const p of work[i].people) assert.ok(!work[i - 1].people.includes(p));
  }
});

test('too few names is rejected', () => {
  assert.throws(() => buildPlan(['a', 'b'], { year: 1405, perDay: 3 }));
});

test('name parsing skips blanks and trims', () => {
  assert.deepEqual(namesFromRows([[' a '], [], [null], ['b', 'x'], ['']]), ['a', 'b']);
  assert.deepEqual(namesFromText(' a \n\n b \r\n'), ['a', 'b']);
});

import { holidaysFor } from '../assets/holidays.js';

test('holidays: official solar days present, retired ones gone', () => {
  const h = holidaysFor(1405);
  for (const key of ['1-1', '1-4', '1-12', '1-13', '3-14', '3-15', '11-22', '12-29']) assert.ok(h.has(key), key);
  for (const key of ['6-30', '7-8']) assert.ok(!h.has(key) || !/بهشتی|دفاع/.test(h.get(key)), key);
});

test('holidays: lunar days follow the Hijri calendar', () => {
  const find = (jy, name) => [...holidaysFor(jy)].filter(([, v]) => v.includes(name)).map(([k]) => k);
  // Umm al-Qura: 1 Shawwal 1446 = 2025-03-30 = 10 Farvardin 1404,
  // and 1 Shawwal 1447 = 2026-03-20 = 29 Esfand 1404 (two Eids in one solar year).
  assert.deepEqual(find(1404, 'عید فطر').sort(), ['1-10', '1-11', '12-29']);
  // 10 Dhu al-Hijjah 1446 = 2025-06-06 = 16 Khordad 1404
  assert.deepEqual(find(1404, 'عید قربان'), ['3-16']);
  // 10 Muharram 1448 = 2026-06-25 = 4 Tir 1405
  assert.deepEqual(find(1405, 'عاشورا'), ['4-4']);
});

test('holidays: every year has all 27 official holidays (some years twice for a lunar one)', () => {
  for (let y = 1400; y <= 1410; y++) {
    const names = [...holidaysFor(y).values()].join('، ').split('، ');
    assert.ok(names.length >= 27 && names.length <= 29, `${y}: ${names.length}`);
    assert.ok(names.includes('شهادت امام رضا (ع)'), `${y} Imam Reza`);
  }
});
