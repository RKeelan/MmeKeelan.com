import '../css/styles.css';
import arrowImg from '../assets/images/spinner-arrow.png';
import { generateRainbowColors } from './utils.js';

let canvas = document.getElementById("wheel");
let context = canvas.getContext("2d");
let numberOfWords;
let anglePerSection;
let wordList;
let spinDuration = -1; // -1 means spin until stop
const minNumberOfRevolutions = 2;

let arrow = new Image();
arrow.src = arrowImg;
arrow.onload = function() {
    drawArrow();
}

function updateWords() {
    var wordText = document.getElementById("wordsInput").value;
    // Split wordText on commas only
    wordList = wordText.split(/,+/).filter(s => s.trim());

    // Number of words is the number of elements in wordList
    numberOfWords = wordList.length;
    if (numberOfWords > 0) {
        anglePerSection = Math.PI * 2 / numberOfWords
    }
}

function drawWheel() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    // Draw the sections of the wheel
    var angle = Math.PI * 1.5;
    var padding = 5;
    var diameter = Math.min(canvas.width, canvas.height) - padding * 2;

    // Use the shared color utility function
    const segmentColors = generateRainbowColors(numberOfWords);

    for (var i = 0; i < numberOfWords; i++) {
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
    var angle = Math.PI * 1.5;
    for (var i = 0; i < numberOfWords; i++) {
        var labelRadius = canvas.width / 2 - 50; // Radius for label position
        var labelAngle = angle + anglePerSection / 2; // Angle to draw the label
        var labelX = canvas.width / 2 + labelRadius * Math.cos(labelAngle);
        var labelY = canvas.height / 2 + labelRadius * Math.sin(labelAngle);
        context.textAlign = "center";
        context.fillStyle = "#000";
        context.font = "16px Baskerville";
        context.fillText(wordList[i], labelX, labelY);
        angle += anglePerSection;
    }
}


function drawArrow() {
    context.save();
	context.translate(canvas.width / 2, canvas.height / 2);
	context.rotate(arrow.angle);
    context.drawImage(arrow, -arrow.width / 2, -arrow.height / 2, arrow.width, arrow.height);
    context.restore();
}

// Spin the arrow
function spin() {
    drawWheel();
    drawArrow();
    arrow.angle += anglePerSection;
    if (spinDuration < 0 || spinDuration-- > 0) {
        window.requestAnimationFrame(spin);
    }
}

function init() {
    updateWords();
    drawWheel();

    arrow.angle = anglePerSection / 2;

    document.getElementById("spin").addEventListener("click", function() {
        spinDuration = Math.round(wordList.length + Math.random() * wordList.length * (minNumberOfRevolutions - 1));
        window.requestAnimationFrame(spin);
    });

    document.getElementById("start").addEventListener("click", function() {
        spinDuration = -1;
        window.requestAnimationFrame(spin);
    });

    document.getElementById("stop").addEventListener("click", function() {
        spinDuration = 0;
    });

    document.getElementById("wordsInput").addEventListener("input", function() {
        updateWords();
        // Round to the nearest multiple of (anglePerSection / 2)
        arrow.angle = Math.round(arrow.angle / anglePerSection) * anglePerSection - anglePerSection / 2;
        var degrees = arrow.angle * 180 / Math.PI;
        var anglePerSectionDegrees = anglePerSection * 180 / Math.PI;
        drawWheel();
        drawArrow();
    });
}

init();