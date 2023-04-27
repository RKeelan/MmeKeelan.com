import { jsPDF } from "jspdf";

let wordList;
function updateWords() {
    var wordText = document.getElementById("wordsInput").value;
    // Split wordText on whitespace and commas
    wordList = wordText.split(/[\s,]+/).filter(s => s);

    // Update the word count in the HTML
    document.getElementById("wordCount").innerText = wordList.length;
}

let numCards;
function updateNumCards() {
    var numCardsStr = document.getElementById("numCards").value;
    numCards = parseInt(numCardsStr, 10);
    if (isNaN(numCards) || numCards != numCardsStr) {
        numCards = 0;
    }
}

function fisherYatesShuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
}

function addBingoCard(doc, words) {
    const free = "Gratuit";
    const headerFontSize = 48;
    const cellFontSize = 16;
    const cardWidth = 8; // inches
    const cellWidth = cardWidth / 5;
    const cellHeight = cellWidth;
    const cardHeight = cellHeight * 6;
    const xOffset = (doc.internal.pageSize.getWidth() - cardWidth) / 2;
    const yOffset = (doc.internal.pageSize.getHeight() - cardHeight) / 2;
  
    // Shuffle the word list to create a random bingo card
    var wordIndex;
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 5; col++) {
        const xPos = xOffset + col * cellWidth;
        const yPos = yOffset + row * cellHeight;
  
        // Draw the cell border
        doc.rect(xPos, yPos, cellWidth, cellHeight);
  
        // If this is the center cell, skip it (usually a free space)
        var text;
        var heightFudgeFactor;
        if (row == 0) {
            doc.setFontSize(headerFontSize);
            text = "BINGO"[col];
            heightFudgeFactor = 1.4;
            wordIndex = 0;
        }
        else {
            doc.setFontSize(cellFontSize);
            if (row === 3 && col === 2) {
                text = free;
            }
            else {
                text = words[wordIndex] || free;
                wordIndex++;
            }
            heightFudgeFactor = 1.3;
        }
        // You can't directly use the height of the text, because it ends up not being centered. I've seen online that
        // this is because the height of the text dimension includes the line spacing below the line. But I also found
        // that different font sizes require different fudge factors. I'm not entirely sure why.
        const textHeight = doc.getTextDimensions(text).h / heightFudgeFactor;

        // Draw the word in the cell
        doc.text(text, xPos + cellWidth / 2, yPos + cellHeight / 2 + textHeight / 2, {
          align: "center",
          valign: "middle",
        });
      }
    }
  }

function makePdf() {
    // Default export is a4 paper, portrait, using millimeters for units
    const doc = new jsPDF({
            orientation: 'p', 
            unit: 'in', 
            format: [8.5, 11]
    });
    doc.setLineWidth(0.05);

    const bingoCards = new Set();
    while (bingoCards.size < numCards) {
        const shuffledWords = fisherYatesShuffle(wordList.slice());
        const cardString = shuffledWords.join(",");

        if (!bingoCards.has(cardString)) {
            bingoCards.add(cardString);
            addBingoCard(doc, shuffledWords);

            // Add a new page for the next bingo card if there are more cards to add
            if (bingoCards.size < numCards) {
                doc.addPage();
            }
        }
    }

    doc.save("BingoCards.pdf");
}

function updateGenerateButton() {
    var button = document.getElementById("generate");
    if (numCards >= 1 && wordList.length >= 24) {
        button.disabled = false;
    }
    else {
        button.disabled = true;
    }
}


function init() {
    updateWords()
    updateNumCards()
    document.getElementById("wordsInput").addEventListener("input", function() {
        updateWords();
        updateGenerateButton();
    });
    document.getElementById("numCards").addEventListener("input", function() {
        updateNumCards();
        updateGenerateButton();
    });
    document.getElementById("generate").addEventListener("click", makePdf);
}

init();