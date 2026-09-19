import { describe, it, expect } from 'vitest';
import {
  FORMS,
  NUMBER_SETS,
  expandedForm,
  generateProblems,
  maxProblems,
  numbersIn,
} from './numbers-problems.js';

/** @typedef {import('./numbers-problems.js').Form} Form */

/**
 * Every non-empty combination of forms.
 * @returns {Form[][]}
 */
function formCombinations() {
  /** @type {Form[][]} */
  const combinations = [];
  for (let mask = 1; mask < 2 ** FORMS.length; mask++) {
    combinations.push(FORMS.filter((_, i) => mask & (2 ** i)));
  }
  return combinations;
}

describe('FORMS', () => {
  it('lists blocks, numeral, expanded, and words', () => {
    expect([...FORMS]).toEqual(['blocks', 'numeral', 'expanded', 'words']);
  });
});

describe('expandedForm', () => {
  it('adds up the places a number has', () => {
    expect(expandedForm(152)).toBe('100 + 50 + 2');
    expect(expandedForm(199)).toBe('100 + 90 + 9');
    expect(expandedForm(42)).toBe('40 + 2');
  });

  it('leaves out the places a number has none of', () => {
    expect(expandedForm(105)).toBe('100 + 5');
    expect(expandedForm(150)).toBe('100 + 50');
    expect(expandedForm(110)).toBe('100 + 10');
  });

  it('writes a number with one place as itself', () => {
    expect(expandedForm(0)).toBe('0');
    expect(expandedForm(7)).toBe('7');
    expect(expandedForm(20)).toBe('20');
    expect(expandedForm(100)).toBe('100');
    expect(expandedForm(200)).toBe('200');
  });

  it('rejects numbers outside 0 to 200', () => {
    for (const n of [-1, 201, 2.5, Number.NaN]) {
      expect(() => expandedForm(n)).toThrow(RangeError);
    }
  });
});

describe('NUMBER_SETS', () => {
  it('lists all numbers and the -ty and -teen numbers', () => {
    expect([...NUMBER_SETS]).toEqual(['all', 'tyTeen']);
  });
});

describe('numbersIn', () => {
  it('lists every number from 0 to 200', () => {
    expect(numbersIn('all')).toEqual(Array.from({ length: 201 }, (_, n) => n));
  });

  it('lists 11 to 19 and the multiples of ten from 20 to 90', () => {
    expect(numbersIn('tyTeen')).toEqual([
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 30, 40, 50, 60, 70, 80, 90,
    ]);
  });

  it('leaves out the numbers above the maximum', () => {
    expect(numbersIn('all', 99)).toEqual(
      Array.from({ length: 100 }, (_, n) => n),
    );
    expect(numbersIn('tyTeen', 50)).toEqual([
      11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 30, 40, 50,
    ]);
  });

  it('rejects an unsupported set', () => {
    expect(() => numbersIn(/** @type {any} */ ('odd'))).toThrow(RangeError);
  });
});

describe('maxProblems', () => {
  it('counts the numbers a page of one form has to draw from', () => {
    // Every number but zero has blocks; every one but the twenty-one with a
    // single place — zero, 1 to 9, the tens, 100, and 200 — has an expanded
    // form of its own.
    expect(maxProblems(['numeral'], 'all')).toBe(201);
    expect(maxProblems(['blocks'], 'all')).toBe(200);
    expect(maxProblems(['expanded'], 'all')).toBe(180);
    expect(maxProblems(['expanded'], 'all', { max: 99 })).toBe(81);
    expect(maxProblems(['expanded'], 'tyTeen')).toBe(9);
  });

  it('shares a mixed page out among its forms', () => {
    expect(maxProblems(FORMS, 'all')).toBe(201);
    expect(maxProblems(FORMS, 'tyTeen')).toBe(17);
    expect(maxProblems(FORMS, 'tyTeen', { max: 20 })).toBe(10);
  });

  it('promises nothing when no form is given', () => {
    expect(maxProblems([], 'all')).toBe(0);
  });

  it('promises no more than can be generated', () => {
    for (const set of NUMBER_SETS) {
      for (const max of [20, 50, 99, 200]) {
        for (const forms of formCombinations()) {
          const count = maxProblems(forms, set, { max });
          for (let i = 0; i < 3; i++) {
            expect(generateProblems(forms, set, count, { max })).toHaveLength(
              count,
            );
          }
        }
      }
    }
  });
});

describe('generateProblems', () => {
  it('produces the requested number of problems', () => {
    for (const count of [0, 1, 4, 10, 201]) {
      expect(generateProblems(FORMS, 'all', count)).toHaveLength(count);
    }
    expect(generateProblems(FORMS, 'tyTeen', 17)).toHaveLength(17);
  });

  it('never repeats a number on the same page', () => {
    for (const set of NUMBER_SETS) {
      for (let i = 0; i < 50; i++) {
        const problems = generateProblems(FORMS, set, 10);
        expect(new Set(problems.map((p) => p.number)).size).toBe(10);
      }
    }
  });

  it('draws no number above the maximum', () => {
    const problems = generateProblems(FORMS, 'all', 100, { max: 99 });
    expect(problems.map((p) => p.number).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 100 }, (_, n) => n),
    );
    expect(() => generateProblems(FORMS, 'all', 101, { max: 99 })).toThrow(
      RangeError,
    );
  });

  it('draws only numbers from the requested set', () => {
    for (const set of NUMBER_SETS) {
      const numbers = new Set(numbersIn(set));
      for (let i = 0; i < 50; i++) {
        for (const { number } of generateProblems(FORMS, set, 10)) {
          expect(numbers.has(number)).toBe(true);
        }
      }
    }
  });

  it('shares the rows evenly among the requested forms', () => {
    for (const forms of formCombinations()) {
      for (let i = 0; i < 20; i++) {
        const problems = generateProblems(forms, 'all', 10);
        const counts = forms.map(
          (form) => problems.filter((p) => p.given === form).length,
        );
        expect(counts.reduce((a, b) => a + b)).toBe(10);
        expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(
          1,
        );
      }
    }
  });

  it('shares out the leftover rows at random', () => {
    const extras = new Set();
    for (let i = 0; i < 100; i++) {
      const problems = generateProblems(FORMS, 'all', 5);
      extras.add(
        FORMS.find(
          (form) => problems.filter((p) => p.given === form).length === 2,
        ),
      );
    }
    expect(extras.size).toBe(FORMS.length);
  });

  it('never gives zero as blocks', () => {
    for (let i = 0; i < 20; i++) {
      for (const { number, given } of generateProblems(FORMS, 'all', 201)) {
        if (number === 0) expect(given).not.toBe('blocks');
      }
    }
    const blocksOnly = generateProblems(['blocks'], 'all', 200);
    expect(blocksOnly.map((p) => p.number).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 200 }, (_, i) => i + 1),
    );
  });

  it('never gives a number with one place as expanded', () => {
    for (let i = 0; i < 20; i++) {
      for (const { number, given } of generateProblems(FORMS, 'all', 201)) {
        if (given === 'expanded') expect(expandedForm(number)).toContain(' + ');
      }
    }
    const expandedOnly = generateProblems(['expanded'], 'all', 180);
    const numbers = expandedOnly.map((p) => p.number).sort((a, b) => a - b);
    expect(numbers).toEqual(
      numbersIn('all').filter((n) => expandedForm(n).includes(' + ')),
    );
  });

  it('rejects more problems than there are numbers to give', () => {
    expect(() => generateProblems(FORMS, 'all', 202)).toThrow(RangeError);
    expect(() => generateProblems(FORMS, 'tyTeen', 18)).toThrow(RangeError);
    expect(() => generateProblems(['blocks'], 'all', 201)).toThrow(RangeError);
    expect(() => generateProblems(['expanded'], 'all', 181)).toThrow(
      RangeError,
    );
  });

  it('rejects a count that is not a whole number', () => {
    for (const count of [-1, 2.5, Number.NaN]) {
      expect(() => generateProblems(FORMS, 'all', count)).toThrow(RangeError);
    }
  });

  it('rejects an empty or unsupported choice of forms', () => {
    expect(() => generateProblems([], 'all', 4)).toThrow(RangeError);
    expect(() =>
      generateProblems([/** @type {any} */ ('tally')], 'all', 4),
    ).toThrow(RangeError);
  });
});
