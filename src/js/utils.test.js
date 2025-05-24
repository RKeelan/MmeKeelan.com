import { describe, it, expect } from 'vitest';
import { parseWordList } from './utils.js';

describe('parseWordList', () => {
  it('should parse comma-separated words', () => {
    expect(parseWordList('apple, banana, cherry')).toEqual(['apple', 'banana', 'cherry']);
  });

  it('should parse space-separated words', () => {
    expect(parseWordList('apple banana cherry')).toEqual(['apple', 'banana', 'cherry']);
  });

  it('should parse mixed separators', () => {
    expect(parseWordList('apple, banana   cherry,orange')).toEqual(['apple', 'banana', 'cherry', 'orange']);
  });

  it('should handle empty input', () => {
    expect(parseWordList('')).toEqual([]);
    expect(parseWordList(null)).toEqual([]);
    expect(parseWordList(undefined)).toEqual([]);
  });

  it('should handle non-string input', () => {
    expect(parseWordList(123)).toEqual([]);
    expect(parseWordList({})).toEqual([]);
  });

  it('should filter out empty words', () => {
    expect(parseWordList('apple,  , banana,  ,cherry')).toEqual(['apple', 'banana', 'cherry']);
  });

  it('should trim whitespace from words', () => {
    expect(parseWordList(' apple , banana , cherry ')).toEqual(['apple', 'banana', 'cherry']);
  });
}); 