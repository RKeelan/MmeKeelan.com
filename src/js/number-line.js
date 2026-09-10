import '../css/styles.css';
import '../css/mathStyles.css';
import '../css/numberLineStyles.css';
import {
  LINE_END,
  OPERATIONS,
  generateProblems,
} from './number-line-problems.js';

/** @typedef {import('./number-line-problems.js').Operation} Operation */
/** @typedef {import('./number-line-problems.js').Problem} Problem */

/** @param {string} sel */
const $ = (sel) => document.querySelector(sel);

const elOperation = /** @type {HTMLSelectElement} */ ($('#operation'));
const elCount = /** @type {HTMLSelectElement} */ ($('#count'));
const elPages = /** @type {HTMLInputElement} */ ($('#pages'));
const elBtnGen = /** @type {HTMLButtonElement} */ ($('#btn-gen'));
const elBtnPrint = /** @type {HTMLButtonElement} */ ($('#btn-print'));
const elSheets = /** @type {HTMLElement} */ ($('#sheets'));
const elTemplate = /** @type {HTMLTemplateElement} */ ($('#sheet-template'));

/** French name of each operation, for the worksheet subtitle. */
const OPERATION_NAMES = {
  add: 'Addition',
  subtract: 'Soustraction',
};

/** Glyph written between the operands. */
const OPERATION_SIGNS = {
  add: '+',
  subtract: '−',
};

const SVG_NS = 'http://www.w3.org/2000/svg';

// The number line's geometry, in SVG user units. The axis sits halfway down
// the drawing so it lines up with the middle of the number sentence beside it,
// and the labels hang below it. Each end leaves room for half the widest label.
const TICK_SPACING = 40;
const END_MARGIN = 12;
const AXIS_Y = 30;
const TICK_REACH = 9;
const LABEL_BASELINE = 57;
const LINE_WIDTH = 2 * END_MARGIN + LINE_END * TICK_SPACING;
const LINE_HEIGHT = 2 * AXIS_Y;

/** Whether worksheets are currently on screen. */
let hasWorksheet = false;

/** @returns {Operation} */
function getOperation() {
  const value = elOperation.value;
  const operation = OPERATIONS.find((op) => op === value);
  return operation ?? 'add';
}

/** @returns {number} */
function getCount() {
  return Number.parseInt(elCount.value, 10) || 9;
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
 * A number line from zero to LINE_END with every whole number marked and
 * labelled. Every row's line is the same, so it is built once and cloned.
 * @returns {SVGSVGElement}
 */
function buildNumberLine() {
  const line = svg('svg', {
    class: 'nl-line',
    viewBox: '0 0 ' + LINE_WIDTH + ' ' + LINE_HEIGHT,
    preserveAspectRatio: 'xMinYMid meet',
    'aria-hidden': 'true',
  });

  line.appendChild(
    svg('line', {
      x1: END_MARGIN,
      y1: AXIS_Y,
      x2: LINE_WIDTH - END_MARGIN,
      y2: AXIS_Y,
    }),
  );

  for (let n = 0; n <= LINE_END; n++) {
    const x = END_MARGIN + n * TICK_SPACING;
    line.appendChild(
      svg('line', {
        x1: x,
        y1: AXIS_Y - TICK_REACH,
        x2: x,
        y2: AXIS_Y + TICK_REACH,
      }),
    );
    const label = svg('text', { x, y: LABEL_BASELINE });
    label.textContent = String(n);
    line.appendChild(label);
  }
  return line;
}

/**
 * One row of the worksheet: the number sentence with a box for the answer,
 * and a number line beside it to work it out on.
 * @param {Problem} problem
 * @param {SVGSVGElement} numberLine
 * @returns {HTMLElement}
 */
function renderProblem(problem, numberLine) {
  const row = document.createElement('div');
  row.className = 'nl-problem';

  const sentence = document.createElement('div');
  sentence.className = 'nl-sentence';
  sentence.textContent =
    problem.a +
    ' ' +
    OPERATION_SIGNS[problem.operation] +
    ' ' +
    problem.b +
    ' =';

  const answer = document.createElement('div');
  answer.className = 'nl-answer';
  sentence.appendChild(answer);

  row.appendChild(sentence);
  row.appendChild(numberLine.cloneNode(true));
  return row;
}

/**
 * One printable page, stamped from the sheet template.
 * @param {Operation} operation
 * @param {Problem[]} problems
 * @param {SVGSVGElement} numberLine
 * @returns {DocumentFragment}
 */
function renderSheet(operation, problems, numberLine) {
  const sheet = /** @type {DocumentFragment} */ (
    elTemplate.content.cloneNode(true)
  );
  const subtitle = /** @type {HTMLElement} */ (
    sheet.querySelector('.mw-sheet-subtitle')
  );
  const list = /** @type {HTMLElement} */ (sheet.querySelector('.nl-problems'));

  subtitle.textContent =
    OPERATION_NAMES[operation] + ' — utilise la droite numérique pour t’aider.';
  // The rows share the page equally, and the text is sized to fit a row.
  list.style.setProperty('--nl-rows', String(problems.length));
  for (const problem of problems) {
    list.appendChild(renderProblem(problem, numberLine));
  }
  return sheet;
}

function generate() {
  const operation = getOperation();
  const count = getCount();
  const pages = getPages();
  elPages.value = String(pages);

  const numberLine = buildNumberLine();
  elSheets.innerHTML = '';
  for (let page = 0; page < pages; page++) {
    const problems = generateProblems(operation, count);
    elSheets.appendChild(renderSheet(operation, problems, numberLine));
  }

  hasWorksheet = true;
  elBtnGen.textContent = 'Regenerate worksheets';
  elBtnPrint.disabled = false;
  elBtnPrint.title = '';
}

// Events
elBtnGen.addEventListener('click', generate);
elBtnPrint.addEventListener('click', () => window.print());

for (const control of [elOperation, elCount, elPages]) {
  control.addEventListener('change', () => {
    if (hasWorksheet) generate();
  });
}
