import '../css/styles.css'; // General styles
import arrowImg from '../assets/images/spinner-arrow.png';
import { generateRainbowColors } from './utils.js';

/** @type {string[]} */
const verbs = ["être", "avoir", "aller", "faire", "pouvoir", "vouloir", "savoir"];
/** @type {string[]} */
const pronouns = ["Je", "Tu", "Il/Elle/On", "Nous", "Vous", "Ils/Elles"];

// Generate rainbow colors for the wheel segments
/** @type {string[]} */
const segmentColors = generateRainbowColors(verbs.length);

// DOM Elements
/** @type {HTMLElement} */
const pronounReel = document.getElementById('pronoun-reel');
/** @type {HTMLElement} */
const timerDisplay = document.getElementById('timer');
/** @type {HTMLButtonElement} */
const spinButton = document.getElementById('spin-button');
/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('wheel');
/** @type {CanvasRenderingContext2D} */
const context = canvas.getContext('2d');

/** @type {number} */
let currentWheelAngle = 0; // Current rotation angle of the wheel
/** @type {number} */
let targetWheelAngle = 0;   // Target rotation angle for the wheel
/** @type {number|null} */
let animationFrameId = null;
/** @type {number|null} */
let timerIntervalId = null;
/** @type {number} */
let timeLeft = 10;
/** @type {string} */
let selectedPronoun = '';
/** @type {string} */
let selectedVerb = '';

/** @type {HTMLImageElement} */
const arrow = new Image();
arrow.src = arrowImg;

// Angle for the arrow to point upwards, assuming original image points right
/** @type {number} */
const ARROW_UP_ANGLE = -Math.PI / 2;

// Constants for better maintainability
/** @type {number} */
const TIMER_DURATION = 10;
/** @type {number} */
const ROTATION_SPEED_FACTOR = 0.05;
/** @type {number} */
const MIN_ROTATIONS = 3;
/** @type {number} */
const MAX_ADDITIONAL_ROTATIONS = 3;
/** @type {number} */
const CANVAS_PADDING = 10;
/** @type {number} */
const TEXT_RADIUS_FACTOR = 0.65;
/** @type {number} */
const ANIMATION_DURATION = 2500; // Duration for both wheel and pronoun animations

arrow.onload = () => {
    drawWheelAndArrow(); // Initial draw
    // Initialize pronoun reel to show first pronoun
    pronounReel.style.transform = 'translateY(0px)';
};

/**
 * Draws the wheel segments with verbs
 * @returns {void}
 */
function drawWheelSegments() {
    const numSegments = verbs.length;
    const anglePerSegment = (2 * Math.PI) / numSegments;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - CANVAS_PADDING;

    context.font = '16px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    verbs.forEach((verb, index) => {
        const angleOffset = Math.PI + (anglePerSegment / 2);
        const startAngle = index * anglePerSegment + angleOffset;
        const endAngle = (index + 1) * anglePerSegment + angleOffset;

        context.beginPath();
        context.moveTo(centerX, centerY);
        context.arc(centerX, centerY, radius, startAngle, endAngle);
        context.closePath();

        context.fillStyle = segmentColors[index % segmentColors.length];
        context.fill();
        context.strokeStyle = '#a0a0a0';
        context.stroke();

        context.save();
        context.translate(centerX, centerY);
        
        const textAngle = startAngle + anglePerSegment + Math.PI - (anglePerSegment / 2);
        context.rotate(textAngle);
        
        context.fillStyle = '#000000';
        const textRadius = radius * TEXT_RADIUS_FACTOR; 
        context.fillText(verb, -textRadius, 0);
        context.restore();
    });
}

/**
 * Draws the arrow pointing to the wheel (now in center)
 * @returns {void}
 */
function drawArrow() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    context.save();
    context.translate(centerX, centerY);
    context.rotate(ARROW_UP_ANGLE); // Make arrow point up
    
    // Draw arrow in the center of the wheel
    context.drawImage(arrow, -arrow.width / 2, -arrow.height / 2, arrow.width, arrow.height);
    context.restore();
}

/**
 * Draws both the wheel and arrow
 * @returns {void}
 */
function drawWheelAndArrow() {
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

    // Rotate wheel
    context.save();
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(currentWheelAngle); // Apply current rotation to the wheel
    context.translate(-canvas.width / 2, -canvas.height / 2);
    drawWheelSegments(); // Draw the segments in their (now rotated) positions
    context.restore();

    drawArrow(); // Draw the static arrow on top
}

/**
 * Animates the wheel spinning with easing
 * @returns {void}
 */
function spinAnimation() {
    const difference = targetWheelAngle - currentWheelAngle;

    if (Math.abs(difference) < 0.001) { // Threshold for stopping
        currentWheelAngle = targetWheelAngle;
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        // Start timer only after wheel stops spinning
        startTimer();
    } else {
        currentWheelAngle += difference * ROTATION_SPEED_FACTOR;
        animationFrameId = requestAnimationFrame(spinAnimation);
    }
    drawWheelAndArrow();
}

/**
 * Starts the countdown timer with color changes
 * @returns {void}
 */
function startTimer() {
    if (timerIntervalId) {
        clearInterval(timerIntervalId);
    }
    timeLeft = TIMER_DURATION;
    timerDisplay.textContent = timeLeft;
    timerDisplay.style.color = 'green';

    timerIntervalId = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = timeLeft;
        if (timeLeft <= 5 && timeLeft > 3) {
            timerDisplay.style.color = 'orange';
        } else if (timeLeft <= 3 && timeLeft >= 0) { // Red when 3, 2, 1, 0
            timerDisplay.style.color = 'red';
        }
        if (timeLeft < 0) { // After 0, show "Temps écoulé!"
            clearInterval(timerIntervalId);
            timerDisplay.textContent = "Temps écoulé!";
        }
    }, 1000);
}

/**
 * Animates the pronoun slot machine
 * @param {string} targetPronoun - The pronoun to land on
 * @returns {void}
 */
function animatePronounSlot(targetPronoun) {
    const pronounIndex = pronouns.indexOf(targetPronoun);
    const itemHeight = 80;
    const additionalPronounSets = 3;
    
    const targetPosition = -(pronounIndex * itemHeight);
    const targetInSecondSet = targetPosition - (additionalPronounSets * pronouns.length * itemHeight);
    const finalPosition = targetInSecondSet;
    
    pronounReel.style.transform = `translateY(${finalPosition}px)`;
    
    setTimeout(() => {
        pronounReel.style.transition = 'none';
        pronounReel.style.transform = `translateY(${targetPosition}px)`;
        
        setTimeout(() => {
            pronounReel.style.transition = 'transform 2.5s cubic-bezier(0.2, 0.1, 0.4, 1)';
        }, 50);
    }, ANIMATION_DURATION);
}

spinButton.addEventListener('click', () => {
    if (animationFrameId) return;

    const randomPronoun = pronouns[Math.floor(Math.random() * pronouns.length)];
    const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];

    selectedPronoun = randomPronoun;
    selectedVerb = randomVerb;

    animatePronounSlot(randomPronoun);

    const verbIndex = verbs.indexOf(randomVerb);
    const anglePerSegment = (2 * Math.PI) / verbs.length;

    let segmentMiddleAngle = (verbIndex * anglePerSegment) + (anglePerSegment / 2);
    targetWheelAngle = -segmentMiddleAngle + (anglePerSegment / 2);

    currentWheelAngle = currentWheelAngle % (2 * Math.PI);
    const rotations = MIN_ROTATIONS + Math.floor(Math.random() * MAX_ADDITIONAL_ROTATIONS);
    
    while (targetWheelAngle < currentWheelAngle + 2 * Math.PI) {
        targetWheelAngle += 2 * Math.PI;
    }
    targetWheelAngle += rotations * 2 * Math.PI;

    spinAnimation();
});

