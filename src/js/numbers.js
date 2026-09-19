import '../css/styles.css';
import '../css/mathStyles.css';
import '../css/numbersStyles.css';
import { LANGUAGES, MAX_NUMBER, numberToWords } from './number-words.js';
import {
  FORMS,
  expandedForm,
  generateProblems,
  maxProblems,
} from './numbers-problems.js';

/** @typedef {import('./number-words.js').Language} Language */
/** @typedef {import('./numbers-problems.js').Form} Form */
/** @typedef {import('./numbers-problems.js').NumberSet} NumberSet */
/** @typedef {import('./numbers-problems.js').Problem} Problem */
/** @typedef {'hundreds' | 'tens' | 'ones'} Place */

/** @param {string} sel */
const $ = (sel) => document.querySelector(sel);

const elLanguage = /** @type {HTMLSelectElement} */ ($('#language'));
const elCount = /** @type {HTMLSelectElement} */ ($('#count'));
const elMax = /** @type {HTMLSelectElement} */ ($('#max'));
const elPages = /** @type {HTMLInputElement} */ ($('#pages'));
const elGiven = /** @type {NodeListOf<HTMLInputElement>} */ (
  document.querySelectorAll('input[name="given"]')
);
const elTyTeen = /** @type {HTMLInputElement} */ ($('#ty-teen'));
const elSplit = /** @type {HTMLInputElement} */ ($('#split'));
const elSplitPlaces = /** @type {HTMLElement} */ ($('#split-places'));
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
    subtitle: 'Show each number four ways.',
    headings: {
      blocks: 'Blocks',
      numeral: 'Number',
      expanded: 'Expanded',
      words: 'Words',
    },
    places: { hundreds: '100s', tens: '10s', ones: '1s' },
  },
  fr: {
    name: 'Nom : ______________',
    date: 'Date : ______________',
    subtitle: 'Représente chaque nombre de quatre façons.',
    headings: {
      blocks: 'Blocs',
      numeral: 'Chiffres',
      expanded: 'Forme développée',
      words: 'Lettres',
    },
    places: { hundreds: 'Centaines', tens: 'Dizaines', ones: 'Unités' },
  },
};

/**
 * The places a split Number column can have a box for, largest first.
 * @type {readonly Place[]}
 */
const PLACES = Object.freeze(['hundreds', 'tens', 'ones']);

/**
 * The largest two-digit number: the range a worksheet shows unless a wider one
 * is chosen, and all a split Number column's two boxes can hold.
 */
const MAX_TWO_DIGIT = 99;

const SVG_NS = 'http://www.w3.org/2000/svg';

// Base-ten blocks, in SVG user units. A unit cube is a square, a ten rod is
// ten of them stacked, and a hundred flat is ten rods side by side. The flats
// stand first, then the rods, then the loose units in columns of five so they
// can be counted at a glance. Every drawing on a worksheet has the same size,
// wide enough for the widest number that worksheet can show, so the blocks on
// a page are all drawn to the same scale.
const UNIT = 10;
const ROD_LENGTH = 10 * UNIT;
const FLAT_SIZE = 10 * UNIT;
const ROD_GAP = 5;
const UNITS_PER_COLUMN = 5;
const UNIT_GAP = 5;
const GROUP_GAP = 14;
const STROKE = 1.5;

const BLOCKS_HEIGHT = STROKE + ROD_LENGTH;

/**
 * How wide the blocks for `n` are drawn, before the margin for the stroke.
 * @param {number} n
 * @returns {number}
 */
function blocksWidth(n) {
  const flats = Math.floor(n / 100);
  const rods = Math.floor(n / 10) % 10;
  const columns = Math.ceil((n % 10) / UNITS_PER_COLUMN);
  const groups = [
    flats * (FLAT_SIZE + ROD_GAP) - ROD_GAP,
    rods * (UNIT + ROD_GAP) - ROD_GAP,
    columns * (UNIT + UNIT_GAP) - UNIT_GAP,
  ].filter((width) => width > 0);
  const gaps = Math.max(groups.length - 1, 0) * GROUP_GAP;
  return groups.reduce((total, width) => total + width, gaps);
}

/**
 * How wide every drawing on a worksheet of numbers up to `max` is.
 * @param {number} max
 * @returns {number}
 */
function blocksWidthFor(max) {
  const widths = Array.from({ length: max + 1 }, (_, n) => blocksWidth(n));
  return STROKE + Math.max(...widths);
}

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

/** @returns {boolean} Whether to split the Number column by place value. */
function getSplit() {
  return elSplit.checked;
}

/** @returns {number} */
function getCount() {
  return Number.parseInt(elCount.value, 10) || 8;
}

/** @returns {number} The largest number a worksheet can show. */
function getMax() {
  const max = Number.parseInt(elMax.value, 10) || MAX_TWO_DIGIT;
  return Math.min(max, MAX_NUMBER);
}

/** @returns {number} The page count, clamped to the input's own range. */
function getPages() {
  const min = Number(elPages.min);
  const max = Number(elPages.max);
  const pages = Number.parseInt(elPages.value, 10) || min;
  return Math.min(Math.max(pages, min), max);
}

/**
 * The boxes a split Number column has, for numbers up to `max`.
 * @param {number} max
 * @returns {readonly Place[]}
 */
function placesFor(max) {
  return max > MAX_TWO_DIGIT ? PLACES : PLACES.slice(1);
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
 * `n` drawn as hundred flats, ten rods, and unit cubes, standing on a common
 * baseline in a drawing `width` user units wide.
 * @param {number} n
 * @param {number} width
 * @returns {SVGSVGElement}
 */
function buildBlocks(n, width) {
  const drawing = svg('svg', {
    class: 'nb-drawing',
    viewBox: '0 0 ' + width + ' ' + BLOCKS_HEIGHT,
    preserveAspectRatio: 'xMinYMid meet',
    'aria-hidden': 'true',
  });

  const top = STROKE / 2;
  const bottom = top + ROD_LENGTH;
  const left = STROKE / 2;
  let x = left;

  /** Leave a gap ahead of a group, so each place is counted on its own. */
  const startGroup = () => {
    if (x > left) x += GROUP_GAP;
  };

  const flats = Math.floor(n / 100);
  if (flats > 0) {
    startGroup();
    for (let flat = 0; flat < flats; flat++) {
      drawing.appendChild(
        svg('rect', { x, y: top, width: FLAT_SIZE, height: FLAT_SIZE }),
      );
      for (let line = 1; line < 10; line++) {
        const offset = line * UNIT;
        drawing.appendChild(
          svg('line', {
            x1: x,
            y1: top + offset,
            x2: x + FLAT_SIZE,
            y2: top + offset,
          }),
        );
        drawing.appendChild(
          svg('line', { x1: x + offset, y1: top, x2: x + offset, y2: bottom }),
        );
      }
      x += FLAT_SIZE + ROD_GAP;
    }
    x -= ROD_GAP;
  }

  const rods = Math.floor(n / 10) % 10;
  if (rods > 0) {
    startGroup();
    for (let rod = 0; rod < rods; rod++) {
      drawing.appendChild(
        svg('rect', { x, y: top, width: UNIT, height: ROD_LENGTH }),
      );
      for (let cube = 1; cube < 10; cube++) {
        const y = top + cube * UNIT;
        drawing.appendChild(svg('line', { x1: x, y1: y, x2: x + UNIT, y2: y }));
      }
      x += UNIT + ROD_GAP;
    }
    x -= ROD_GAP;
  }

  const ones = n % 10;
  if (ones > 0) {
    startGroup();
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
  }
  return drawing;
}

/**
 * The given form of a problem's number, to fill its cell.
 * @param {Problem} problem
 * @param {Language} language
 * @param {number} width How wide the sheet's block drawings are.
 * @returns {Node}
 */
function renderGiven({ number, given }, language, width) {
  if (given === 'blocks') return buildBlocks(number, width);
  if (given === 'numeral') return document.createTextNode(String(number));
  if (given === 'expanded')
    return document.createTextNode(expandedForm(number));
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
 * filled in. A split table gives the Number column a box for each place.
 * @param {Language} language
 * @param {Problem[]} problems
 * @param {boolean} split
 * @param {number} max The largest number the worksheet can show.
 * @returns {DocumentFragment}
 */
function renderSheet(language, problems, split, max) {
  const text = SHEET_TEXT[language];
  const places = placesFor(max);
  const width = blocksWidthFor(max);
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
  table.classList.toggle('nb-three-digit', max > MAX_TWO_DIGIT);
  // The rows share the page equally, and the text is sized to fit a row.
  table.style.setProperty('--nb-rows', String(problems.length));
  for (const form of FORMS) {
    const heading = document.createElement('div');
    heading.className = 'nb-heading nb-heading-' + form;
    heading.textContent = text.headings[form];
    table.appendChild(heading);
  }
  if (split) {
    for (const place of places) {
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
        // A number with fewer digits than there are boxes shows a 0 in the
        // boxes it leads with, because an empty box is one for the student to
        // fill in.
        const digits = {
          hundreds: Math.floor(problem.number / 100),
          tens: Math.floor(problem.number / 10) % 10,
          ones: problem.number % 10,
        };
        for (const place of places) {
          table.appendChild(
            makeCell(place, given ? String(digits[place]) : null),
          );
        }
      } else {
        table.appendChild(
          makeCell(form, given ? renderGiven(problem, language, width) : null),
        );
      }
    }
  }
  return sheet;
}

/**
 * Why a worksheet cannot be generated from the settings as they stand.
 * @returns {string} The reason, or the empty string if it can.
 */
function generateBlocker() {
  const forms = getForms();
  if (forms.length === 0) return 'Tick at least one form to give';
  const limit = maxProblems(forms, getNumberSet(), { max: getMax() });
  if (getCount() > limit) {
    return (
      'Too few numbers to choose from: ask for at most ' +
      limit +
      ' problems a page, or widen the numbers to draw from'
    );
  }
  return '';
}

/** Enable generation only when the settings can fill a page. */
function updateGenerateButton() {
  const reason = generateBlocker();
  elBtnGen.disabled = reason !== '';
  elBtnGen.title = reason;
}

/** Name the boxes the split option makes, in the editor's own English. */
function updateSplitLabel() {
  const names = placesFor(getMax()).map((place) => SHEET_TEXT.en.places[place]);
  elSplitPlaces.textContent =
    names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
}

function generate() {
  const language = getLanguage();
  const forms = getForms();
  const set = getNumberSet();
  const split = getSplit();
  const max = getMax();
  const count = getCount();
  const pages = getPages();
  elPages.value = String(pages);

  elSheets.innerHTML = '';
  for (let page = 0; page < pages; page++) {
    const problems = generateProblems(forms, set, count, { max });
    elSheets.appendChild(renderSheet(language, problems, split, max));
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
  elMax,
  elPages,
  ...elGiven,
  elTyTeen,
  elSplit,
]) {
  control.addEventListener('change', () => {
    updateSplitLabel();
    updateGenerateButton();
    if (hasWorksheet && !elBtnGen.disabled) generate();
  });
}

updateSplitLabel();
