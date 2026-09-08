// Pure, DOM-free generation of arithmetic problems for the math worksheet.

/**
 * @typedef {'add' | 'subtract' | 'multiply' | 'divide'} Operation
 */

/**
 * A single worksheet problem. `answer` is the result of applying `operation`
 * to `a` and `b`, in that order.
 * @typedef {object} Problem
 * @property {Operation} operation The operation the student performs.
 * @property {number} a The first (upper) operand; the dividend for division.
 * @property {number} b The second (lower) operand; the divisor for division.
 * @property {number} answer The correct result.
 */

/**
 * The operations a worksheet can be built from.
 * @type {readonly Operation[]}
 */
export const OPERATIONS = Object.freeze([
  'add',
  'subtract',
  'multiply',
  'divide',
]);

/** How many times a problem identical to the previous one is re-rolled. */
const DUPLICATE_ATTEMPTS = 5;

/** How many divisors are tried before falling back to a deterministic one. */
const DIVISOR_ATTEMPTS = 20;

/**
 * The smallest integer with exactly `digits` digits (1 for one digit, so zero
 * is never produced).
 * @param {number} digits
 * @returns {number}
 */
function lowestWithDigits(digits) {
  return 10 ** (digits - 1);
}

/**
 * The largest integer with exactly `digits` digits.
 * @param {number} digits
 * @returns {number}
 */
function highestWithDigits(digits) {
  return 10 ** digits - 1;
}

/**
 * Uniform integer in the inclusive range [min, max].
 * @param {number} min
 * @param {number} max
 * @param {() => number} rng Random source returning a value in [0, 1).
 * @returns {number}
 */
function randomInt(min, max, rng) {
  const span = max - min + 1;
  return min + Math.min(span - 1, Math.floor(rng() * span));
}

/**
 * Uniform integer with exactly `digits` digits. One digit means 1-9: a leading
 * zero operand would make the problem meaningless.
 * @param {number} digits
 * @param {() => number} [rng] Random source returning a value in [0, 1).
 * @returns {number}
 */
export function randomWithDigits(digits, rng = Math.random) {
  assertDigits(digits);
  return randomInt(lowestWithDigits(digits), highestWithDigits(digits), rng);
}

/**
 * @param {number} digits
 * @returns {void}
 */
function assertDigits(digits) {
  if (!Number.isInteger(digits) || digits < 1) {
    throw new RangeError('digits must be a positive integer, got ' + digits);
  }
}

/**
 * The inclusive divisor range for a given complexity. Small worksheets use a
 * single-digit divisor; larger ones allow two digits. One is never a divisor
 * because dividing by it teaches nothing.
 * @param {number} digits
 * @returns {{ min: number, max: number }}
 */
function divisorRange(digits) {
  return digits <= 2 ? { min: 2, max: 9 } : { min: 2, max: 99 };
}

/**
 * The inclusive quotient range that keeps the dividend at exactly `digits`
 * digits for the given divisor. A quotient of one is excluded so the problem is
 * never `n ÷ n`. The range is empty when `min` exceeds `max`.
 * @param {number} digits
 * @param {number} divisor
 * @returns {{ min: number, max: number }}
 */
function quotientRange(digits, divisor) {
  return {
    min: Math.max(2, Math.ceil(lowestWithDigits(digits) / divisor)),
    max: Math.floor(highestWithDigits(digits) / divisor),
  };
}

/**
 * A division problem that always divides evenly, built by choosing a divisor
 * and a quotient rather than a dividend. Divisors whose quotient range is empty
 * are re-rolled a bounded number of times, then the lowest workable divisor is
 * used so generation cannot hang.
 * @param {number} digits
 * @param {() => number} rng
 * @returns {Problem}
 */
function makeDivision(digits, rng) {
  const divisors = divisorRange(digits);

  for (let attempt = 0; attempt < DIVISOR_ATTEMPTS; attempt++) {
    const b = randomInt(divisors.min, divisors.max, rng);
    const quotients = quotientRange(digits, b);
    if (quotients.min > quotients.max) continue;
    const answer = randomInt(quotients.min, quotients.max, rng);
    return { operation: 'divide', a: b * answer, b, answer };
  }

  for (let b = divisors.min; b <= divisors.max; b++) {
    const quotients = quotientRange(digits, b);
    if (quotients.min <= quotients.max) {
      return {
        operation: 'divide',
        a: b * quotients.min,
        b,
        answer: quotients.min,
      };
    }
  }

  throw new RangeError('No division problem exists for ' + digits + ' digits');
}

/**
 * A single problem of the requested kind.
 * @param {Operation} operation
 * @param {number} digits
 * @param {() => number} rng
 * @returns {Problem}
 */
function makeProblem(operation, digits, rng) {
  if (operation === 'divide') {
    return makeDivision(digits, rng);
  }

  if (operation === 'multiply') {
    // Three- and four-digit multiplicands are paired with a two-digit
    // multiplier: the full four-by-four form is impractical on paper.
    const a = randomWithDigits(digits, rng);
    const b = randomWithDigits(digits <= 2 ? digits : 2, rng);
    return { operation: 'multiply', a, b, answer: a * b };
  }

  const first = randomWithDigits(digits, rng);
  const second = randomWithDigits(digits, rng);

  if (operation === 'subtract') {
    // Order the operands so the answer is never negative.
    const a = Math.max(first, second);
    const b = Math.min(first, second);
    return { operation: 'subtract', a, b, answer: a - b };
  }

  return { operation: 'add', a: first, b: second, answer: first + second };
}

/**
 * Whether two problems pose the same question.
 * @param {Problem} problem
 * @param {Problem | undefined} previous
 * @returns {boolean}
 */
function isRepeat(problem, previous) {
  return (
    previous !== undefined &&
    problem.a === previous.a &&
    problem.b === previous.b
  );
}

/**
 * Generate a worksheet's worth of problems.
 * @param {Operation} operation Which arithmetic operation to practise.
 * @param {number} digits Digits in the first operand (the dividend for division).
 * @param {number} count How many problems to produce.
 * @param {() => number} [rng] Random source in [0, 1); injectable for tests.
 * @returns {Problem[]}
 */
export function generateProblems(operation, digits, count, rng = Math.random) {
  if (!OPERATIONS.includes(operation)) {
    throw new RangeError('Unsupported operation: ' + operation);
  }
  assertDigits(digits);
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('count must be a non-negative integer, got ' + count);
  }

  /** @type {Problem[]} */
  const problems = [];
  for (let i = 0; i < count; i++) {
    let problem = makeProblem(operation, digits, rng);
    for (
      let attempt = 0;
      attempt < DUPLICATE_ATTEMPTS && isRepeat(problem, problems[i - 1]);
      attempt++
    ) {
      problem = makeProblem(operation, digits, rng);
    }
    problems.push(problem);
  }
  return problems;
}
