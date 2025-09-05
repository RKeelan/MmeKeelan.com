import '../css/styles.css';
import arrowImg from '../assets/images/spinner-arrow.png';
import { generateRainbowColors } from './utils.js';

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById("wheel"));
if (!canvas) {
    throw new Error('Canvas element not found or not supported');
}
const context = canvas.getContext("2d");
if (!context) {
    throw new Error('2D context not supported');
}
let numberOfWords = 0;
let anglePerSection = 0;
/** @type {string[]} */
let wordList = [];
let spinDuration = -1; // -1 means spin until stop
const minNumberOfRevolutions = 2;

const arrow = new Image();
arrow.src = arrowImg;
arrow.onload = function() {
    drawArrow();
}

function updateWords() {
    const wordsInput = /** @type {HTMLInputElement} */ (document.getElementById("wordsInput"));
    if (!wordsInput) return;
    
    const wordText = wordsInput.value;
    // Split wordText on commas only
    wordList = wordText.split(/,+/).filter((s) => s.trim());

    // Number of words is the number of elements in wordList
    numberOfWords = wordList.length;
    if (numberOfWords > 0) {
        anglePerSection = Math.PI * 2 / numberOfWords
    }
}

function drawWheel() {
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    // Draw the sections of the wheel
    let angle = Math.PI * 1.5;
    const padding = 5;
    const diameter = Math.min(canvas.width, canvas.height) - padding * 2;

    // Use the shared color utility function
    const segmentColors = generateRainbowColors(numberOfWords);

    for (let i = 0; i < numberOfWords; i++) {
        context.beginPath();
        context.moveTo(canvas.width / 2, canvas.height / 2);
        context.arc(diameter/ 2 + padding, diameter / 2 + padding, diameter / 2, angle, angle + anglePerSection);
        context.fillStyle = segmentColors[i];
        context.fill();
        context.strokeStyle = "#000";
        context.stroke();
        angle += anglePerSection;
    }

    // Draw the labels
    angle = Math.PI * 1.5;
    for (let i = 0; i < numberOfWords; i++) {
        const labelRadius = canvas.width / 2 - 50; // Radius for label position
        const labelAngle = angle + anglePerSection / 2; // Angle to draw the label
        const labelX = canvas.width / 2 + labelRadius * Math.cos(labelAngle);
        const labelY = canvas.height / 2 + labelRadius * Math.sin(labelAngle);
        context.textAlign = "center";
        context.fillStyle = "#000";
        context.font = "16px Baskerville";
        context.fillText(wordList[i], labelX, labelY);
        angle += anglePerSection;
    }
}


function drawArrow() {
    if (!canvas || !context) return;
    context.save();
	context.translate(canvas.width / 2, canvas.height / 2);
	context.rotate(/** @type {number} */ ((/** @type {any} */ (arrow)).angle));
    context.drawImage(arrow, -arrow.width / 2, -arrow.height / 2, arrow.width, arrow.height);
    context.restore();
}

// Spin the arrow
function spin() {
    drawWheel();
    drawArrow();
    (/** @type {any} */ (arrow)).angle += anglePerSection;
    if (spinDuration < 0 || spinDuration-- > 0) {
        window.requestAnimationFrame(spin);
    }
}

function init() {
    updateWords();
    drawWheel();

    (/** @type {any} */ (arrow)).angle = anglePerSection / 2;

    const spinButton = document.getElementById("spin");
    if (spinButton) {
        spinButton.addEventListener("click", function() {
            spinDuration = Math.round(wordList.length + Math.random() * wordList.length * (minNumberOfRevolutions - 1));
            window.requestAnimationFrame(spin);
        });
    }

    const startButton = document.getElementById("start");
    if (startButton) {
        startButton.addEventListener("click", function() {
            spinDuration = -1;
            window.requestAnimationFrame(spin);
        });
    }

    const stopButton = document.getElementById("stop");
    if (stopButton) {
        stopButton.addEventListener("click", function() {
            spinDuration = 0;
        });
    }

    const wordsInput = document.getElementById("wordsInput");
    if (wordsInput) {
        wordsInput.addEventListener("input", function() {
            updateWords();
            // Round to the nearest multiple of (anglePerSection / 2)
            (/** @type {any} */ (arrow)).angle = Math.round((/** @type {any} */ (arrow)).angle / anglePerSection) * anglePerSection - anglePerSection / 2;
            drawWheel();
            drawArrow();
        });
    }
}

init();