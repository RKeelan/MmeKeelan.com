var canvas = document.getElementById("wheel");
var context = canvas.getContext("2d");

var numberOfWords;
var anglePerSection;
var wordList;
function updateWords() {
    wordText = document.getElementById("wordsInput").value;
    // Split wordText on whitespace and commas
    wordList = wordText.split(/[\s,]+/).filter(s => s);

    // Number of words is the number of elements in wordList
    numberOfWords = wordList.length;
    anglePerSection = Math.PI * 2 / numberOfWords
}
updateWords();

function drawWheel() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    // Draw the sections of the wheel
    var angle = Math.PI * 1.5;
    var padding = 5;
    var diameter = Math.min(canvas.width, canvas.height) - padding * 2;
    for (var i = 0; i < numberOfWords; i++) {
        context.beginPath();
        context.moveTo(canvas.width / 2, canvas.height / 2);
        context.arc(diameter/ 2 + padding, diameter / 2 + padding, diameter / 2, angle, angle + anglePerSection);
        context.fillStyle = 'hsl(' + (i * 360 / numberOfWords) + ', 70%, 70%)';
        console.log(`Section ${wordList[i]} and is color ${context.fillStyle}`);
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
drawWheel();


function drawArrow() {
    context.save();
	context.translate(canvas.width / 2, canvas.height / 2);
	context.rotate(arrow.angle);
    context.drawImage(arrow, -arrow.width / 2, -arrow.height / 2, arrow.width, arrow.height);
    context.restore();
}

// // Load the arrow image
var arrow = new Image();
arrow.src = "/img/spinner-arrow.png";
arrow.angle = anglePerSection / 2;
arrow.onload = function() {
    drawArrow();
}


var fps = 45;
var rotateSpeed = Math.PI * 2 / fps; // I think this is 1 revolution per second
var spinDuration = -1; // -1 means spin until stop

// Spin the arrow
function spin() {
    drawWheel();
    drawArrow();
    arrow.angle += anglePerSection;
    if (spinDuration < 0 || spinDuration-- > 0) {
        window.requestAnimationFrame(spin);
    }
}

var minNumberOfRevolutions = 2;
document.getElementById("spin").addEventListener("click", function() {
    spinDuration = Math.round(wordList.length + Math.random() * wordList.length * (minNumberOfRevolutions - 1));
    console.log(`Spin duration is ${spinDuration}`);
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
    degrees = arrow.angle * 180 / Math.PI;
    anglePerSectionDegrees = anglePerSection * 180 / Math.PI;
    console.log(`Arrow angle is ${degrees} and anglePerSection is ${anglePerSectionDegrees}`);
    drawWheel();
    drawArrow();
});