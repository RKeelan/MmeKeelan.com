import '../css/styles.css';
import '../css/mathStyles.css';
import '../css/numbersStyles.css';
import { LANGUAGES, MAX_NUMBER, numberToWords } from './number-words.js';
import { FORMS, generateProblems } from './numbers-problems.js';

/** @typedef {import('./number-words.js').Language} Language */
/** @typedef {import('./numbers-problems.js').Form} Form */
/** @typedef {import('./numbers-problems.js').NumberSet} NumberSet */
/** @typedef {import('./numbers-problems.js').Problem} Problem */
/** @typedef {'tens' | 'ones'} Place */

/** @param {string} sel */
const $ = (sel) => document.querySelector(sel);

const elLanguage = /** @type {HTMLSelectElement} */ ($('#language'));
const elCount = /** @type {HTMLSelectElement} */ ($('#count'));
const elPages = /** @type {HTMLInputElement} */ ($('#pages'));
const elGiven = /** @type {NodeListOf<HTMLInputElement>} */ (
  document.querySelectorAll('input[name="given"]')
);
const elTyTeen = /** @type {HTMLInputElement} */ ($('#ty-teen'));
const elSplit = /** @type {HTMLInputElement} */ ($('#split'));
const elBtnGen = /** @type {HTMLButtonElement} */ ($('#btn-gen'));
const elBtnPrint = /** @type {HTMLButtonElement} */ ($('#btn-print'));
const elSheets = /** @type {HTMLElement} */ ($('#sheets'));
const elTemplate = /** @type {HTMLTemplateElement} */ ($('#sheet-template'));

/**
 * The words printed on a worksheet, in each language.
 * @type {Record<Language, { name: string, date: string, subtitle: string, headings: Record<Form, string>, places: Record<Place, string> }>}
 */
const SHEET_TEXT = {
  en: {
    name: 'Name: ______________',
    date: 'Date: ______________',
    subtitle: 'Show each number three ways.',
    headings: { blocks: 'Blocks', numeral: 'Number', words: 'Words' },
    places: { tens: '10s', ones: '1s' },
  },
  fr: {
    name: 'Nom : ______________',
    date: 'Date : ______________',
    subtitle: 'Représente chaque nombre de trois façons.',
    headings: { blocks: 'Blocs', numeral: 'Chiffres', words: 'Lettres' },
    places: { tens: 'Dizaines', ones: 'Unités' },
  },
};

/**
 * The places a split Number column has a box for, from left to right.
 * @type {readonly Place[]}
 */
const PLACES = Object.freeze(['tens', 'ones']);

/** The largest number whose digits fit a split Number column's two boxes. */
const MAX_TWO_DIGIT = 99;

const SVG_NS = 'http://www.w3.org/2000/svg';

// Base-ten blocks, in SVG user units. A unit cube is a square, and a ten rod
// is ten of them stacked. The rods stand side by side with the loose units
// beside them, in columns of five so they can be counted at a glance. Every
// drawing has the same size, wide enough for the widest number, so the blocks
// on a page are all drawn to the same scale.
const UNIT = 10;
const ROD_LENGTH = 10 * UNIT;
const ROD_GAP = 11;
const UNITS_PER_COLUMN = 5;
const UNIT_GAP = 10;
const GROUP_GAP = 34;
const STROKE = 1.5;

/**
 * How wide the blocks for `n` are drawn, before the margin for the stroke.
 * @param {number} n
 * @returns {number}
 */
function blocksWidth(n) {
  const tens = Math.floor(n / 10);
  const columns = Math.ceil((n % 10) / UNITS_PER_COLUMN);
  const rods = tens > 0 ? tens * UNIT + (tens - 1) * ROD_GAP : 0;
  const units = columns > 0 ? columns * UNIT + (columns - 1) * UNIT_GAP : 0;
  return rods + (rods > 0 && units > 0 ? GROUP_GAP : 0) + units;
}

const BLOCKS_WIDTH =
  STROKE +
  Math.max(...Array.from({ length: MAX_NUMBER + 1 }, (_, n) => blocksWidth(n)));
const BLOCKS_HEIGHT = STROKE + ROD_LENGTH;

/** Whether worksheets are currently on screen. */
let hasWorksheet = false;

/** @returns {Language} */
function getLanguage() {
  const value = elLanguage.value;
  const language = LANGUAGES.find((lang) => lang === value);
  return language ?? 'en';
}

/** @returns {Form[]} The forms whose boxes are ticked, in table order. */
function getForms() {
  const ticked = new Set(
    [...elGiven].filter((box) => box.checked).map((box) => box.value),
  );
  return FORMS.filter((form) => ticked.has(form));
}

/** @returns {NumberSet} */
function getNumberSet() {
  return elTyTeen.checked ? 'tyTeen' : 'all';
}

/** @returns {boolean} Whether to split the Number column into tens and ones. */
function getSplit() {
  return elSplit.checked;
}

/** @returns {number} */
function getCount() {
  return Number.parseInt(elCount.value, 10) || 8;
}

/** @returns {number} The page count, clamped to the input's own range. */
function getPages() {
  const min = Number(elPages.min);
  const max = Number(elPages.max);
  const pages = Number.parseInt(elPages.value, 10) || min;
  return Math.min(Math.max(pages, min), max);
}

/**
 * @template {keyof SVGElementTagNameMap} K
 * @param {K} name
 * @param {Record<string, number | string>} attributes
 * @returns {SVGElementTagNameMap[K]}
 */
function svg(name, attributes) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [attribute, value] of Object.entries(attributes)) {
    element.setAttribute(attribute, String(value));
  }
  return element;
}

/**
 * `n` drawn as ten rods and unit cubes, standing on a common baseline.
 * @param {number} n
 * @returns {SVGSVGElement}
 */
function buildBlocks(n) {
  const drawing = svg('svg', {
    class: 'nb-drawing',
    viewBox: '0 0 ' + BLOCKS_WIDTH + ' ' + BLOCKS_HEIGHT,
    preserveAspectRatio: 'xMinYMid meet',
    'aria-hidden': 'true',
  });

  const top = STROKE / 2;
  const bottom = top + ROD_LENGTH;
  let x = STROKE / 2;

  const tens = Math.floor(n / 10);
  for (let rod = 0; rod < tens; rod++) {
    drawing.appendChild(
      svg('rect', { x, y: top, width: UNIT, height: ROD_LENGTH }),
    );
    for (let cube = 1; cube < 10; cube++) {
      const y = top + cube * UNIT;
      drawing.appendChild(svg('line', { x1: x, y1: y, x2: x + UNIT, y2: y }));
    }
    x += UNIT + ROD_GAP;
  }

  const ones = n % 10;
  if (tens > 0 && ones > 0) x += GROUP_GAP - ROD_GAP;
  for (let unit = 0; unit < ones; unit++) {
    const column = Math.floor(unit / UNITS_PER_COLUMN);
    const row = unit % UNITS_PER_COLUMN;
    drawing.appendChild(
      svg('rect', {
        x: x + column * (UNIT + UNIT_GAP),
        y: bottom - (row + 1) * UNIT - row * UNIT_GAP,
        width: UNIT,
        height: UNIT,
      }),
    );
  }
  return drawing;
}

/**
 * The given form of a problem's number, to fill its cell.
 * @param {Problem} problem
 * @param {Language} language
 * @returns {Node}
 */
function renderGiven({ number, given }, language) {
  if (given === 'blocks') return buildBlocks(number);
  if (given === 'numeral') return document.createTextNode(String(number));
  return document.createTextNode(numberToWords(number, language));
}

/**
 * A table cell, for a form or a place.
 * @param {Form | Place} kind
 * @param {Node | string | null} content What the cell shows, if it is given.
 * @returns {HTMLDivElement}
 */
function makeCell(kind, content) {
  const cell = document.createElement('div');
  cell.className = 'nb-cell nb-' + kind;
  if (content !== null) cell.append(content);
  return cell;
}

/**
 * One printable page, stamped from the sheet template: a table with a column
 * for each form and a row for each problem, in which only the given forms are
 * filled in. A split table gives the Number column a box for each digit.
 * @param {Language} language
 * @param {Problem[]} problems
 * @param {boolean} split
 * @returns {DocumentFragment}
 */
function renderSheet(language, problems, split) {
  const text = SHEET_TEXT[language];
  const sheet = /** @type {DocumentFragment} */ (
    elTemplate.content.cloneNode(true)
  );
  const find = (/** @type {string} */ sel) =>
    /** @type {HTMLElement} */ (sheet.querySelector(sel));

  find('.mw-worksheet').lang = language;
  find('.nb-name').textContent = text.name;
  find('.nb-date').textContent = text.date;
  find('.mw-sheet-subtitle').textContent = text.subtitle;

  const table = find('.nb-table');
  table.classList.toggle('nb-split', split);
  // The rows share the page equally, and the text is sized to fit a row.
  table.style.setProperty('--nb-rows', String(problems.length));
  for (const form of FORMS) {
    const heading = document.createElement('div');
    heading.className = 'nb-heading nb-heading-' + form;
    heading.textContent = text.headings[form];
    table.appendChild(heading);
  }
  if (split) {
    for (const place of PLACES) {
      const subheading = document.createElement('div');
      subheading.className = 'nb-subheading';
      subheading.textContent = text.places[place];
      table.appendChild(subheading);
    }
  }
  for (const problem of problems) {
    for (const form of FORMS) {
      const given = form === problem.given;
      if (split && form === 'numeral') {
        // A number under ten shows a 0 in its tens box, because an empty box
        // is one for the student to fill in.
        const digits = {
          tens: Math.floor(problem.number / 10),
          ones: problem.number % 10,
        };
        for (const place of PLACES) {
          table.appendChild(
            makeCell(place, given ? String(digits[place]) : null),
          );
        }
      } else {
        table.appendChild(
          makeCell(form, given ? renderGiven(problem, language) : null),
        );
      }
    }
  }
  return sheet;
}

/** Enable generation only when at least one form is ticked. */
function updateGenerateButton() {
  const canGenerate = getForms().length > 0;
  elBtnGen.disabled = !canGenerate;
  elBtnGen.title = canGenerate ? '' : 'Tick at least one form to give';
}

function generate() {
  const language = getLanguage();
  const forms = getForms();
  const set = getNumberSet();
  const split = getSplit();
  const max = split ? MAX_TWO_DIGIT : MAX_NUMBER;
  const count = getCount();
  const pages = getPages();
  elPages.value = String(pages);

  elSheets.innerHTML = '';
  for (let page = 0; page < pages; page++) {
    const problems = generateProblems(forms, set, count, { max });
    elSheets.appendChild(renderSheet(language, problems, split));
  }

  hasWorksheet = true;
  elBtnGen.textContent = 'Regenerate worksheets';
  elBtnPrint.disabled = false;
  elBtnPrint.title = '';
}

// Events
elBtnGen.addEventListener('click', generate);
elBtnPrint.addEventListener('click', () => window.print());

for (const control of [
  elLanguage,
  elCount,
  elPages,
  ...elGiven,
  elTyTeen,
  elSplit,
]) {
  control.addEventListener('change', () => {
    updateGenerateButton();
    if (hasWorksheet && !elBtnGen.disabled) generate();
  });
}
