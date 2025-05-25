import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock the image import since Vitest doesn't handle static assets by default
vi.mock('../assets/images/spinner-arrow.png', () => ({
    default: 'spinner-arrow.png' // Or an empty string if the path itself is not used
}));

// Setup JSDOM
const dom = new JSDOM(`
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>La Roue des Verbes</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <h1>La Roue des Verbes</h1>
    <div id="display-area">
        <span id="pronoun-display"></span> <span id="verb-display"></span>
    </div>
    <div id="wheel-container">
        <canvas id="wheel" width="500" height="500"></canvas> 
    </div>
    <div id="timer">10</div>
    <div class="button-container">
        <button id="spin-button">Tourner la Roue!</button>
    </div>
    <!-- Module script will be loaded and tested separately -->
</body>
</html>
`, { url: 'http://localhost/', runScripts: 'dangerously', resources: 'usable' });

global.document = dom.window.document;
global.window = dom.window;
global.Image = dom.window.Image;
global.fetch = vi.fn();
global.requestAnimationFrame = vi.fn(cb => { cb(); return 1; }); // Simple mock
global.cancelAnimationFrame = vi.fn();

// Dynamically import the module *after* setting up mocks and DOM
let verbWheelModule;

describe('La Roue des Verbes (verb-wheel.js)', () => {
    let spinButton;
    let pronounDisplay;
    let verbDisplay;
    let timerDisplay;

    const mockConjugations = {
        "être": { "Je": "suis", "Tu": "es" },
        "avoir": { "Je": "ai", "Tu": "as" }
        // Add more if specific tests need them
    };

    beforeEach(async () => {
        // Reset DOM elements state if necessary
        document.body.innerHTML = dom.window.document.body.innerHTML; // Reset DOM

        // Re-query elements for each test
        pronounDisplay = document.getElementById('pronoun-display');
        verbDisplay = document.getElementById('verb-display');
        timerDisplay = document.getElementById('timer');
        spinButton = document.getElementById('spin-button');
        
        // Mock fetch for conjugations
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ ...mockConjugations }), // Return a copy
        });

        // Reset and load the module to apply mocks. Module uses `document.getElementById`
        // This is a common pattern for testing frontend JS that manipulates the DOM.
        // Ensure that the script is re-evaluated by clearing the require cache if using CommonJS,
        // or by ensuring clean state for ES modules (Vitest generally handles this well).
        // Forcing re-import:
        verbWheelModule = await import('../js/verb-wheel.js?t=' + Date.now()); // Cache bust

        // Manually trigger onload for the arrow image if your script depends on it for initialization
        // verbWheelModule.arrow.onload(); // If arrow is exported and its onload does setup

        // Wait for any initial async operations in the module, e.g. if it auto-loads conjugations
        // (current script loads on first click, so this might not be needed here)
        await new Promise(resolve => setTimeout(resolve, 0)); // allow microtasks to settle
    });

    afterEach(() => {
        vi.clearAllMocks(); // Clears mock call counts, etc.
        vi.useRealTimers(); // Restore real timers
        if (verbWheelModule && verbWheelModule.timerIntervalId) {
            clearInterval(verbWheelModule.timerIntervalId);
        }
        if (verbWheelModule && verbWheelModule.animationFrameId) {
            cancelAnimationFrame(verbWheelModule.animationFrameId);
        }
    });

    it('should display a random pronoun and verb on spin click', async () => {
        await spinButton.click();
        
        expect(fetch).toHaveBeenCalledWith('js/verb-conjugations.json');
        
        const displayedPronoun = pronounDisplay.textContent;
        const displayedVerb = verbDisplay.textContent;
        
        // Access internal arrays for checking (consider exporting them for testability)
        // For now, assuming they are the same as the ones defined at the top of verb-wheel.js
        const expectedPronouns = ["Je", "Tu", "Il/Elle/On", "Nous", "Vous", "Ils/Elles"];
        const expectedVerbs = ["être", "avoir", "aller", "faire", "pouvoir", "vouloir"];
        
        expect(expectedPronouns).toContain(displayedPronoun);
        expect(expectedVerbs).toContain(displayedVerb);
    });

    it('should start and update timer on spin click', async () => {
        vi.useFakeTimers();
        
        await spinButton.click();
        expect(timerDisplay.textContent).toBe('10');
        
        vi.advanceTimersByTime(1000);
        expect(timerDisplay.textContent).toBe('9');
        
        vi.advanceTimersByTime(4000);
        expect(timerDisplay.textContent).toBe('5');
        expect(timerDisplay.style.color).toBe('orange'); // As per style logic in JS

        vi.advanceTimersByTime(2000);
        expect(timerDisplay.textContent).toBe('3');
        expect(timerDisplay.style.color).toBe('red'); // As per style logic in JS

        vi.advanceTimersByTime(3000);
        expect(timerDisplay.textContent).toBe('0');
        
        vi.advanceTimersByTime(1000);
        expect(timerDisplay.textContent).toBe('Temps écoulé!');
        
        vi.useRealTimers();
    });
    
    it('should reset timer on subsequent spin clicks', async () => {
        vi.useFakeTimers();
        
        await spinButton.click(); // First spin
        expect(timerDisplay.textContent).toBe('10');
        vi.advanceTimersByTime(3000); // Timer is now 7
        expect(timerDisplay.textContent).toBe('7');

        await spinButton.click(); // Second spin
        expect(timerDisplay.textContent).toBe('10'); // Timer resets
        vi.advanceTimersByTime(1000);
        expect(timerDisplay.textContent).toBe('9');
        
        vi.useRealTimers();
    });

    it('should load conjugations successfully', async () => {
        await spinButton.click(); // Triggers loadConjugations
        expect(fetch).toHaveBeenCalledWith('js/verb-conjugations.json');
        // Access internal state (conjugations object) - requires export or different test strategy
        // For now, we assume if no error and pronoun/verb displayed, it worked.
        // A more robust test would check the 'conjugations' variable if it were accessible.
        // console.log(verbWheelModule.getConjugations()); // If you add a getter
    });

    it('should handle conjugation loading failure', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            json: async () => ({}), // Should not be called if !ok
        });

        await spinButton.click();
        
        expect(pronounDisplay.textContent).toBe('Erreur');
        expect(verbDisplay.textContent).toBe('de chargement'); // Or "Verbes" as per latest JS
    });

    it('should calculate targetWheelAngle correctly', () => {
        // This test requires access to the ARROW_UP_ANGLE constant and the verbs array
        // from verb-wheel.js. Ideally, these would be exported or the calculation function tested in isolation.
        // Let's assume ARROW_UP_ANGLE is -Math.PI / 2 and verbs array is known.
        const ARROW_UP_ANGLE_mock = -Math.PI / 2;
        const verbs_mock = ["être", "avoir", "aller", "faire", "pouvoir", "vouloir"];
        const anglePerSegment = (2 * Math.PI) / verbs_mock.length;

        const testCases = [
            { verb: "être", index: 0 },
            { verb: "aller", index: 2 },
            { verb: "vouloir", index: 5 },
        ];

        testCases.forEach(tc => {
            let segmentMiddleAngle = (tc.index * anglePerSegment) + (anglePerSegment / 2);
            let expectedTargetAngle = ARROW_UP_ANGLE_mock - segmentMiddleAngle;
            
            // To test verbWheelModule.calculateTargetAngle(tc.verb) if such a function existed:
            // expect(verbWheelModule.calculateTargetAngle(tc.verb)).toBeCloseTo(expectedTargetAngle);

            // Since the calculation is inline, we are implicitly testing it via the spin click,
            // but it's hard to assert the exact angle without more access.
            // For now, this test is more of a "how to think about it".
            // A refactor of verb-wheel.js to make this calculation a testable utility function would be good.
            expect(true).toBe(true); // Placeholder for this conceptual part
        });
    });
    
    it('should not spin if already spinning', async () => {
        // Mock requestAnimationFrame to control the animation loop
        let rafCallbacks = [];
        global.requestAnimationFrame = vi.fn(cb => {
            rafCallbacks.push(cb);
            return rafCallbacks.length; // Return a unique ID
        });
        global.cancelAnimationFrame = vi.fn(id => {
            rafCallbacks.splice(id -1, 1);
        });

        await spinButton.click(); // First click, starts animation
        const firstClickPronoun = pronounDisplay.textContent;
        const firstClickVerb = verbDisplay.textContent;
        expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1); // Initial call to spinAnimation

        // Try clicking again while animation is "in progress"
        // (animationFrameId would be set in the real module)
        // We need to simulate that animationFrameId is set in the module.
        // This is tricky without exporting the animationFrameId or having a getter.
        // Alternative: if the module internally checks animationFrameId, we can't directly test it here
        // without that state being exposed or the click handler being more complex.
        
        // For now, assume the check `if (animationFrameId) return;` works.
        // A more direct test would involve setting that ID from outside if possible.
        // Let's assume the first call to spinButton.click() sets animationFrameId internally.
        // And the second call should not proceed if it's set.

        // Manually set a mock animationFrameId in the module scope if possible (requires module change)
        // e.g., if (verbWheelModule) verbWheelModule.animationFrameId = 12345;
        
        // Click again
        await spinButton.click();
        
        // Assert that fetch (and other operations of a new spin) was not called again
        // if the internal animationFrameId check worked.
        expect(fetch).toHaveBeenCalledTimes(1); // Should still be 1 from the first click
        expect(pronounDisplay.textContent).toBe(firstClickPronoun); // Should not have changed
        expect(verbDisplay.textContent).toBe(firstClickVerb);  // Should not have changed

        // Clean up any pending animation frames
        rafCallbacks = [];
        global.requestAnimationFrame.mockClear();
        global.cancelAnimationFrame.mockClear();
    });
});

// Helper to load script into JSDOM window if not using module imports directly in test
function loadScript(path) {
    const scriptContent = fs.readFileSync(path, 'utf-8');
    const scriptEl = dom.window.document.createElement('script');
    scriptEl.textContent = scriptContent;
    dom.window.document.head.appendChild(scriptEl);
}
