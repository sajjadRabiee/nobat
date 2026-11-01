// Reading uses SheetJS (window.XLSX, handles .xlsx/.xls/.csv/.ods).
// Writing uses ExcelJS (window.ExcelJS) because it can style cells.

import { MONTHS, WEEKDAYS } from './calendar.js';
import { namesFromRows } from './scheduler.js';

export async function readNames(file) {
  const data = new Uint8Array(await file.arrayBuffer());
  const wb = window.XLSX.read(data, { type: 'array' });
  const active = wb.Workbook?.Views?.[0]?.activeTab ?? 0;
  const sheet = wb.Sheets[wb.SheetNames[active] ?? wb.SheetNames[0]];
  const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, blankrows: true });
  return namesFromRows(rows);
}

const COLORS = {
  ink: 'FF1C2430',
  header: 'FF0E6E78',
  holidayFill: 'FFFBD9DC',
  holidayInk: 'FFB3122E',
  offFill: 'FFF1F3F6',
  offInk: 'FF7A8594',
  line: 'FFD5DBE3',
  above: 'FFFFF1C2',
  below: 'FFEEF1F5',
};

const thin = { style: 'thin', color: { argb: COLORS.line } };
const BORDER = { top: thin, left: thin, bottom: thin, right: thin };
const FONT = 'Vazirmatn';

function styleHeader(row) {
  row.height = 22;
  row.eachCell((cell) => {
    cell.font = { name: FONT, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.header } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = BORDER;
  });
}

export async function buildWorkbook(names, plan, options) {
  const { year, perDay, onThursdays, onFridays, onHolidays } = options;
  const wb = new window.ExcelJS.Workbook();
  wb.creator = 'Nobat';

  // Sheet 1: the roster
  const ws = wb.addWorksheet(`نوبت‌ها ${year}`, {
    views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }],
  });
  const people = Array.from({ length: perDay }, (_, i) => `نفر ${i + 1}`);
  ws.columns = [
    { header: 'تاریخ شمسی', width: 18 },
    { header: 'روز هفته', width: 12 },
    { header: 'تاریخ میلادی', width: 13 },
    { header: 'مناسبت', width: 22 },
    ...people.map((header) => ({ header, width: 18 })),
  ];
  styleHeader(ws.getRow(1));

  for (const day of plan.days) {
    const cells = day.off ? people.map(() => day.offReason) : day.people;
    const row = ws.addRow([
      `${day.jd} ${MONTHS[day.jm - 1]} ${day.jy}`,
      WEEKDAYS[day.weekday],
      day.gregorian,
      day.holiday,
      ...cells,
    ]);
    const fill = day.holiday ? COLORS.holidayFill : day.off ? COLORS.offFill : null;
    const ink = day.holiday ? COLORS.holidayInk : day.off ? COLORS.offInk : COLORS.ink;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: FONT, color: { argb: ink } };
      cell.border = BORDER;
      cell.alignment = { vertical: 'middle' };
      if (fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
    });
  }

  // Sheet 2: statistics
  const stats = wb.addWorksheet('آمار', { views: [{ rightToLeft: true }] });
  stats.columns = [{ width: 26 }, { width: 16 }, { width: 18 }];
  const title = stats.addRow([`آمار نوبت‌های سال ${year}`]);
  title.font = { name: FONT, bold: true, size: 14 };
  stats.addRow([]);
  styleHeader(stats.addRow(['نام', 'تعداد نوبت', 'اختلاف با میانگین']));

  names.forEach((name, i) => {
    const diff = Math.round((plan.counts[i] - plan.expected) * 10) / 10;
    const row = stats.addRow([name, plan.counts[i], diff]);
    const notable = Math.abs(diff) > plan.expected * 0.1;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.font = { name: FONT };
      cell.border = BORDER;
      if (notable) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: diff > 0 ? COLORS.above : COLORS.below } };
      }
    });
  });

  const count = (fn) => plan.days.filter(fn).length;
  const yesNo = (on) => (on ? ' (با نوبت)' : ' (بدون نوبت)');
  stats.addRow([]);
  const summary = [
    'خلاصه',
    `تعداد افراد: ${names.length}`,
    `روزهای سال: ${plan.days.length}`,
    `پنج‌شنبه‌ها: ${count((d) => d.weekday === 5)}${yesNo(onThursdays)}`,
    `جمعه‌ها: ${count((d) => d.weekday === 6)}${yesNo(onFridays)}`,
    `تعطیلات رسمی: ${count((d) => d.holiday)}${yesNo(onHolidays)}`,
    `روزهای بدون نوبت: ${count((d) => d.off)}`,
    `روزهای نوبت‌دار: ${plan.workingDays}`,
    `نفر در هر روز: ${perDay}`,
    `میانگین نوبت هر نفر: ${Math.round(plan.expected * 10) / 10}`,
  ];
  summary.forEach((line, i) => {
    const row = stats.addRow([line]);
    row.font = { name: FONT, bold: i === 0 };
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
