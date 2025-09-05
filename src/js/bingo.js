import '../css/styles.css';
import { jsPDF } from "jspdf";

/** @type {string[]} */
let wordList = [];
function updateWords() {
    const wordsInput = /** @type {HTMLInputElement} */ (document.getElementById("wordsInput"));
    if (!wordsInput) return;
    
    const wordText = wordsInput.value;
    // Split wordText on whitespace and commas
    wordList = wordText.split(/[,]+/).filter((s) => s);

    // Update the word count in the HTML
    const wordCountElement = document.getElementById("wordCount");
    if (wordCountElement) {
        wordCountElement.innerText = wordList.length.toString();
    }
}

let numCards = 0;
function updateNumCards() {
    const numCardsElement = /** @type {HTMLInputElement} */ (document.getElementById("numCards"));
    if (!numCardsElement) return;
    
    const numCardsStr = numCardsElement.value;
    numCards = parseInt(numCardsStr, 10);
    if (isNaN(numCards) || numCards != parseInt(numCardsStr, 10)) {
        numCards = 0;
    }
}

/**
 * @param {any[]} array
 * @returns {any[]}
 */
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

/**
 * @param {any} doc
 * @param {string[]} words
 */
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
    let wordIndex = 0;
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 5; col++) {
        const xPos = xOffset + col * cellWidth;
        const yPos = yOffset + row * cellHeight;
  
        // Draw the cell border
        doc.rect(xPos, yPos, cellWidth, cellHeight);
  
        // If this is the center cell, skip it (usually a free space)
        let text;
        let heightFudgeFactor;
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
        // Handle text wrapping within the cell
        const maxWidth = cellWidth * 0.9; // Use 90% of cell width for padding
        const lines = doc.splitTextToSize(text, maxWidth);
        const baseLineHeight = doc.getTextDimensions(text).h / heightFudgeFactor;
        const lineHeight = baseLineHeight * 1.5; // Add 20% more spacing between lines
        const totalTextHeight = lines.length * lineHeight;
        
        // Calculate starting Y position to center all lines vertically
        const startY = yPos + cellHeight / 2 - totalTextHeight / 2 + lineHeight;
        
        // Draw each line
        lines.forEach((/** @type {string} */ line, /** @type {number} */ index) => {
          doc.text(line, xPos + cellWidth / 2, startY + index * lineHeight, {
            align: "center"
          });
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
        const shuffledWords = /** @type {string[]} */ (fisherYatesShuffle([...wordList]));
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
    const button = document.getElementById("generate");
    if (!button || !('disabled' in button)) return;
    
    if (numCards >= 1 && wordList.length >= 24) {
        button.disabled = false;
    }
    else {
        button.disabled = true;
    }
}


function init() {
    updateWords();
    updateNumCards();
    
    const wordsInput = document.getElementById("wordsInput");
    if (wordsInput) {
        wordsInput.addEventListener("input", function() {
            updateWords();
            updateGenerateButton();
        });
    }
    
    const numCardsInput = document.getElementById("numCards");
    if (numCardsInput) {
        numCardsInput.addEventListener("input", function() {
            updateNumCards();
            updateGenerateButton();
        });
    }
    
    const generateButton = document.getElementById("generate");
    if (generateButton) {
        generateButton.addEventListener("click", makePdf);
    }
}

init();