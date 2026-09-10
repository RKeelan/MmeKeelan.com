// Pure, DOM-free generation of problems for the number-line worksheet.

/**
 * @typedef {'add' | 'subtract'} Operation
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

/** The largest operand: problems use single digits only. */
const MAX_OPERAND = 9;

/** The number line runs from zero to this, far enough for the largest sum. */
export const LINE_END = 2 * MAX_OPERAND;

/**
 * Every problem with single-digit operands. Zero is never an operand, since a
 * jump of nothing teaches nothing. Nor is `n − n` a subtraction: there are nine
 * of them, a fifth of the pool, and every one lands on zero.
 * @param {Operation} operation
 * @returns {Problem[]}
 */
export function allProblems(operation) {
  if (!OPERATIONS.includes(operation)) {
    throw new RangeError('Unsupported operation: ' + operation);
  }

  /** @type {Problem[]} */
  const problems = [];
  for (let a = 1; a <= MAX_OPERAND; a++) {
    for (let b = 1; b <= MAX_OPERAND; b++) {
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
 * @param {number} count How many problems to produce.
 * @param {() => number} [rng] Random source in [0, 1); injectable for tests.
 * @returns {Problem[]}
 */
export function generateProblems(operation, count, rng = Math.random) {
  const pool = allProblems(operation);
  if (!Number.isInteger(count) || count < 0 || count > pool.length) {
    throw new RangeError(
      'count must be an integer from 0 to ' + pool.length + ', got ' + count,
    );
  }
  return shuffled(pool, rng).slice(0, count);
}
