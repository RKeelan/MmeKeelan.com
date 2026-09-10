import { describe, it, expect } from 'vitest';
import {
  LINE_END,
  OPERATIONS,
  allProblems,
  generateProblems,
} from './number-line-problems.js';

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

/**
 * A key identifying the question a problem poses.
 * @param {{ a: number, b: number }} problem
 * @returns {string}
 */
function key({ a, b }) {
  return a + ',' + b;
}

describe('OPERATIONS', () => {
  it('lists addition and subtraction', () => {
    expect([...OPERATIONS]).toEqual(['add', 'subtract']);
  });
});

describe('allProblems', () => {
  for (const operation of OPERATIONS) {
    describe(operation, () => {
      const problems = allProblems(operation);

      it('uses single-digit operands and never zero', () => {
        for (const { a, b } of problems) {
          expect(a).toBeGreaterThanOrEqual(1);
          expect(a).toBeLessThanOrEqual(9);
          expect(b).toBeGreaterThanOrEqual(1);
          expect(b).toBeLessThanOrEqual(9);
        }
      });

      it('keeps every answer on the number line', () => {
        for (const { answer } of problems) {
          expect(answer).toBeGreaterThanOrEqual(0);
          expect(answer).toBeLessThanOrEqual(LINE_END);
        }
      });

      it('lists each problem once', () => {
        expect(new Set(problems.map(key)).size).toBe(problems.length);
      });
    });
  }

  it('lists every addition that sums to at most ten', () => {
    const problems = allProblems('add');
    expect(problems).toHaveLength(45);
    for (const { a, b, answer } of problems) {
      expect(answer).toBe(a + b);
    }
  });

  it('lists every subtraction with a positive answer', () => {
    const problems = allProblems('subtract');
    expect(problems).toHaveLength(36);
    for (const { a, b, answer } of problems) {
      expect(a).toBeGreaterThan(b);
      expect(answer).toBe(a - b);
    }
  });

  it('rejects an unsupported operation', () => {
    expect(() => allProblems(/** @type {any} */ ('multiply'))).toThrow(
      RangeError,
    );
  });
});

describe('generateProblems', () => {
  it('produces the requested number of problems', () => {
    for (const count of [0, 1, 4, 9, 12, 45]) {
      expect(generateProblems('add', count)).toHaveLength(count);
    }
  });

  it('never repeats a problem on the same page', () => {
    for (const operation of OPERATIONS) {
      for (let i = 0; i < 50; i++) {
        const problems = generateProblems(operation, 12);
        expect(new Set(problems.map(key)).size).toBe(12);
      }
    }
  });

  it('draws only problems of the requested operation', () => {
    for (const operation of OPERATIONS) {
      for (const problem of generateProblems(operation, 12)) {
        expect(problem.operation).toBe(operation);
      }
    }
  });

  it('is deterministic for a given random source', () => {
    const first = generateProblems('subtract', 9, cyclingRng([0.1, 0.7, 0.42]));
    const second = generateProblems(
      'subtract',
      9,
      cyclingRng([0.1, 0.7, 0.42]),
    );
    expect(first).toEqual(second);
  });

  it('stays in range when the source returns its upper bound', () => {
    const problems = generateProblems('add', 45, () => 1);
    expect(new Set(problems.map(key)).size).toBe(45);
  });

  it('rejects an invalid count', () => {
    expect(() => generateProblems('add', -1)).toThrow(RangeError);
    expect(() => generateProblems('add', 2.5)).toThrow(RangeError);
    expect(() => generateProblems('add', 46)).toThrow(RangeError);
  });
});
