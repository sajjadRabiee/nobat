import { MONTHS, WEEKDAYS, currentJalaliYear, faNum } from './calendar.js';
import { buildPlan, namesFromText } from './scheduler.js';
import { readNames, buildWorkbook } from './excel.js';

const $ = (id) => document.getElementById(id);
const form = $('planForm');
const fileInput = $('file');
const drop = $('drop');
const dropTitle = $('dropTitle');
const namesBox = $('names');
const nameCount = $('nameCount');
const yearSelect = $('year');
const perDayInput = $('perDay');
const errorBox = $('error');
const result = $('result');
const DEFAULT_DROP_TEXT = dropTitle.textContent;

let lastPlan = null;

// Years 1400–1410, defaulting to the current one.
const thisYear = currentJalaliYear();
for (let y = 1400; y <= 1410; y++) {
  yearSelect.add(new Option(faNum(y), y, false, y === thisYear));
}

function currentNames() {
  return namesFromText(namesBox.value);
}

function updateCount() {
  const n = currentNames().length;
  nameCount.textContent = n ? `${faNum(n)} نام` : '';
}
namesBox.addEventListener('input', updateCount);

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = !message;
}

async function loadFile(file) {
  if (!file) return;
  showError('');
  try {
    const names = await readNames(file);
    if (!names.length) {
      showError('در ستون اول این فایل نامی پیدا نشد. هر نام را در یک ردیف از ستون A بنویسید.');
      return;
    }
    namesBox.value = names.join('\n');
    dropTitle.textContent = `${faNum(names.length)} نام از ${file.name} خوانده شد`;
    drop.classList.add('has-file');
    updateCount();
  } catch (err) {
    showError('این فایل خوانده نشد. یک فایل xlsx یا xls یا csv انتخاب کنید.');
    dropTitle.textContent = DEFAULT_DROP_TEXT;
    drop.classList.remove('has-file');
  }
}

fileInput.addEventListener('change', () => loadFile(fileInput.files[0]));
['dragenter', 'dragover'].forEach((type) =>
  drop.addEventListener(type, (e) => { e.preventDefault(); drop.classList.add('is-over'); }));
['dragleave', 'drop'].forEach((type) =>
  drop.addEventListener(type, (e) => { e.preventDefault(); drop.classList.remove('is-over'); }));
drop.addEventListener('drop', (e) => loadFile(e.dataTransfer.files[0]));

document.querySelectorAll('[data-step]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const next = Number(perDayInput.value || 0) + Number(btn.dataset.step);
    perDayInput.value = Math.min(10, Math.max(1, next));
  });
});

function readOptions() {
  return {
    year: Number(yearSelect.value),
    perDay: Number(perDayInput.value),
    onThursdays: $('onThursdays').checked,
    onFridays: $('onFridays').checked,
    onHolidays: $('onHolidays').checked,
  };
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('');
  const names = currentNames();
  const options = readOptions();

  if (!names.length) return showError('اول فایل نام‌ها را انتخاب کنید یا نام‌ها را در کادر بنویسید.');
  if (!Number.isInteger(options.perDay) || options.perDay < 1 || options.perDay > 10) {
    return showError('تعداد نفر در هر روز باید عددی بین ۱ تا ۱۰ باشد.');
  }
  if (names.length < options.perDay) {
    return showError(`برای ${faNum(options.perDay)} نفر در روز دست‌کم ${faNum(options.perDay)} نام لازم است؛ الان ${faNum(names.length)} نام دارید.`);
  }

  const plan = buildPlan(names, options);
  if (!plan.workingDays) return showError('با این تنظیمات هیچ روزی برای نوبت باقی نمی‌ماند.');

  lastPlan = { names, plan, options };
  renderResult(names, plan, options);
});

$('download').addEventListener('click', async () => {
  if (!lastPlan) return;
  const btn = $('download');
  btn.disabled = true;
  btn.textContent = 'در حال ساخت فایل…';
  try {
    const { names, plan, options } = lastPlan;
    const blob = await buildWorkbook(names, plan, options);
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `nobat-${options.year}.xlsx` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } finally {
    btn.disabled = false;
    btn.textContent = 'دانلود فایل اکسل';
  }
});

function renderResult(names, plan, options) {
  const min = Math.min(...plan.counts);
  const max = Math.max(...plan.counts);
  const share = min === max ? `${faNum(min)} نوبت` : `${faNum(min)} تا ${faNum(max)} نوبت`;

  $('resultTitle').textContent = `نوبت‌های سال ${faNum(options.year)} آماده است`;
  $('resultSummary').textContent =
    `${faNum(plan.workingDays)} روز نوبت‌دار از ${faNum(plan.days.length)} روز سال، ` +
    `هر روز ${faNum(options.perDay)} نفر. به هر نفر ${share} رسید.`;

  renderCalendar(plan.days);
  renderShares(names, plan.counts, max);

  result.hidden = false;
  result.focus({ preventScroll: true });
  result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function describeDay(day) {
  const date = `${faNum(day.jd)} ${MONTHS[day.jm - 1]}، ${WEEKDAYS[day.weekday]}`;
  const tag = day.holiday ? ` (${day.holiday})` : '';
  if (day.off) return `${date}${tag}: بدون نوبت`;
  return `${date}${tag}: ${day.people.join('، ')}`;
}

function renderCalendar(days) {
  const root = $('calendar');
  root.replaceChildren();
  const detail = $('dayDetail');

  for (let m = 1; m <= 12; m++) {
    const monthDays = days.filter((d) => d.jm === m);
    const month = document.createElement('div');
    month.className = 'month';
    const title = document.createElement('h4');
    title.textContent = MONTHS[m - 1];
    const grid = document.createElement('div');
    grid.className = 'grid';
    grid.setAttribute('role', 'group');
    grid.setAttribute('aria-label', MONTHS[m - 1]);

    for (const w of ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']) {
      const head = document.createElement('span');
      head.className = 'wd';
      head.setAttribute('aria-hidden', 'true');
      head.textContent = w;
      grid.append(head);
    }
    for (let i = 0; i < monthDays[0].weekday; i++) grid.append(document.createElement('span'));

    for (const day of monthDays) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'day' + (day.holiday ? ' is-holiday' : '') + (day.off ? ' is-off' : '');
      cell.textContent = faNum(day.jd);
      cell.title = describeDay(day);
      cell.setAttribute('aria-label', describeDay(day));
      cell.addEventListener('click', () => {
        root.querySelector('.day.is-picked')?.classList.remove('is-picked');
        cell.classList.add('is-picked');
        detail.textContent = describeDay(day);
      });
      grid.append(cell);
    }
    month.append(title, grid);
    root.append(month);
  }
}

function renderShares(names, counts, max) {
  const body = $('shares');
  body.replaceChildren();
  names.forEach((name, i) => {
    const tr = document.createElement('tr');
    const pct = max ? (counts[i] / max) * 100 : 0;
    tr.innerHTML = '<th scope="row"></th><td class="num"></td><td><span class="bar"><span></span></span></td>';
    tr.children[0].textContent = name;
    tr.children[1].textContent = faNum(counts[i]);
    tr.querySelector('.bar span').style.inlineSize = `${pct}%`;
    body.append(tr);
  });
}

updateCount();
