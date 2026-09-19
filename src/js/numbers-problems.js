// Pure, DOM-free generation of problems for the numbers worksheet.

import { MAX_NUMBER } from './number-words.js';

/**
 * A way of showing a number: as base-ten blocks, as a numeral, as its place
 * values added up, or in words.
 * @typedef {'blocks' | 'numeral' | 'expanded' | 'words'} Form
 */

/**
 * Which numbers a worksheet draws from: every one up to its largest, or only
 * the "-teen" numbers, 11 to 19, and the "-ty" numbers, 20 to 90 by tens, that
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
export const FORMS = Object.freeze(['blocks', 'numeral', 'expanded', 'words']);

/**
 * The sets of numbers a worksheet can draw from.
 * @type {readonly NumberSet[]}
 */
export const NUMBER_SETS = Object.freeze(['all', 'tyTeen']);

/** The place values a number is broken into, largest first. */
const PLACE_VALUES = Object.freeze([100, 10, 1]);

/**
 * `n` as its place values added up, leaving out the places it has none of:
 * 152 is "100 + 50 + 2" and 105 is "100 + 5". Zero, having no place values at
 * all, is itself.
 * @param {number} n A whole number from 0 to MAX_NUMBER.
 * @returns {string}
 */
export function expandedForm(n) {
  if (!Number.isInteger(n) || n < 0 || n > MAX_NUMBER) {
    throw new RangeError(
      'n must be a whole number from 0 to ' + MAX_NUMBER + ', got ' + n,
    );
  }
  const parts = PLACE_VALUES.map(
    (place) => (Math.floor(n / place) % 10) * place,
  ).filter((part) => part > 0);
  return parts.length > 0 ? parts.join(' + ') : '0';
}

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
 * row giving it as blocks would show nothing at all, and a number with a
 * single place value is its own expanded form, so a row giving it that way
 * would already show the numeral the student is meant to write.
 * @param {number} number
 * @param {Form} form
 * @returns {boolean}
 */
function canGive(number, form) {
  if (form === 'blocks') return number > 0;
  if (form === 'expanded') return expandedForm(number).includes(' + ');
  return true;
}

/**
 * How many of `pool` each form has to choose from. The forms are choosy in
 * nested degrees — every number an expanded row can take, a blocks row can
 * take too — so a choosier row that takes its number first never robs a less
 * choosy one of the last number it could have had.
 * @param {readonly Form[]} forms
 * @param {readonly number[]} pool
 * @returns {Map<Form, number>}
 */
function roomFor(forms, pool) {
  return new Map(
    forms.map((form) => [form, pool.filter((n) => canGive(n, form)).length]),
  );
}

/**
 * Whether `count` rows shared among `forms` forms can all find a number.
 * Sharing the rows out evenly gives each form `count / forms` of them, and in
 * the worst case the choosiest forms take the leftovers as well.
 * @param {readonly number[]} sizes How many numbers each form has to choose
 *   from, fewest first.
 * @param {number} count
 * @param {number} forms
 * @returns {boolean}
 */
function fits(sizes, count, forms) {
  const each = Math.floor(count / forms);
  const extra = count % forms;
  return sizes.every(
    (size, i) => (i + 1) * each + Math.min(i + 1, extra) <= size,
  );
}

/**
 * The most problems one page can hold, given the forms it may give them in.
 * A page of nothing but expanded rows, say, can be no longer than the count of
 * numbers with more than one place value.
 * @param {readonly Form[]} forms The forms a problem's number can be given in.
 * @param {NumberSet} set Which numbers to draw from.
 * @param {object} [options]
 * @param {number} [options.max] The largest number to draw.
 * @returns {number}
 */
export function maxProblems(forms, set, { max = MAX_NUMBER } = {}) {
  if (forms.length === 0) return 0;
  const pool = numbersIn(set, max);
  const sizes = [...roomFor(forms, pool).values()].sort((a, b) => a - b);
  let count = 0;
  while (count < pool.length && fits(sizes, count + 1, forms.length)) count++;
  return count;
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

  // The choosiest rows take their numbers first, so that the less choosy rows
  // can't use up the few numbers they are able to take.
  const room = roomFor(FORMS, pool);
  const choosiestFirst = [...problems].sort(
    (a, b) => (room.get(a.given) ?? 0) - (room.get(b.given) ?? 0),
  );
  for (const problem of choosiestFirst) {
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
