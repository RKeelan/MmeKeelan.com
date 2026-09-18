// Pure, DOM-free generation of the skip count and the number chart for the
// skip-counting worksheet.

/** The first number on the chart. */
export const CHART_MIN = 1;

/** The last number on the chart. */
export const CHART_MAX = 100;

/** How many numbers each row of the chart holds. */
export const ROW_LENGTH = 10;

/** The smallest skip count worth counting by. */
export const SKIP_MIN = 2;

/**
 * The largest skip count a chart can show: past half of it, counting lands on
 * a single number, which is no pattern to find.
 */
export const SKIP_MAX = CHART_MAX / 2;

/** The smallest skip count drawn at random. */
export const RANDOM_MIN = 2;

/** The largest skip count drawn at random. */
export const RANDOM_MAX = 9;

/**
 * A skip count drawn at random, from RANDOM_MIN to RANDOM_MAX inclusive.
 * @param {() => number} [rng] Random source in [0, 1); injectable for tests.
 * @returns {number}
 */
export function randomSkipCount(rng = Math.random) {
  const span = RANDOM_MAX - RANDOM_MIN + 1;
  return RANDOM_MIN + Math.min(Math.floor(rng() * span), span - 1);
}

/**
 * The skip counts written in `text`, a list separated by commas or spaces.
 * Each is held within the range a chart can show, and anything that is not a
 * whole number is passed over, so that a half-typed list still generates.
 * @param {string} text
 * @returns {number[]} The counts in the order they were written, which is
 *   empty when none were.
 */
export function parseSkipCounts(text) {
  return text
    .split(/[\s,]+/)
    .filter((token) => /^\d+$/.test(token))
    .map((token) => {
      const count = Number.parseInt(token, 10);
      return Math.min(Math.max(count, SKIP_MIN), SKIP_MAX);
    });
}

/**
 * The count for each of `pages` pages: the counts asked for in turn, starting
 * the list again whenever it runs out, or one drawn at random for every page
 * when none were asked for.
 * @param {readonly number[]} counts The counts asked for, possibly none.
 * @param {number} pages How many pages to produce a count for.
 * @param {() => number} [rng] Random source in [0, 1); injectable for tests.
 * @returns {number[]}
 */
export function skipCountsForPages(counts, pages, rng = Math.random) {
  return Array.from({ length: Math.max(pages, 0) }, (_, page) =>
    counts.length > 0 ? counts[page % counts.length] : randomSkipCount(rng),
  );
}

/**
 * The chart's numbers a row at a time: CHART_MIN to CHART_MAX in rows of
 * ROW_LENGTH.
 * @returns {number[][]}
 */
export function chartRows() {
  /** @type {number[][]} */
  const rows = [];
  for (let first = CHART_MIN; first <= CHART_MAX; first += ROW_LENGTH) {
    const last = Math.min(first + ROW_LENGTH - 1, CHART_MAX);
    rows.push(Array.from({ length: last - first + 1 }, (_, i) => first + i));
  }
  return rows;
}
