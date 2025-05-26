import { describe, it, expect } from 'vitest';
import { parseWordList } from './utils.js';
import { generateRainbowColors, hslToHex } from './utils.js';

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

describe('Utils Functions', () => {
    describe('generateRainbowColors', () => {
        it('should generate the correct number of colors', () => {
            const colors = generateRainbowColors(7);
            expect(colors).toHaveLength(7);
        });

        it('should generate HSL color strings', () => {
            const colors = generateRainbowColors(3);
            colors.forEach(color => {
                expect(color).toMatch(/^hsl\(\d+, 70%, 70%\)$/);
            });
        });

        it('should use hardcoded hues for 7 segments (verb wheel case)', () => {
            const colors = generateRainbowColors(7);
            expect(colors[0]).toBe('hsl(0, 70%, 70%)');    // Red
            expect(colors[1]).toBe('hsl(15, 70%, 70%)');   // Red-orange
            expect(colors[2]).toBe('hsl(60, 70%, 70%)');   // Yellow
            expect(colors[3]).toBe('hsl(135, 70%, 70%)');  // Green
            expect(colors[4]).toBe('hsl(210, 70%, 70%)');  // Blue
            expect(colors[5]).toBe('hsl(240, 70%, 70%)');  // Blue-purple
            expect(colors[6]).toBe('hsl(330, 70%, 70%)');  // Magenta
        });

        it('should use hardcoded hues for smaller numbers of segments', () => {
            const colors3 = generateRainbowColors(3);
            expect(colors3[0]).toBe('hsl(210, 70%, 70%)');
            expect(colors3[1]).toBe('hsl(225, 70%, 70%)');
            expect(colors3[2]).toBe('hsl(240, 70%, 70%)');
        });

        it('should distribute hues evenly for more than 7 segments', () => {
            const colors = generateRainbowColors(8);
            expect(colors[0]).toBe('hsl(0, 70%, 70%)');
            expect(colors[1]).toBe('hsl(45, 70%, 70%)');
            expect(colors[2]).toBe('hsl(90, 70%, 70%)');
            expect(colors[3]).toBe('hsl(135, 70%, 70%)');
        });
    });

    describe('hslToHex', () => {
        it('should convert HSL to hex correctly', () => {
            expect(hslToHex(0, 100, 50)).toBe('#ff0000');   // Red
            expect(hslToHex(120, 100, 50)).toBe('#00ff00'); // Green
            expect(hslToHex(240, 100, 50)).toBe('#0000ff'); // Blue
        });

        it('should handle edge cases', () => {
            expect(hslToHex(0, 0, 0)).toBe('#000000');     // Black
            expect(hslToHex(0, 0, 100)).toBe('#ffffff');   // White
        });
    });
}); 