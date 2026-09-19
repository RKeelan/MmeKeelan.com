// The whole numbers from zero to two hundred, written out in words.

/**
 * @typedef {'en' | 'fr'} Language
 */

/**
 * The languages numbers can be written in.
 * @type {readonly Language[]}
 */
export const LANGUAGES = Object.freeze(['en', 'fr']);

/** The largest number that can be written out. */
export const MAX_NUMBER = 200;

const ENGLISH_UNITS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];

/** English multiples of ten, by their tens digit. */
const ENGLISH_TENS = [
  '',
  'ten',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
];

const FRENCH_UNITS = [
  'zéro',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize',
  'dix-sept',
  'dix-huit',
  'dix-neuf',
];

/** French multiples of ten up to sixty, by their tens digit. */
const FRENCH_TENS = [
  '',
  'dix',
  'vingt',
  'trente',
  'quarante',
  'cinquante',
  'soixante',
];

/**
 * English hundreds run straight into the rest of the number, with no "and".
 * @param {number} n A whole number from 0 to 200.
 * @returns {string}
 */
function english(n) {
  if (n >= 100) {
    const rest = n % 100;
    const hundreds = ENGLISH_UNITS[Math.floor(n / 100)] + ' hundred';
    return rest === 0 ? hundreds : hundreds + ' ' + english(rest);
  }
  if (n < 20) return ENGLISH_UNITS[n];
  const tens = ENGLISH_TENS[Math.floor(n / 10)];
  const ones = n % 10;
  return ones === 0 ? tens : tens + '-' + ENGLISH_UNITS[ones];
}

/**
 * French in the 1990 rectified spelling, which hyphenates every compound
 * number, "et" included.
 * @param {number} n A whole number from 0 to 200.
 * @returns {string}
 */
function french(n) {
  // "Cent" stands alone rather than taking "un" before it, and takes an "s"
  // only when it is counted and nothing follows it.
  if (n >= 100) {
    const count = Math.floor(n / 100);
    const rest = n % 100;
    const hundreds = count === 1 ? 'cent' : FRENCH_UNITS[count] + '-cent';
    if (rest === 0) return count === 1 ? hundreds : hundreds + 's';
    return hundreds + '-' + french(rest);
  }
  if (n === 80) return 'quatre-vingts';
  if (n < 20) return FRENCH_UNITS[n];

  // The seventies count on from sixty, and the eighties and nineties from
  // eighty, up to nineteen past it.
  let base;
  let rest;
  if (n < 70) {
    base = FRENCH_TENS[Math.floor(n / 10)];
    rest = n % 10;
  } else if (n < 80) {
    base = 'soixante';
    rest = n - 60;
  } else {
    base = 'quatre-vingt';
    rest = n - 80;
  }

  if (rest === 0) return base;
  // "Et" joins one, or eleven, to every base but eighty.
  const joiner =
    (rest === 1 || rest === 11) && base !== 'quatre-vingt' ? '-et-' : '-';
  return base + joiner + FRENCH_UNITS[rest];
}

/**
 * A whole number from 0 to MAX_NUMBER, written out in words.
 * @param {number} n
 * @param {Language} language
 * @returns {string}
 */
export function numberToWords(n, language) {
  if (!Number.isInteger(n) || n < 0 || n > MAX_NUMBER) {
    throw new RangeError(
      'n must be a whole number from 0 to ' + MAX_NUMBER + ', got ' + n,
    );
  }
  if (language === 'en') return english(n);
  if (language === 'fr') return french(n);
  throw new RangeError('Unsupported language: ' + language);
}
