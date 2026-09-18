import '../css/styles.css';
import '../css/mathStyles.css';
import '../css/skipCountingStyles.css';
import { LANGUAGES } from './number-words.js';
import {
  ROW_LENGTH,
  chartRows,
  parseSkipCounts,
  skipCountsForPages,
} from './skip-counting-problems.js';
import { generateRainbowColors } from './utils.js';

/** @typedef {import('./number-words.js').Language} Language */

/** @param {string} sel */
const $ = (sel) => document.querySelector(sel);

const elLanguage = /** @type {HTMLSelectElement} */ ($('#language'));
const elSkip = /** @type {HTMLInputElement} */ ($('#skip'));
const elPages = /** @type {HTMLInputElement} */ ($('#pages'));
const elColour = /** @type {HTMLInputElement} */ ($('#colour-columns'));
const elBtnGen = /** @type {HTMLButtonElement} */ ($('#btn-gen'));
const elBtnPrint = /** @type {HTMLButtonElement} */ ($('#btn-print'));
const elSheets = /** @type {HTMLElement} */ ($('#sheets'));
const elTemplate = /** @type {HTMLTemplateElement} */ ($('#sheet-template'));

/**
 * The words printed on a worksheet, in each language.
 * @type {Record<Language, { name: string, date: string, label: string, subtitle: string }>}
 */
const SHEET_TEXT = {
  en: {
    name: 'Name: ______________',
    date: 'Date: ______________',
    label: 'Count by',
    subtitle: 'Circle every number you say as you count.',
  },
  fr: {
    name: 'Nom : ______________',
    date: 'Date : ______________',
    label: 'Compte par bonds de',
    subtitle: 'Encercle chaque nombre que tu dis en comptant.',
  },
};

/** The chart's numbers, the same on every page. */
const ROWS = chartRows();

/** One colour per column, in the site's rainbow. */
const COLUMN_COLOURS = generateRainbowColors(ROW_LENGTH);

/** Whether worksheets are currently on screen. */
let hasWorksheet = false;

/** @returns {Language} */
function getLanguage() {
  const value = elLanguage.value;
  const language = LANGUAGES.find((lang) => lang === value);
  return language ?? 'en';
}

/**
 * How many pages to print, held within the page input's own range. A list of
 * skip counts longer than the pages asked for takes a page each, since every
 * count in it was asked for too.
 * @param {number} counts How many skip counts were asked for.
 * @returns {number}
 */
function getPages(counts) {
  const min = Number(elPages.min);
  const max = Number(elPages.max);
  const pages = Number.parseInt(elPages.value, 10) || min;
  return Math.min(Math.max(pages, counts, min), max);
}

/**
 * One printable page, stamped from the sheet template: the number to count by
 * above a chart of every number from 1 to 100.
 * @param {Language} language
 * @param {number} step The number to count by.
 * @param {boolean} colour Whether each column gets its own colour.
 * @returns {DocumentFragment}
 */
function renderSheet(language, step, colour) {
  const text = SHEET_TEXT[language];
  const sheet = /** @type {DocumentFragment} */ (
    elTemplate.content.cloneNode(true)
  );
  const find = (/** @type {string} */ sel) =>
    /** @type {HTMLElement} */ (sheet.querySelector(sel));

  find('.mw-worksheet').lang = language;
  find('.sc-name').textContent = text.name;
  find('.sc-date').textContent = text.date;
  find('.sc-label').textContent = text.label;
  find('.sc-step').textContent = String(step);
  find('.mw-sheet-subtitle').textContent = text.subtitle;

  const chart = find('.sc-chart');
  // The rows share the chart equally, and the numerals are sized to fit a cell.
  chart.style.setProperty('--sc-rows', String(ROWS.length));
  chart.style.setProperty('--sc-cols', String(ROW_LENGTH));
  for (const row of ROWS) {
    for (const [column, number] of row.entries()) {
      const cell = document.createElement('div');
      cell.className = 'sc-cell';
      cell.textContent = String(number);
      if (colour) cell.style.background = COLUMN_COLOURS[column];
      chart.appendChild(cell);
    }
  }
  return sheet;
}

function generate() {
  const language = getLanguage();
  const counts = parseSkipCounts(elSkip.value);
  const colour = elColour.checked;
  const pages = getPages(counts.length);
  // Show what the worksheets were really made from: the pages the counts need,
  // and the counts themselves once they have been held within range.
  elPages.value = String(pages);
  if (counts.length > 0) elSkip.value = counts.join(', ');

  elSheets.innerHTML = '';
  for (const step of skipCountsForPages(counts, pages)) {
    elSheets.appendChild(renderSheet(language, step, colour));
  }

  hasWorksheet = true;
  elBtnGen.textContent = 'Regenerate worksheets';
  elBtnPrint.disabled = false;
  elBtnPrint.title = '';
}

// Events
elBtnGen.addEventListener('click', generate);
elBtnPrint.addEventListener('click', () => window.print());

for (const control of [elLanguage, elSkip, elPages, elColour]) {
  control.addEventListener('change', () => {
    if (hasWorksheet) generate();
  });
}
