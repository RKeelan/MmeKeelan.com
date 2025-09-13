import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StringReel } from './string-reel.js';

describe('StringReel', () => {
    /** @type {any} */
    let mockElement;
    /** @type {string[]} */
    let testItems;

    beforeEach(() => {
        // Mock DOM element
        mockElement = {
            innerHTML: '',
            style: {},
            appendChild: vi.fn(),
            children: []
        };
        
        testItems = ['Item 1', 'Item 2', 'Item 3', 'Item 4'];
    });

    describe('Constructor and Initialization', () => {
        it('should initialize with default options', () => {
            const reel = new StringReel(mockElement, testItems);
            
            expect(reel.element).toBe(mockElement);
            expect(reel.items).toEqual(testItems);
            expect(reel.options.itemHeight).toBe(80);
            expect(reel.options.additionalSets).toBe(3);
            expect(reel.options.animationDuration).toBe(2500);
            expect(reel.options.itemClassName).toBe('reel-item');
        });

        it('should initialize with custom options', () => {
            const customOptions = {
                itemHeight: 100,
                additionalSets: 2,
                animationDuration: 3000,
                itemClassName: 'custom-item'
            };
            
            const reel = new StringReel(mockElement, testItems, customOptions);
            
            expect(reel.options.itemHeight).toBe(100);
            expect(reel.options.additionalSets).toBe(2);
            expect(reel.options.animationDuration).toBe(3000);
            expect(reel.options.itemClassName).toBe('custom-item');
        });

        it('should create correct number of DOM elements', () => {
            new StringReel(mockElement, testItems);
            
            // Should create (additionalSets + 1) * items.length elements
            // Default: (3 + 1) * 4 = 16 elements
            expect(mockElement.appendChild).toHaveBeenCalledTimes(16);
        });
    });

    describe('Position Calculations', () => {
        it('should calculate target position correctly', () => {
            const itemHeight = 80;
            
            // Test position calculation for "Tu" (index 1)
            const pronounIndex = 1;
            const targetPosition = -(pronounIndex * itemHeight);
            
            expect(targetPosition).toBe(-80);
        });

        it('should calculate extended set position correctly', () => {
            const itemHeight = 80;
            const additionalSets = 3;
            const numItems = 6; // Length of pronoun array
            
            const pronounIndex = 1; // "Tu"
            const targetPosition = -(pronounIndex * itemHeight);
            const targetInSecondSet = targetPosition - (additionalSets * numItems * itemHeight);
            
            expect(targetInSecondSet).toBe(-80 - (3 * 6 * 80));
            expect(targetInSecondSet).toBe(-1520);
        });
    });

    describe('Animation Methods', () => {
        it('should animate to a valid string', () => {
            const reel = new StringReel(mockElement, testItems);
            
            reel.animateTo('Item 2');
            
            // Should set transform to animate to Item 2 (index 1)
            expect(mockElement.style.transform).toContain('translateY');
        });

        it('should handle invalid string gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const reel = new StringReel(mockElement, testItems);
            
            reel.animateTo('Invalid Item');
            
            expect(consoleSpy).toHaveBeenCalledWith('String "Invalid Item" not found in reel items');
            consoleSpy.mockRestore();
        });

        it('should return selected string from animateToRandom', () => {
            const reel = new StringReel(mockElement, testItems);
            
            const selected = reel.animateToRandom();
            
            expect(testItems).toContain(selected);
        });
    });

    describe('Item Management', () => {
        it('should find correct item indices', () => {
            const pronouns = ['Je', 'Tu', 'Il/Elle/On', 'Nous', 'Vous', 'Ils/Elles'];
            
            expect(pronouns.indexOf('Je')).toBe(0);
            expect(pronouns.indexOf('Tu')).toBe(1);
            expect(pronouns.indexOf('Il/Elle/On')).toBe(2);
            expect(pronouns.indexOf('Nous')).toBe(3);
            expect(pronouns.indexOf('Vous')).toBe(4);
            expect(pronouns.indexOf('Ils/Elles')).toBe(5);
            expect(pronouns.indexOf('Invalid')).toBe(-1);
        });

        it('should update items correctly', () => {
            const reel = new StringReel(mockElement, testItems);
            const newItems = ['New 1', 'New 2', 'New 3'];
            
            // Reset mock calls
            mockElement.appendChild.mockClear();
            
            reel.updateItems(newItems);
            
            expect(reel.items).toEqual(newItems);
            // Should create new elements for updated items
            // (additionalSets + 1) * newItems.length = 4 * 3 = 12
            expect(mockElement.appendChild).toHaveBeenCalledTimes(12);
        });
    });

    describe('Configuration Options', () => {
        it('should use correct item height', () => {
            const customHeight = 100;
            const reel = new StringReel(mockElement, testItems, { itemHeight: customHeight });
            
            expect(reel.options.itemHeight).toBe(customHeight);
        });

        it('should use correct CSS class name', () => {
            const customClass = 'pronoun-item';
            const reel = new StringReel(mockElement, testItems, { itemClassName: customClass });
            
            expect(reel.options.itemClassName).toBe(customClass);
        });

        it('should use correct animation duration', () => {
            const customDuration = 3000;
            const reel = new StringReel(mockElement, testItems, { animationDuration: customDuration });
            
            expect(reel.options.animationDuration).toBe(customDuration);
        });

        it('should use correct number of additional sets', () => {
            const customSets = 5;
            const reel = new StringReel(mockElement, testItems, { additionalSets: customSets });
            
            expect(reel.options.additionalSets).toBe(customSets);
            // Should create (customSets + 1) * items.length elements
            // (5 + 1) * 4 = 24 elements
            expect(mockElement.appendChild).toHaveBeenCalledTimes(24);
        });
    });

    describe('getCurrentString method', () => {
        it('should return first item when no transform is set', () => {
            const reel = new StringReel(mockElement, testItems);
            
            const current = reel.getCurrentString();
            
            expect(current).toBe('Item 1');
        });

        it('should parse translateY transform correctly', () => {
            const reel = new StringReel(mockElement, testItems);
            mockElement.style.transform = 'translateY(-160px)';
            
            const current = reel.getCurrentString();
            
            // -160px / 80px height = index 2, which is 'Item 3'
            expect(current).toBe('Item 3');
        });
    });
});