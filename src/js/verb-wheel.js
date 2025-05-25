import '../css/styles.css'; // General styles
import arrowImg from '../assets/images/spinner-arrow.png';

const verbs = ["être", "avoir", "aller", "faire", "pouvoir", "vouloir"];
const pronouns = ["Je", "Tu", "Il/Elle/On", "Nous", "Vous", "Ils/Elles"];
let conjugations = {}; // To be loaded from JSON

// DOM Elements
const pronounDisplay = document.getElementById('pronoun-display');
const verbDisplay = document.getElementById('verb-display');
const timerDisplay = document.getElementById('timer');
const spinButton = document.getElementById('spin-button');
const canvas = document.getElementById('wheel');
const context = canvas.getContext('2d');

let currentWheelAngle = 0; // Current rotation angle of the wheel
let targetWheelAngle = 0;   // Target rotation angle for the wheel
let animationFrameId = null;
let timerIntervalId = null;
let timeLeft = 10;

const arrow = new Image();
arrow.src = arrowImg;

// Angle for the arrow to point upwards, assuming original image points right
const ARROW_UP_ANGLE = -Math.PI / 2; 

arrow.onload = () => {
    drawWheelAndArrow(); // Initial draw
};

async function loadConjugations() {
    try {
        const response = await fetch('js/verb-conjugations.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        conjugations = await response.json();
        console.log("Conjugations loaded successfully.");
    } catch (error) {
        console.error("Could not load conjugations:", error);
        pronounDisplay.textContent = "Erreur";
        verbDisplay.textContent = "de chargement";
    }
}

function drawWheelSegments() {
    const numSegments = verbs.length;
    const anglePerSegment = (2 * Math.PI) / numSegments;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10; // 10px padding

    context.font = '16px Arial'; // Adjusted font size
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    verbs.forEach((verb, index) => {
        const startAngle = index * anglePerSegment;
        const endAngle = (index + 1) * anglePerSegment;

        context.beginPath();
        context.moveTo(centerX, centerY);
        context.arc(centerX, centerY, radius, startAngle, endAngle);
        context.closePath();

        context.fillStyle = index % 2 === 0 ? '#e9e9e9' : '#dcdcdc'; // Lighter shades
        context.fill();
        context.strokeStyle = '#a0a0a0'; // Softer stroke
        context.stroke();

        context.save();
        context.translate(centerX, centerY);
        // Rotate text to align with segment
        context.rotate(startAngle + anglePerSegment / 2); 
        context.fillStyle = '#333';
        // Adjust text position for readability
        const textRadius = radius * 0.65; 
        context.fillText(verb, textRadius, 0);
        context.restore();
    });
}

function drawArrow() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    context.save();
    context.translate(centerX, centerY);
    context.rotate(ARROW_UP_ANGLE); // Make arrow point up
    const arrowTipOffset = 5; // How far the arrow tip should be from the wheel edge
    const arrowYPosition = -(canvas.height / 2 - arrowTipOffset - arrow.height / 2); 
    context.drawImage(arrow, -arrow.width / 2, arrowYPosition, arrow.width, arrow.height);
    context.restore();
}

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

function spinAnimation() {
    const rotationSpeedFactor = 0.07; // Adjust for faster/slower deceleration (lower is slower)
    const difference = targetWheelAngle - currentWheelAngle;

    if (Math.abs(difference) < 0.001) { // Threshold for stopping
        currentWheelAngle = targetWheelAngle;
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    } else {
        currentWheelAngle += difference * rotationSpeedFactor;
        animationFrameId = requestAnimationFrame(spinAnimation);
    }
    drawWheelAndArrow();
}

function startTimer() {
    if (timerIntervalId) {
        clearInterval(timerIntervalId);
    }
    timeLeft = 10;
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

spinButton.addEventListener('click', async () => {
    if (animationFrameId) return; // Don't spin if already spinning

    if (Object.keys(conjugations).length === 0) {
        await loadConjugations();
        if (Object.keys(conjugations).length === 0) {
            pronounDisplay.textContent = "Erreur";
            verbDisplay.textContent = "Verbes"; 
            return;
        }
    }

    const randomPronoun = pronouns[Math.floor(Math.random() * pronouns.length)];
    const randomVerb = verbs[Math.floor(Math.random() * verbs.length)];

    pronounDisplay.textContent = randomPronoun;
    verbDisplay.textContent = randomVerb;

    const verbIndex = verbs.indexOf(randomVerb);
    const anglePerSegment = (2 * Math.PI) / verbs.length;

    let segmentMiddleAngle = (verbIndex * anglePerSegment) + (anglePerSegment / 2);
    targetWheelAngle = ARROW_UP_ANGLE - segmentMiddleAngle;

    currentWheelAngle = currentWheelAngle % (2 * Math.PI);
    const rotations = 3 + Math.floor(Math.random() * 3);
    
    while (targetWheelAngle < currentWheelAngle + 2 * Math.PI) {
        targetWheelAngle += 2 * Math.PI;
    }
    targetWheelAngle += rotations * 2 * Math.PI;

    spinAnimation();
    startTimer();
});

// Initial draw on load
// loadConjugations(); // Deferred to first click for faster page load.
