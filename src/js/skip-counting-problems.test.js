import { describe, it, expect } from 'vitest';
import {
  CHART_MAX,
  CHART_MIN,
  RANDOM_MAX,
  RANDOM_MIN,
  ROW_LENGTH,
  SKIP_MAX,
  SKIP_MIN,
  chartRows,
  parseSkipCounts,
  randomSkipCount,
  skipCountsForPages,
} from './skip-counting-problems.js';

/**
 * A deterministic random source cycling through the given values.
 * @param {number[]} values
 * @returns {() => number}
 */
function cyclingRng(values) {
  let i = 0;
  return () => {
    const value = values[i % values.length];
    i++;
    return value;
  };
}

describe('randomSkipCount', () => {
  it('stays within the random range', () => {
    for (let i = 0; i < 200; i++) {
      const step = randomSkipCount();
      expect(step).toBeGreaterThanOrEqual(RANDOM_MIN);
      expect(step).toBeLessThanOrEqual(RANDOM_MAX);
      expect(Number.isInteger(step)).toBe(true);
    }
  });

  it('draws every number in the range', () => {
    const drawn = new Set();
    for (let i = 0; i < 2000; i++) drawn.add(randomSkipCount());
    for (let step = RANDOM_MIN; step <= RANDOM_MAX; step++) {
      expect(drawn.has(step)).toBe(true);
    }
  });

  it('maps the ends of the source to the ends of the range', () => {
    expect(randomSkipCount(() => 0)).toBe(RANDOM_MIN);
    expect(randomSkipCount(() => 1)).toBe(RANDOM_MAX);
    expect(randomSkipCount(() => 0.999)).toBe(RANDOM_MAX);
  });

  it('is deterministic for a given random source', () => {
    const values = [0.1, 0.5, 0.87];
    const first = [0, 1, 2].map(() => randomSkipCount(cyclingRng(values)));
    const second = [0, 1, 2].map(() => randomSkipCount(cyclingRng(values)));
    expect(first).toEqual(second);
  });
});

describe('parseSkipCounts', () => {
  it('reads a single count', () => {
    expect(parseSkipCounts('7')).toEqual([7]);
  });

  it('reads a list separated by commas, spaces, or both', () => {
    expect(parseSkipCounts('2,5,10')).toEqual([2, 5, 10]);
    expect(parseSkipCounts('2, 5, 10')).toEqual([2, 5, 10]);
    expect(parseSkipCounts('2 5 10')).toEqual([2, 5, 10]);
    expect(parseSkipCounts('  2,,5 , 10  ')).toEqual([2, 5, 10]);
  });

  it('keeps the counts in the order they were written', () => {
    expect(parseSkipCounts('10, 2, 5')).toEqual([10, 2, 5]);
  });

  it('keeps a count repeated', () => {
    expect(parseSkipCounts('2, 2, 5')).toEqual([2, 2, 5]);
  });

  it('holds every count within range', () => {
    expect(parseSkipCounts('1, 70, 0')).toEqual([SKIP_MIN, SKIP_MAX, SKIP_MIN]);
  });

  it('passes over anything that is not a whole number', () => {
    expect(parseSkipCounts('2, x, 5')).toEqual([2, 5]);
    expect(parseSkipCounts('2, 2.5, -3, 5')).toEqual([2, 5]);
    expect(parseSkipCounts('2,')).toEqual([2]);
  });

  it('finds no counts in an empty or wordy list', () => {
    expect(parseSkipCounts('')).toEqual([]);
    expect(parseSkipCounts('   ')).toEqual([]);
    expect(parseSkipCounts('two, five')).toEqual([]);
  });
});

describe('skipCountsForPages', () => {
  it('gives one count per page', () => {
    for (const pages of [0, 1, 3, 30]) {
      expect(skipCountsForPages([5], pages)).toHaveLength(pages);
      expect(skipCountsForPages([], pages)).toHaveLength(pages);
    }
  });

  it('gives every page the same count when only one was asked for', () => {
    expect(skipCountsForPages([5], 3)).toEqual([5, 5, 5]);
  });

  it('gives the counts asked for a page each', () => {
    expect(skipCountsForPages([2, 5], 2)).toEqual([2, 5]);
    expect(skipCountsForPages([2, 5, 10], 3)).toEqual([2, 5, 10]);
  });

  it('starts the list again when there are more pages than counts', () => {
    expect(skipCountsForPages([2, 5], 5)).toEqual([2, 5, 2, 5, 2]);
  });

  it('uses only as many counts as there are pages', () => {
    expect(skipCountsForPages([2, 5, 10], 2)).toEqual([2, 5]);
  });

  it('draws a count for every page when none were asked for', () => {
    expect(skipCountsForPages([], 3, () => 0)).toEqual([
      RANDOM_MIN,
      RANDOM_MIN,
      RANDOM_MIN,
    ]);
    for (const step of skipCountsForPages([], 30)) {
      expect(step).toBeGreaterThanOrEqual(RANDOM_MIN);
      expect(step).toBeLessThanOrEqual(RANDOM_MAX);
    }
  });

  it('draws a fresh count for each page', () => {
    const steps = skipCountsForPages([], 4, cyclingRng([0, 0.99]));
    expect(steps).toEqual([RANDOM_MIN, RANDOM_MAX, RANDOM_MIN, RANDOM_MAX]);
  });
});

describe('chartRows', () => {
  const rows = chartRows();

  it('fills rows of ten', () => {
    expect(rows).toHaveLength(CHART_MAX / ROW_LENGTH);
    for (const row of rows) expect(row).toHaveLength(ROW_LENGTH);
  });

  it('runs from the first number to the last, in order', () => {
    const numbers = rows.flat();
    expect(numbers[0]).toBe(CHART_MIN);
    expect(numbers[numbers.length - 1]).toBe(CHART_MAX);
    expect(numbers).toEqual(
      Array.from({ length: CHART_MAX }, (_, i) => CHART_MIN + i),
    );
  });

  it('puts the multiples of ten in the last column', () => {
    for (const row of rows) expect(row[row.length - 1] % 10).toBe(0);
  });
});
