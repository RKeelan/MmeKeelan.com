/**
 * Parse a comma or space-separated list of words
 * @param {string} input - The input string to parse
 * @returns {string[]} - Array of parsed words
 */
export function parseWordList(input) {
  if (!input || typeof input !== 'string') {
    return [];
  }
  return input.split(/[\s,]+/).filter(word => word.trim().length > 0);
}

/**
 * Generates rainbow colors for a given number of segments
 * Uses the same color scheme as the roulette wheel for consistency
 * @param {number} numSegments - Number of color segments needed
 * @returns {string[]} Array of HSL color strings
 */
export function generateRainbowColors(numSegments) {
    let hues = [];
    
    // Use the same special handling as roulette.js for 7 and fewer segments
    switch(numSegments) {
        case 1: hues = [225]; break;
        case 2: hues = [210, 225]; break;
        case 3: hues = [210, 225, 240]; break;
        case 4: hues = [195, 210, 225, 240]; break;
        case 5: hues = [195, 210, 225, 240, 255]; break;
        case 6: hues = [180, 195, 210, 225, 240, 255]; break; 
        case 7: hues = [0, 15, 60, 135, 210, 240, 330]; break;
        default:
            // For more than 7 segments, distribute evenly across the spectrum
            hues = Array.from({ length: numSegments }, (_, i) => i * 360 / numSegments);
            break;
    }
    
    const colors = [];
    for (let i = 0; i < numSegments; i++) {
        const color = `hsl(${hues[i]}, 70%, 70%)`;
        colors.push(color);
    }
    
    return colors;
}

/**
 * Converts HSL to hex color format
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} Hex color string
 */
export function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
} 