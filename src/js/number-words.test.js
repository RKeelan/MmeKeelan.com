import { describe, it, expect } from 'vitest';
import { LANGUAGES, MAX_NUMBER, numberToWords } from './number-words.js';

/**
 * @param {import('./number-words.js').Language} language
 * @param {Record<number, string>} cases
 */
function expectWords(language, cases) {
  for (const [n, words] of Object.entries(cases)) {
    expect(numberToWords(Number(n), language), n).toBe(words);
  }
}

describe('LANGUAGES', () => {
  it('lists English and French', () => {
    expect([...LANGUAGES]).toEqual(['en', 'fr']);
  });
});

describe('numberToWords', () => {
  it('writes every number differently', () => {
    for (const language of LANGUAGES) {
      const words = new Set();
      for (let n = 0; n <= MAX_NUMBER; n++) {
        words.add(numberToWords(n, language));
      }
      expect(words.size).toBe(MAX_NUMBER + 1);
    }
  });

  it('writes English numbers', () => {
    expectWords('en', {
      0: 'zero',
      7: 'seven',
      10: 'ten',
      11: 'eleven',
      13: 'thirteen',
      19: 'nineteen',
      20: 'twenty',
      21: 'twenty-one',
      30: 'thirty',
      40: 'forty',
      45: 'forty-five',
      55: 'fifty-five',
      80: 'eighty',
      99: 'ninety-nine',
      100: 'one hundred',
    });
  });

  it('writes French numbers in the rectified spelling', () => {
    expectWords('fr', {
      0: 'zéro',
      1: 'un',
      10: 'dix',
      16: 'seize',
      17: 'dix-sept',
      19: 'dix-neuf',
      20: 'vingt',
      21: 'vingt-et-un',
      22: 'vingt-deux',
      31: 'trente-et-un',
      41: 'quarante-et-un',
      55: 'cinquante-cinq',
      61: 'soixante-et-un',
      69: 'soixante-neuf',
      70: 'soixante-dix',
      71: 'soixante-et-onze',
      72: 'soixante-douze',
      77: 'soixante-dix-sept',
      80: 'quatre-vingts',
      81: 'quatre-vingt-un',
      89: 'quatre-vingt-neuf',
      90: 'quatre-vingt-dix',
      91: 'quatre-vingt-onze',
      97: 'quatre-vingt-dix-sept',
      99: 'quatre-vingt-dix-neuf',
      100: 'cent',
    });
  });

  it('rejects numbers outside 0 to 100', () => {
    for (const n of [-1, 101, 2.5, Number.NaN]) {
      expect(() => numberToWords(n, 'en')).toThrow(RangeError);
    }
  });

  it('rejects an unsupported language', () => {
    expect(() => numberToWords(5, /** @type {any} */ ('es'))).toThrow(
      RangeError,
    );
  });
});
