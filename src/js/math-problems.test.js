import { describe, it, expect } from 'vitest';
import {
  OPERATIONS,
  generateProblems,
  randomWithDigits,
} from './math-problems.js';

/**
 * Number of decimal digits in a non-negative integer.
 * @param {number} n
 * @returns {number}
 */
function digitCount(n) {
  return String(n).length;
}

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

const COMPLEXITIES = [1, 2, 3, 4];

describe('OPERATIONS', () => {
  it('lists the four supported operations', () => {
    expect([...OPERATIONS]).toEqual(['add', 'subtract', 'multiply', 'divide']);
  });
});

describe('randomWithDigits', () => {
  for (const digits of COMPLEXITIES) {
    it('produces exactly ' + digits + ' digits', () => {
      for (let i = 0; i < 200; i++) {
        expect(digitCount(randomWithDigits(digits))).toBe(digits);
      }
    });
  }

  it('never produces zero for a single digit', () => {
    for (let i = 0; i < 200; i++) {
      expect(randomWithDigits(1)).toBeGreaterThanOrEqual(1);
    }
  });

  it('spans the whole range for the given digit count', () => {
    expect(randomWithDigits(1, () => 0)).toBe(1);
    expect(randomWithDigits(1, () => 0.999999)).toBe(9);
    expect(randomWithDigits(3, () => 0)).toBe(100);
    expect(randomWithDigits(3, () => 0.999999)).toBe(999);
  });

  it('stays in range when the source returns its upper bound', () => {
    expect(randomWithDigits(2, () => 1)).toBe(99);
  });

  it('rejects a non-positive digit count', () => {
    expect(() => randomWithDigits(0)).toThrow(RangeError);
    expect(() => randomWithDigits(1.5)).toThrow(RangeError);
  });
});

describe('generateProblems', () => {
  it('produces the requested number of problems', () => {
    for (const count of [0, 1, 6, 12, 30]) {
      expect(generateProblems('add', 2, count)).toHaveLength(count);
    }
  });

  it('supports every operation', () => {
    for (const operation of OPERATIONS) {
      const problems = generateProblems(operation, 2, 10);
      expect(problems).toHaveLength(10);
      for (const problem of problems) {
        expect(problem.operation).toBe(operation);
      }
    }
  });

  it('rejects an unsupported operation', () => {
    expect(() => generateProblems(/** @type {any} */ ('modulo'), 2, 5)).toThrow(
      RangeError,
    );
  });

  it('rejects an invalid count', () => {
    expect(() => generateProblems('add', 2, -1)).toThrow(RangeError);
  });

  it('is deterministic for a given random source', () => {
    const first = generateProblems('add', 3, 12, cyclingRng([0.1, 0.7, 0.42]));
    const second = generateProblems('add', 3, 12, cyclingRng([0.1, 0.7, 0.42]));
    expect(first).toEqual(second);
  });

  for (const digits of COMPLEXITIES) {
    describe(digits + '-digit addition', () => {
      const problems = generateProblems('add', digits, 60);

      it('gives both operands the requested digit count', () => {
        for (const { a, b } of problems) {
          expect(digitCount(a)).toBe(digits);
          expect(digitCount(b)).toBe(digits);
        }
      });

      it('records the correct answer', () => {
        for (const { a, b, answer } of problems) {
          expect(answer).toBe(a + b);
        }
      });
    });

    describe(digits + '-digit subtraction', () => {
      const problems = generateProblems('subtract', digits, 60);

      it('gives both operands the requested digit count', () => {
        for (const { a, b } of problems) {
          expect(digitCount(a)).toBe(digits);
          expect(digitCount(b)).toBe(digits);
        }
      });

      it('never yields a negative answer', () => {
        for (const { a, b, answer } of problems) {
          expect(a).toBeGreaterThanOrEqual(b);
          expect(answer).toBeGreaterThanOrEqual(0);
        }
      });

      it('records the correct answer', () => {
        for (const { a, b, answer } of problems) {
          expect(answer).toBe(a - b);
        }
      });
    });

    describe(digits + '-digit multiplication', () => {
      const problems = generateProblems('multiply', digits, 60);

      it('sizes the operands for a workable paper layout', () => {
        const expectedB = digits <= 2 ? digits : 2;
        for (const { a, b } of problems) {
          expect(digitCount(a)).toBe(digits);
          expect(digitCount(b)).toBe(expectedB);
        }
      });

      it('records the correct answer', () => {
        for (const { a, b, answer } of problems) {
          expect(answer).toBe(a * b);
        }
      });
    });

    describe(digits + '-digit division', () => {
      const problems = generateProblems('divide', digits, 60);

      it('gives the dividend the requested digit count', () => {
        for (const { a } of problems) {
          expect(digitCount(a)).toBe(digits);
        }
      });

      it('always divides evenly', () => {
        for (const { a, b } of problems) {
          expect(a % b).toBe(0);
        }
      });

      it('never divides by zero or one', () => {
        const maxDivisor = digits <= 2 ? 9 : 99;
        for (const { b } of problems) {
          expect(b).toBeGreaterThanOrEqual(2);
          expect(b).toBeLessThanOrEqual(maxDivisor);
        }
      });

      it('records the correct answer', () => {
        for (const { a, b, answer } of problems) {
          expect(answer).toBe(a / b);
        }
      });
    });
  }

  it('handles single-digit division without hanging', () => {
    // Only 4 ÷ 2, 6 ÷ 2, 8 ÷ 2, 6 ÷ 3, 9 ÷ 3 and 8 ÷ 4 fit in one digit, so
    // most divisors have to be rejected and re-rolled.
    const problems = generateProblems('divide', 1, 50);
    for (const { a, b, answer } of problems) {
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(9);
      expect(b).toBeGreaterThanOrEqual(2);
      expect(b).toBeLessThanOrEqual(4);
      expect(answer).toBe(a / b);
    }
  });

  it('falls back to a workable divisor when every draw is rejected', () => {
    // A source pinned to its top always draws divisor 9, whose single-digit
    // quotient range is empty; the fallback still returns a valid problem.
    const problem = generateProblems('divide', 1, 1, () => 0.999999)[0];
    expect(problem.a % problem.b).toBe(0);
    expect(digitCount(problem.a)).toBe(1);
    expect(problem.b).toBeGreaterThanOrEqual(2);
  });
});
