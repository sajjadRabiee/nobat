# نوبت (Nobat)

نوبت‌بندی منصفانهٔ یک سال کامل شمسی، با تعطیلات رسمی، به‌صورت فایل اکسل.

**Live:** https://sajjadrabiee.github.io/nobat/

فهرست نام‌ها را (از فایل اکسل یا با نوشتن) بدهید، سال و تعداد نفر در هر روز را انتخاب کنید و نوبت‌های کل سال را ببینید و دانلود کنید. همه‌چیز در مرورگر انجام می‌شود و فایلی به جایی فرستاده نمی‌شود.

## Features

- Reads names from the first column of `.xlsx`, `.xls`, `.csv` or `.ods`, or from pasted text
- Builds a roster for any Solar Hijri year from 1400 to 1410, with 1 to 10 people per day
- Thursdays, Fridays and official holidays can each be turned on or off
- Balanced: everyone's share differs by at most one, and the person who waited longest goes next
- Year calendar preview: holidays in red, click any day to see who is on duty
- Excel export with a right-to-left layout, holidays highlighted in red and a statistics sheet

## Run locally

It is a static site with no build step:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Run the tests (Node 22 or newer):

```bash
node --test 'tests/*.test.mjs'
```

## Deploy

`.github/workflows/pages.yml` runs the tests and publishes the site to GitHub Pages on every push to `main`.

## Notes

- Calendar math follows the jalaali-js algorithm and is tested day by day against the browser's built-in Persian calendar for 1380–1480.
- Holidays follow Iran's official list: 10 solar days on fixed Jalali dates and 17 religious days computed from the browser's Umm al-Qura Hijri calendar (`Intl`). Iran starts lunar months by moon sighting, so a religious holiday can land one day off the official calendar.
- Libraries are vendored in `assets/vendor`: [SheetJS](https://sheetjs.com) 0.18.5 (Apache-2.0) for reading and [ExcelJS](https://github.com/exceljs/exceljs) 4.4.0 (MIT) for writing.

Rewritten from the PHP project *Excel Divider 2*.
