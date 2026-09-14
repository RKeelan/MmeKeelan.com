import { describe, it, expect } from 'vitest';
import {
  DIGITS,
  LINE_SPAN,
  OPERATIONS,
  allProblems,
  generateProblems,
  lineStart,
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

describe('DIGITS', () => {
  it('lists one and two digits', () => {
    expect([...DIGITS]).toEqual([1, 2]);
  });
});

describe('allProblems', () => {
  for (const operation of OPERATIONS) {
    for (const digits of DIGITS) {
      describe(operation + ', ' + digits + ' digit(s)', () => {
        const problems = allProblems(operation, digits);

        it('jumps by a single digit, never zero', () => {
          for (const { b } of problems) {
            expect(b).toBeGreaterThanOrEqual(1);
            expect(b).toBeLessThanOrEqual(9);
          }
        });

        it('keeps every answer positive and below 100', () => {
          for (const { answer } of problems) {
            expect(answer).toBeGreaterThanOrEqual(1);
            expect(answer).toBeLessThanOrEqual(99);
          }
        });

        it('lists each problem once', () => {
          expect(new Set(problems.map(key)).size).toBe(problems.length);
        });
      });
    }
  }

  it('lists every addition of two single digits', () => {
    const problems = allProblems('add', 1);
    expect(problems).toHaveLength(81);
    for (const { a, b, answer } of problems) {
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(9);
      expect(answer).toBe(a + b);
    }
  });

  it('lists every single-digit subtraction with a positive answer', () => {
    const problems = allProblems('subtract', 1);
    expect(problems).toHaveLength(36);
    for (const { a, b, answer } of problems) {
      expect(a).toBeGreaterThan(b);
      expect(a).toBeLessThanOrEqual(9);
      expect(answer).toBe(a - b);
    }
  });

  it('adds a single digit to every number from 10 to 90', () => {
    const problems = allProblems('add', 2);
    expect(problems).toHaveLength(81 * 9);
    for (const { a, b, answer } of problems) {
      expect(a).toBeGreaterThanOrEqual(10);
      expect(a).toBeLessThanOrEqual(90);
      expect(answer).toBe(a + b);
    }
  });

  it('subtracts a single digit from every number from 10 to 99', () => {
    const problems = allProblems('subtract', 2);
    expect(problems).toHaveLength(90 * 9);
    for (const { a, b, answer } of problems) {
      expect(a).toBeGreaterThanOrEqual(10);
      expect(a).toBeLessThanOrEqual(99);
      expect(answer).toBe(a - b);
    }
  });

  it('rejects an unsupported operation', () => {
    expect(() => allProblems(/** @type {any} */ ('multiply'), 1)).toThrow(
      RangeError,
    );
  });

  it('rejects an unsupported digit count', () => {
    expect(() => allProblems('add', /** @type {any} */ (3))).toThrow(
      RangeError,
    );
  });
});

describe('lineStart', () => {
  it('puts the whole jump on a line between multiples of ten', () => {
    for (const operation of OPERATIONS) {
      for (const digits of DIGITS) {
        for (const problem of allProblems(operation, digits)) {
          const start = lineStart(problem);
          expect(start % 10).toBe(0);
          expect(start).toBeGreaterThanOrEqual(0);
          expect(start + LINE_SPAN).toBeLessThanOrEqual(100);
          for (const end of [problem.a, problem.answer]) {
            expect(end).toBeGreaterThanOrEqual(start);
            expect(end).toBeLessThanOrEqual(start + LINE_SPAN);
          }
        }
      }
    }
  });

  it('starts every single-digit problem at zero', () => {
    for (const operation of OPERATIONS) {
      for (const problem of allProblems(operation, 1)) {
        expect(lineStart(problem)).toBe(0);
      }
    }
  });

  it('centres the line on the jump', () => {
    const cases = [
      { operation: 'add', a: 10, b: 9, start: 0 },
      { operation: 'subtract', a: 10, b: 9, start: 0 },
      { operation: 'add', a: 11, b: 2, start: 0 },
      { operation: 'add', a: 34, b: 5, start: 30 },
      { operation: 'subtract', a: 52, b: 7, start: 40 },
      { operation: 'add', a: 90, b: 9, start: 80 },
      { operation: 'subtract', a: 99, b: 9, start: 80 },
      { operation: 'subtract', a: 99, b: 1, start: 80 },
    ];
    for (const { operation, a, b, start } of cases) {
      const answer = operation === 'add' ? a + b : a - b;
      const problem =
        /** @type {import('./number-line-problems.js').Problem} */ ({
          operation,
          a,
          b,
          answer,
        });
      expect(lineStart(problem), operation + ' ' + a + ', ' + b).toBe(start);
    }
  });
});

describe('generateProblems', () => {
  it('produces the requested number of problems', () => {
    for (const count of [0, 1, 4, 9, 12, 81]) {
      expect(generateProblems('add', 1, count)).toHaveLength(count);
    }
  });

  it('never repeats a problem on the same page', () => {
    for (const operation of OPERATIONS) {
      for (const digits of DIGITS) {
        for (let i = 0; i < 50; i++) {
          const problems = generateProblems(operation, digits, 12);
          expect(new Set(problems.map(key)).size).toBe(12);
        }
      }
    }
  });

  it('draws only problems of the requested operation', () => {
    for (const operation of OPERATIONS) {
      for (const problem of generateProblems(operation, 1, 12)) {
        expect(problem.operation).toBe(operation);
      }
    }
  });

  it('draws two-digit first operands when asked', () => {
    for (const operation of OPERATIONS) {
      for (const { a } of generateProblems(operation, 2, 12)) {
        expect(a).toBeGreaterThanOrEqual(10);
      }
    }
  });

  it('is deterministic for a given random source', () => {
    const first = generateProblems(
      'subtract',
      2,
      9,
      cyclingRng([0.1, 0.7, 0.42]),
    );
    const second = generateProblems(
      'subtract',
      2,
      9,
      cyclingRng([0.1, 0.7, 0.42]),
    );
    expect(first).toEqual(second);
  });

  it('stays in range when the source returns its upper bound', () => {
    const problems = generateProblems('add', 1, 81, () => 1);
    expect(new Set(problems.map(key)).size).toBe(81);
  });

  it('rejects an invalid count', () => {
    expect(() => generateProblems('add', 1, -1)).toThrow(RangeError);
    expect(() => generateProblems('add', 1, 2.5)).toThrow(RangeError);
    expect(() => generateProblems('add', 1, 82)).toThrow(RangeError);
  });
});
