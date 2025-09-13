import '../css/styles.css';
import { StringReel } from './string-reel.js';

// Language data - Pronouns (use English as base, translate via translations object)
/** @type {string[]} */
const englishPronouns = ["I", "You", "He", "She", "We Informal", "We Formal", "You Plural/Formal", "They Masculine", "They Feminine"];

// Verb-Object relationships in English
/** @type {Object.<string, string[]>} */
const verbObjectMap = {
    "have": [
        "a calculator", "a board", "a garbage can", "a computer", "a student", 
        "a ruler", "a shelf", "a calendar", "a poster", "a table", 
        "a window", "a dictionary", "a recycling bin", "a desk", "a marker", 
        "a teacher (male)", "a teacher (female)", "a pencil case", "a stapler", "scissors", 
        "a notebook", "a book", "a backpack", "a pen", "a pencil", 
        "a door", "a student desk", "a screen", "a clock", "glue", 
        "an agenda", "headphones", "a pencil sharpener", "an eraser", "a corridor", "a hallway"
    ]
};

// Translation mapping from English to French
/** @type {Object.<string, string>} */
const translations = {
    // Pronouns
    "I": "Je",
    "You": "Tu", 
    "He": "Il",
    "She": "Elle",
    "We Informal": "On",
    "We Formal": "Nous",
    "You Plural/Formal": "Vous",
    "They Masculine": "Ils",
    "They Feminine": "Elles",
    
    // Verbs
    "have": "avoir",
    
    // Objects for "have" - classroom vocabulary
    "a calculator": "une calculatrice",
    "a board": "un tableau",
    "a garbage can": "une poubelle",
    "a computer": "un ordinateur",
    "a student": "un élève",
    "a ruler": "une règle",
    "a shelf": "une étagère",
    "a calendar": "un calendrier",
    "a poster": "une affiche",
    "a table": "une table",
    "a window": "une fenêtre",
    "a dictionary": "un dictionnaire",
    "a recycling bin": "un bac de recyclage",
    "a desk": "un bureau",
    "a marker": "un marqueur",
    "a teacher (male)": "un enseignant",
    "a teacher (female)": "une enseignante",
    "a pencil case": "une trousse de crayon",
    "a stapler": "une agrafeuse",
    "scissors": "des ciseaux",
    "a notebook": "un cahier",
    "a book": "un livre",
    "a backpack": "un cartable",
    "a pen": "un stylo",
    "a pencil": "un crayon",
    "a door": "une porte",
    "a student desk": "un pupitre",
    "a screen": "un écran",
    "a clock": "une horloge",
    "glue": "de la colle",
    "an agenda": "un agenda",
    "headphones": "des écouteurs",
    "a pencil sharpener": "un taille-crayon",
    "an eraser": "une gomme à effacer",
    "a corridor": "un corridor",
    "a hallway": "un couloir"
};

// DOM Elements
const subjectReelElement = /** @type {HTMLElement} */ (document.getElementById('subject-reel'));
if (!subjectReelElement) throw new Error('subject-reel element not found');

const verbReelElement = /** @type {HTMLElement} */ (document.getElementById('verb-reel'));
if (!verbReelElement) throw new Error('verb-reel element not found');

const objectReelElement = /** @type {HTMLElement} */ (document.getElementById('object-reel'));
if (!objectReelElement) throw new Error('object-reel element not found');

const languageToggle = /** @type {HTMLButtonElement} */ (document.getElementById('language-toggle'));
if (!languageToggle) throw new Error('language-toggle element not found');

const timerDisplay = /** @type {HTMLElement} */ (document.getElementById('timer'));
if (!timerDisplay) throw new Error('timer element not found');

const spinButton = /** @type {HTMLButtonElement} */ (document.getElementById('spin-button'));
if (!spinButton) throw new Error('spin-button element not found');

// State
/** @type {boolean} */
let isEnglishMode = true; // Default to English
/** @type {number|null} */
let timerIntervalId = null;
/** @type {number} */
let timeLeft = 10;
/** @type {Object.<string, string[]>} */
let workingVerbObjectMap = JSON.parse(JSON.stringify(verbObjectMap)); // Deep copy to avoid repetition
/** @type {boolean} */
let allObjectsExhausted = false;

// Constants
/** @type {number} */
const TIMER_DURATION = 10;

// Helper functions to get arrays for reels
/** @param {boolean} isEnglish */
function getPronounArray(isEnglish) {
    return isEnglish ? englishPronouns : englishPronouns.map(pronoun => translations[pronoun]);
}

/** @param {boolean} isEnglish */
function getVerbArray(isEnglish) {
    const verbs = Object.keys(verbObjectMap);
    return isEnglish ? verbs : verbs.map(verb => translations[verb]);
}

/** 
 * @param {boolean} isEnglish 
 * @param {string|null} verb 
 */
function getObjectArray(isEnglish, verb = null) {
    if (!verb) {
        // Get all objects from all verbs in working copy
        const allObjects = Object.values(workingVerbObjectMap).flat();
        return isEnglish ? allObjects : allObjects.map(obj => translations[obj]);
    }
    
    const objects = workingVerbObjectMap[verb] || [];
    return isEnglish ? objects : objects.map(obj => translations[obj]);
}

// Initialize the reels (starting with English)
const subjectReel = new StringReel(subjectReelElement, getPronounArray(true), {
    itemClassName: 'reel-item',
    itemHeight: 60
});

const verbReel = new StringReel(verbReelElement, getVerbArray(true), {
    itemClassName: 'reel-item',
    itemHeight: 60
});

const objectReel = new StringReel(objectReelElement, getObjectArray(true), {
    itemClassName: 'reel-item',
    itemHeight: 60
});

/**
 * Starts the countdown timer with color changes
 * @returns {void}
 */
function startTimer() {
    if (timerIntervalId) {
        clearInterval(timerIntervalId);
    }
    timeLeft = TIMER_DURATION;
    timerDisplay.textContent = String(timeLeft);
    timerDisplay.style.color = 'green';

    timerIntervalId = /** @type {any} */ (setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = String(timeLeft);
        if (timeLeft <= 5 && timeLeft > 3) {
            timerDisplay.style.color = 'orange';
        } else if (timeLeft <= 3 && timeLeft >= 0) {
            timerDisplay.style.color = 'red';
        }
        if (timeLeft < 0) {
            if (timerIntervalId) clearInterval(timerIntervalId);
            timerDisplay.textContent = "Temps écoulé!";
        }
    }, 1000));
}

// Update toggle appearance based on current state
function updateToggleAppearance() {
    const slider = languageToggle.querySelector('.toggle-slider');
    const button = languageToggle.querySelector('.toggle-button');
    const leftLabel = languageToggle.querySelector('.toggle-label.left');
    const rightLabel = languageToggle.querySelector('.toggle-label.right');
    
    if (isEnglishMode) {
        slider?.classList.remove('active');
        button?.classList.remove('active');
        leftLabel?.classList.add('active');
        rightLabel?.classList.remove('active');
    } else {
        slider?.classList.add('active');
        button?.classList.add('active');
        leftLabel?.classList.remove('active');
        rightLabel?.classList.add('active');
    }
}

// Initialize toggle appearance
updateToggleAppearance();

// Language toggle functionality
languageToggle.addEventListener('click', () => {
    isEnglishMode = !isEnglishMode;
    
    if (isEnglishMode) {
        subjectReel.updateItems(getPronounArray(true));
        verbReel.updateItems(getVerbArray(true));
        objectReel.updateItems(getObjectArray(true));
    } else {
        subjectReel.updateItems(getPronounArray(false));
        verbReel.updateItems(getVerbArray(false));
        objectReel.updateItems(getObjectArray(false));
    }
    
    updateToggleAppearance();
    updateLabels();
});

// Function to update SVO labels based on language
function updateLabels() {
    const subjectLabel = document.querySelector('#subject-slot-container h3');
    const verbLabel = document.querySelector('#verb-slot-container h3');
    const objectLabel = document.querySelector('#object-slot-container h3');
    
    if (isEnglishMode) {
        if (subjectLabel) subjectLabel.textContent = 'Subject';
        if (verbLabel) verbLabel.textContent = 'Verb';
        if (objectLabel) objectLabel.textContent = 'Object';
    } else {
        if (subjectLabel) subjectLabel.textContent = 'Sujet';
        if (verbLabel) verbLabel.textContent = 'Verbe';
        if (objectLabel) objectLabel.textContent = 'Objet';
    }
}

// Initialize labels
updateLabels();

// Spin button functionality
spinButton.addEventListener('click', () => {
    // Stop any existing timer
    if (timerIntervalId) {
        clearInterval(timerIntervalId);
        timerIntervalId = null;
    }
    
    // Check if all objects have been exhausted and show completion message
    if (allObjectsExhausted) {
        const completionMessage = isEnglishMode ? "All done!" : "Tous finis!";
        
        // Show completion message in timer display instead of countdown
        timerDisplay.textContent = completionMessage;
        timerDisplay.style.background = 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #f9ca24, #f0932b, #eb4d4b, #6c5ce7)';
        timerDisplay.style.backgroundSize = '400% 400%';
        timerDisplay.style.animation = 'rainbow 2s ease infinite';
        timerDisplay.style.color = '#fff';
        timerDisplay.style.fontWeight = 'bold';
        timerDisplay.style.textShadow = '2px 2px 4px rgba(0,0,0,0.3)';
        timerDisplay.style.padding = '10px';
        timerDisplay.style.borderRadius = '10px';
        return;
    }
    
    // Generate random selections - choose verb first, then compatible object
    const subjects = getPronounArray(isEnglishMode);
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    
    // Choose random verb (from English keys, then translate if needed)
    const englishVerbs = Object.keys(workingVerbObjectMap);
    const randomEnglishVerb = englishVerbs[Math.floor(Math.random() * englishVerbs.length)];
    const randomVerb = isEnglishMode ? randomEnglishVerb : translations[randomEnglishVerb];
    
    // Choose random object that goes with this verb and remove it from working copy
    const compatibleObjects = workingVerbObjectMap[randomEnglishVerb];
    const randomIndex = Math.floor(Math.random() * compatibleObjects.length);
    const randomEnglishObject = compatibleObjects[randomIndex];
    const randomObject = isEnglishMode ? randomEnglishObject : translations[randomEnglishObject];
    
    // Remove the chosen object from working copy to avoid repetition
    compatibleObjects.splice(randomIndex, 1);
    
    // Check if all objects are now exhausted
    const totalObjectsRemaining = Object.values(workingVerbObjectMap).reduce((sum, objects) => sum + objects.length, 0);
    if (totalObjectsRemaining === 0) {
        allObjectsExhausted = true;
    }
    
    // Animate all reels
    subjectReel.animateTo(randomSubject);
    verbReel.animateTo(randomVerb);
    objectReel.animateTo(randomObject);
    
    // Start timer after a brief delay to let animations begin
    setTimeout(startTimer, 500);
});