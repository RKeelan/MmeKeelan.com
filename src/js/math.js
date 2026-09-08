import '../css/styles.css';
import '../css/mathStyles.css';
import { OPERATIONS, generateProblems } from './math-problems.js';

/** @typedef {import('./math-problems.js').Operation} Operation */
/** @typedef {import('./math-problems.js').Problem} Problem */

/** @param {string} sel */
const $ = (sel) => document.querySelector(sel);

const elDigits = /** @type {HTMLSelectElement} */ ($('#digits'));
const elOperation = /** @type {HTMLSelectElement} */ ($('#operation'));
const elCount = /** @type {HTMLSelectElement} */ ($('#count'));
const elBtnGen = /** @type {HTMLButtonElement} */ ($('#btn-gen'));
const elBtnPrint = /** @type {HTMLButtonElement} */ ($('#btn-print'));
const elWorksheet = /** @type {HTMLElement} */ ($('#worksheet'));
const elSubtitle = /** @type {HTMLElement} */ ($('#sheet-subtitle'));
const elProblems = /** @type {HTMLElement} */ ($('#problems'));

/** French name of each operation, for the worksheet subtitle. */
const OPERATION_NAMES = {
  add: 'Addition',
  subtract: 'Soustraction',
  multiply: 'Multiplication',
  divide: 'Division',
};

/** Glyph written to the left of the second operand. */
const OPERATION_SIGNS = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
};

/** Whether a worksheet is currently on screen. */
let hasWorksheet = false;

/** @returns {Operation} */
function getOperation() {
  const value = elOperation.value;
  const operation = OPERATIONS.find((op) => op === value);
  return operation ?? 'add';
}

/** @returns {number} */
function getDigits() {
  return Number.parseInt(elDigits.value, 10) || 2;
}

/**
 * The grid the chosen option fills, parsed from a value like `4x3`.
 * @typedef {object} Layout
 * @property {number} cols
 * @property {number} rows
 */

/** @returns {Layout} */
function getLayout() {
  const match = /^(\d+)x(\d+)$/.exec(elCount.value);
  if (!match) return { cols: 4, rows: 3 };
  return { cols: Number(match[1]), rows: Number(match[2]) };
}

/**
 * The width of the widest problem in monospace characters, plus four columns
 * for the problem number, the operator, the gutter beside it, and the cell's
 * own padding.
 * @param {Problem[]} problems
 * @returns {number}
 */
function charBudget(problems) {
  let widest = 1;
  for (const problem of problems) {
    const a = String(problem.a).length;
    const b = String(problem.b).length;
    // Division sets its operands side by side; the others stack them.
    const width = problem.operation === 'divide' ? a + b : Math.max(a, b);
    widest = Math.max(widest, width);
  }
  return widest + 4;
}

/**
 * How many line-heights tall a problem cell has to be. Long division and a
 * two-digit multiplier need room for the intermediate working, not just for
 * the answer.
 * @param {Problem[]} problems
 * @returns {number}
 */
function lineBudget(problems) {
  const needsWorking = problems.some(
    (problem) =>
      problem.operation === 'divide' ||
      (problem.operation === 'multiply' && problem.b >= 10),
  );
  return needsWorking ? 6 : 4.5;
}

/**
 * The French description of the worksheet, e.g. "Addition — nombres à 2 chiffres".
 * @param {Operation} operation
 * @param {number} digits
 * @returns {string}
 */
function describe(operation, digits) {
  const noun = digits === 1 ? 'chiffre' : 'chiffres';
  return OPERATION_NAMES[operation] + ' — nombres à ' + digits + ' ' + noun;
}

/**
 * Build the vertically stacked form used for addition, subtraction and
 * multiplication.
 * @param {Problem} problem
 * @returns {HTMLElement}
 */
function renderStacked(problem) {
  const stack = document.createElement('div');
  stack.className = 'mw-stack';

  const first = document.createElement('div');
  first.className = 'mw-operand';
  first.textContent = String(problem.a);

  const second = document.createElement('div');
  second.className = 'mw-operand mw-last';
  const sign = document.createElement('span');
  sign.className = 'mw-op';
  sign.textContent = OPERATION_SIGNS[problem.operation];
  second.appendChild(sign);
  second.appendChild(document.createTextNode(String(problem.b)));

  stack.appendChild(first);
  stack.appendChild(second);
  return stack;
}

/**
 * Build the long division form: the divisor beside the dividend, which sits
 * under an overbar with a bracket on its left.
 * @param {Problem} problem
 * @returns {HTMLElement}
 */
function renderDivision(problem) {
  const stack = document.createElement('div');
  stack.className = 'mw-stack mw-division';

  const divisor = document.createElement('span');
  divisor.className = 'mw-divisor';
  divisor.textContent = String(problem.b);

  const dividend = document.createElement('span');
  dividend.className = 'mw-dividend';
  dividend.textContent = String(problem.a);

  stack.appendChild(divisor);
  stack.appendChild(dividend);
  return stack;
}

/**
 * @param {Problem} problem
 * @param {number} index Zero-based position, shown to the student as 1-based.
 * @returns {HTMLElement}
 */
function renderProblem(problem, index) {
  const cell = document.createElement('div');
  cell.className = 'mw-problem';

  const num = document.createElement('span');
  num.className = 'mw-num';
  num.textContent = index + 1 + '.';
  cell.appendChild(num);

  cell.appendChild(
    problem.operation === 'divide'
      ? renderDivision(problem)
      : renderStacked(problem),
  );
  return cell;
}

function generate() {
  const operation = getOperation();
  const digits = getDigits();
  const { cols, rows } = getLayout();
  const problems = generateProblems(operation, digits, cols * rows);

  elSubtitle.textContent = describe(operation, digits);
  // The grid fills the page, and the problems are sized to fill the grid.
  elProblems.style.setProperty('--mw-cols', String(cols));
  elProblems.style.setProperty('--mw-rows', String(rows));
  elProblems.style.setProperty('--mw-chars', String(charBudget(problems)));
  elProblems.style.setProperty('--mw-lines', String(lineBudget(problems)));
  elProblems.innerHTML = '';
  for (let i = 0; i < problems.length; i++) {
    elProblems.appendChild(renderProblem(problems[i], i));
  }

  elWorksheet.style.display = '';
  hasWorksheet = true;
  elBtnGen.textContent = 'Regenerate worksheet';
  elBtnPrint.disabled = false;
  elBtnPrint.title = '';
}

// Events
elBtnGen.addEventListener('click', generate);
elBtnPrint.addEventListener('click', () => window.print());

for (const select of [elDigits, elOperation, elCount]) {
  select.addEventListener('change', () => {
    if (hasWorksheet) generate();
  });
}
