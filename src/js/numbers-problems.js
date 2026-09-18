// Pure, DOM-free generation of problems for the numbers worksheet.

import { MAX_NUMBER } from './number-words.js';

/**
 * A way of showing a number: as base-ten blocks, as a numeral, or in words.
 * @typedef {'blocks' | 'numeral' | 'words'} Form
 */

/**
 * Which numbers a worksheet draws from: every one from 0 to 100, or only the
 * "-teen" numbers, 11 to 19, and the "-ty" numbers, 20 to 90 by tens, that
 * students mix up.
 * @typedef {'all' | 'tyTeen'} NumberSet
 */

/**
 * A single worksheet problem: a number shown in one form, for the student to
 * show in the others.
 * @typedef {object} Problem
 * @property {number} number
 * @property {Form} given The form the worksheet shows the number in.
 */

/**
 * The forms a number can be shown in, in the order the worksheet sets them out.
 * @type {readonly Form[]}
 */
export const FORMS = Object.freeze(['blocks', 'numeral', 'words']);

/**
 * The sets of numbers a worksheet can draw from.
 * @type {readonly NumberSet[]}
 */
export const NUMBER_SETS = Object.freeze(['all', 'tyTeen']);

/**
 * Every number in `set` up to `max`, in ascending order.
 * @param {NumberSet} set
 * @param {number} [max] The largest number to include.
 * @returns {number[]}
 */
export function numbersIn(set, max = MAX_NUMBER) {
  /** @type {number[]} */
  const numbers = [];
  if (set === 'all') {
    for (let n = 0; n <= MAX_NUMBER; n++) numbers.push(n);
  } else if (set === 'tyTeen') {
    for (let n = 11; n <= 19; n++) numbers.push(n);
    for (let n = 20; n <= 90; n += 10) numbers.push(n);
  } else {
    throw new RangeError('Unsupported number set: ' + set);
  }
  return numbers.filter((n) => n <= max);
}

/**
 * Whether `number` can be given in `form`. Zero has no blocks to draw, so a
 * row giving it as blocks would show nothing at all.
 * @param {number} number
 * @param {Form} form
 * @returns {boolean}
 */
function canGive(number, form) {
  return form !== 'blocks' || number > 0;
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
 * The given form of each of `count` problems, shared out as evenly as possible
 * among `forms` and shuffled. Which forms get the leftovers is random too.
 * @param {readonly Form[]} forms
 * @param {number} count
 * @param {() => number} rng
 * @returns {Form[]}
 */
function givenForms(forms, count, rng) {
  const order = shuffled(forms, rng);
  const given = Array.from(
    { length: count },
    (_, i) => order[i % order.length],
  );
  return shuffled(given, rng);
}

/**
 * Generate one page's worth of problems. Numbers are drawn without
 * replacement, so none appears twice on the same page.
 * @param {readonly Form[]} forms The forms a problem's number can be given in.
 * @param {NumberSet} set Which numbers to draw from.
 * @param {number} count How many problems to produce.
 * @param {object} [options]
 * @param {number} [options.max] The largest number to draw.
 * @param {() => number} [options.rng] Random source in [0, 1); injectable for
 *   tests.
 * @returns {Problem[]}
 */
export function generateProblems(
  forms,
  set,
  count,
  { max = MAX_NUMBER, rng = Math.random } = {},
) {
  if (forms.length === 0) {
    throw new RangeError('At least one form must be given');
  }
  for (const form of forms) {
    if (!FORMS.includes(form)) {
      throw new RangeError('Unsupported form: ' + form);
    }
  }
  const pool = numbersIn(set, max);
  if (!Number.isInteger(count) || count < 0 || count > pool.length) {
    throw new RangeError(
      'count must be an integer from 0 to ' + pool.length + ', got ' + count,
    );
  }

  /** @type {Problem[]} */
  const problems = givenForms(forms, count, rng).map((given) => ({
    number: 0,
    given,
  }));
  const remaining = shuffled(pool, rng);

  // The blocks rows take their numbers first, so that zero, which they can't
  // take, is left for the others.
  const blocksFirst = [
    ...problems.filter((problem) => problem.given === 'blocks'),
    ...problems.filter((problem) => problem.given !== 'blocks'),
  ];
  for (const problem of blocksFirst) {
    const index = remaining.findIndex((n) => canGive(n, problem.given));
    if (index < 0) {
      throw new RangeError(
        'Not enough numbers to give ' + count + ' as ' + forms.join(' or '),
      );
    }
    [problem.number] = remaining.splice(index, 1);
  }
  return problems;
}
