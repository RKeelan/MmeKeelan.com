// Pure, DOM-free generation of problems for the number-line worksheet.

/**
 * @typedef {'add' | 'subtract'} Operation
 */

/**
 * How many digits a problem's first operand has. The second is always one.
 * @typedef {1 | 2} Digits
 */

/**
 * A single worksheet problem. `answer` is the result of applying `operation`
 * to `a` and `b`, in that order.
 * @typedef {object} Problem
 * @property {Operation} operation The direction of the jump.
 * @property {number} a Where the jump starts on the number line.
 * @property {number} b The length of the jump.
 * @property {number} answer Where the jump lands.
 */

/**
 * The operations a number-line worksheet can be built from.
 * @type {readonly Operation[]}
 */
export const OPERATIONS = Object.freeze(['add', 'subtract']);

/**
 * The digit counts the first operand can have.
 * @type {readonly Digits[]}
 */
export const DIGITS = Object.freeze([1, 2]);

/** The largest second operand: every jump is a single digit long. */
const MAX_JUMP = 9;

/**
 * The smallest and largest first operand, by digit count and operation.
 * Two-digit additions stop at 90 so that every sum stays below 100.
 * @type {Record<Digits, Record<Operation, [number, number]>>}
 */
const FIRST_OPERAND_RANGE = {
  1: { add: [1, 9], subtract: [1, 9] },
  2: { add: [10, 90], subtract: [10, 99] },
};

/** How far every number line runs, from its first mark to its last. */
export const LINE_SPAN = 20;

/** No number line runs past this, the end of the two-digit numbers. */
const LINE_MAX = 100;

/**
 * Every problem whose first operand has `digits` digits and whose second is a
 * single digit. Zero is never an operand, since a jump of nothing teaches
 * nothing. Nor is `n − n` a subtraction: among single digits there are nine of
 * them, a fifth of the pool, and every one lands on zero.
 * @param {Operation} operation
 * @param {Digits} digits
 * @returns {Problem[]}
 */
export function allProblems(operation, digits) {
  if (!OPERATIONS.includes(operation)) {
    throw new RangeError('Unsupported operation: ' + operation);
  }
  if (!DIGITS.includes(digits)) {
    throw new RangeError('Unsupported digit count: ' + digits);
  }

  const [lowest, highest] = FIRST_OPERAND_RANGE[digits][operation];
  /** @type {Problem[]} */
  const problems = [];
  for (let a = lowest; a <= highest; a++) {
    for (let b = 1; b <= MAX_JUMP; b++) {
      if (operation === 'add') {
        problems.push({ operation, a, b, answer: a + b });
      } else if (operation === 'subtract' && a > b) {
        problems.push({ operation, a, b, answer: a - b });
      }
    }
  }
  return problems;
}

/**
 * The first number on a problem's number line. Every line runs LINE_SPAN from
 * one multiple of ten to another, centred on the multiple of ten nearest the
 * middle of the jump, without going below zero or above LINE_MAX. A jump is
 * at most nine long, so its middle is within five of the line's centre and
 * both ends are within ten: the whole jump is always on the line.
 * @param {Problem} problem
 * @returns {number}
 */
export function lineStart({ a, answer }) {
  const centre = 10 * Math.round((a + answer) / 20);
  const start = centre - LINE_SPAN / 2;
  return Math.min(Math.max(start, 0), LINE_MAX - LINE_SPAN);
}

/**
 * A shuffled copy of `items` (Fisher–Yates).
 * @template T
 * @param {readonly T[]} items
 * @param {() => number} rng Random source returning a value in [0, 1).
 * @returns {T[]}
 */
function shuffled(items, rng) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Generate one page's worth of problems. They are drawn without replacement,
 * so no problem appears twice on the same page.
 * @param {Operation} operation Which operation to practise.
 * @param {Digits} digits How many digits the first operand has.
 * @param {number} count How many problems to produce.
 * @param {() => number} [rng] Random source in [0, 1); injectable for tests.
 * @returns {Problem[]}
 */
export function generateProblems(operation, digits, count, rng = Math.random) {
  const pool = allProblems(operation, digits);
  if (!Number.isInteger(count) || count < 0 || count > pool.length) {
    throw new RangeError(
      'count must be an integer from 0 to ' + pool.length + ', got ' + count,
    );
  }
  return shuffled(pool, rng).slice(0, count);
}
