import '../css/styles.css';
import '../css/connect4Styles.css';
import { jsPDF } from 'jspdf';

/** @param {string} sel */
const $ = (sel) => document.querySelector(sel);

/**
 * @param {number} v
 * @param {number} lo
 * @param {number} hi
 */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const elSub = /** @type {HTMLInputElement} */ ($('#subtitle'));
const elCols = /** @type {HTMLInputElement} */ ($('#cols'));
const elRows = /** @type {HTMLInputElement} */ ($('#rows'));
const elPages = /** @type {HTMLInputElement} */ ($('#numpages'));
const elWords = /** @type {HTMLTextAreaElement} */ ($('#words'));
const elStatus = /** @type {HTMLElement} */ ($('#status'));
const elStatusGrid = /** @type {HTMLElement} */ ($('#status-grid'));
const elStatusWords = /** @type {HTMLElement} */ ($('#status-words'));
const elBtnGen = /** @type {HTMLButtonElement} */ ($('#btn-gen'));
const elBtnDl = /** @type {HTMLButtonElement} */ ($('#btn-dl'));
const elBtnDl2 = /** @type {HTMLButtonElement} */ ($('#btn-dl2'));
const elBtnShuffle = /** @type {HTMLButtonElement} */ ($('#btn-shuffle'));
const elPreview = /** @type {HTMLElement} */ ($('#preview-area'));
const elBoards = /** @type {HTMLElement} */ ($('#boards'));
const elPreviewLabel = /** @type {HTMLElement} */ ($('#preview-label'));

/** @type {string[][]} */
let currentPages = [];


/** @returns {string[]} */
function getWords() {
  return elWords.value
    .split(/[\n,]+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

function getCols() {
  return clamp(Number.parseInt(elCols.value) || 5, 2, 7);
}
function getRows() {
  return clamp(Number.parseInt(elRows.value) || 5, 2, 7);
}
function getNumPages() {
  return clamp(Number.parseInt(elPages.value) || 4, 1, 30);
}
/**
 * Fisher-Yates shuffle (returns a new array).
 * @param {string[]} arr
 * @returns {string[]}
 */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function updateStatus() {
  const words = getWords();
  const total = getCols() * getRows();
  elStatusGrid.innerHTML =
    'Grid: <strong>' +
    getCols() +
    ' &times; ' +
    getRows() +
    ' = ' +
    total +
    ' cells</strong>';
  if (words.length < total) {
    elStatus.className = 'c4-status-bar err';
    elStatusWords.innerHTML =
      '<span class="ct">' +
      words.length +
      ' words — need at least ' +
      total +
      '</span>';
    elBtnGen.disabled = true;
    elBtnGen.title =
      'Add more words (need at least ' +
      total +
      ', currently ' +
      words.length +
      ')';
  } else if (words.length > total) {
    elStatus.className = 'c4-status-bar warn';
    elStatusWords.innerHTML =
      '<span class="ct">' +
      words.length +
      ' words (' +
      (words.length - total) +
      ' extra — random subset per page)</span>';
    elBtnGen.disabled = false;
    elBtnGen.title = '';
  } else {
    elStatus.className = 'c4-status-bar ok';
    elStatusWords.innerHTML =
      '<span class="ct">' + words.length + ' words &#10003;</span>';
    elBtnGen.disabled = false;
    elBtnGen.title = '';
  }
}

/** @returns {string[][]} */
function generatePages() {
  const words = getWords();
  const total = getCols() * getRows();
  const n = getNumPages();
  const pages = [];
  for (let p = 0; p < n; p++) {
    pages.push(shuffle(words).slice(0, total));
  }
  return pages;
}

/**
 * @param {string} s
 * @returns {string}
 */
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

/** @param {string[][]} pages */
function renderPreview(pages) {
  const cols = getCols();
  const rows = getRows();
  const sub = elSub.value.trim();
  currentPages = pages;
  elBoards.innerHTML = '';

  for (let pi = 0; pi < pages.length; pi++) {
    const page = pages[pi];
    const div = document.createElement('div');
    div.className = 'c4-preview-page';
    let html =
      '<div class="c4-board-inner"><div class="c4-board-hdr"><h2>Connect 4</h2>';
    if (sub) html += '<p>' + esc(sub) + '</p>';
    html += '</div>';
    html +=
      '<div class="c4-grid-wrap" style="grid-template-columns:repeat(' +
      cols +
      ',1fr);grid-template-rows:repeat(' +
      rows +
      ',1fr);">';
    for (let i = 0; i < page.length; i++) {
      html += '<div class="c4-cell"><span>' + esc(page[i]) + '</span></div>';
    }
    html += '</div></div>';
    div.innerHTML = html;
    elBoards.appendChild(div);
  }

  elPreviewLabel.textContent = 'Preview — ' + pages.length + ' page(s)';
  elPreview.style.display = '';
  elBtnDl.disabled = false;
  elBtnDl.title = '';
}

function downloadPDF() {
  if (!currentPages.length) return;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'in',
    format: [11, 8.5],
  });

  const pw = 11;
  const ph = 8.5;
  const margin = 0.5;
  const cols = getCols();
  const rows = getRows();
  const sub = elSub.value.trim();

  const titleFontSize = 30;
  const subFontSize = 14;
  const cellFontSize = 24;

  for (let p = 0; p < currentPages.length; p++) {
    if (p > 0) doc.addPage([pw, ph], 'landscape');
    const pageData = currentPages[p];

    // Title
    doc.setFontSize(titleFontSize);
    doc.setFont('helvetica', 'bold');
    let y = margin + titleFontSize / 72;
    doc.text('Connect 4', pw / 2, y, { align: 'center' });

    // Subtitle
    if (sub) {
      y += titleFontSize / 72 * 0.65;
      doc.setFontSize(subFontSize);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(85, 85, 85);
      y += subFontSize / 72 * 0.7;
      doc.text(sub, pw / 2, y, { align: 'center' });
      doc.setTextColor(26, 26, 26);
      y += subFontSize / 72 * 0.8;
    } else {
      y += titleFontSize / 72 * 0.65;
    }

    y += 10 / 72;

    const gridTop = y;
    const gw = pw - margin * 2;
    const gh = ph - gridTop - margin;
    const cw = gw / cols;
    const ch = gh / rows;

    // Outer border
    doc.setDrawColor(26, 26, 26);
    doc.setLineWidth(0.035);
    doc.rect(margin, gridTop, gw, gh);

    // Inner grid lines
    doc.setLineWidth(0.017);
    for (let c = 1; c < cols; c++) {
      doc.line(margin + c * cw, gridTop, margin + c * cw, gridTop + gh);
    }
    for (let r = 1; r < rows; r++) {
      doc.line(margin, gridTop + r * ch, margin + gw, gridTop + r * ch);
    }

    // Cell text
    doc.setFont('helvetica', 'normal');
    const padX = 0.1;
    for (let i = 0; i < pageData.length; i++) {
      const word = pageData[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = margin + col * cw + cw / 2;
      const cy = gridTop + row * ch + ch / 2;
      const maxW = cw - padX * 2;

      // Fit font size to cell
      let fontSize = cellFontSize;
      doc.setFontSize(fontSize);
      while (fontSize > 6) {
        const tw = doc.getTextWidth(word);
        if (tw <= maxW) break;
        fontSize -= 0.5;
        doc.setFontSize(fontSize);
      }

      const textH = doc.getTextDimensions(word).h;
      doc.text(word, cx, cy + textH / 3, { align: 'center' });
    }
  }

  let fname = 'connect4';
  if (sub) {
    fname +=
      '_' +
      sub
        .replace(
          /[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ]+/g,
          '_',
        )
        .replace(/_+$/, '')
        .substring(0, 40);
  }
  doc.save(fname + '.pdf');
}

// Events
elWords.addEventListener('input', updateStatus);
elCols.addEventListener('input', updateStatus);
elRows.addEventListener('input', updateStatus);

elBtnGen.addEventListener('click', () => {
  const pages = generatePages();
  renderPreview(pages);
  elBtnGen.textContent = 'Regenerate';
  setTimeout(() => {
    elPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
});

elBtnDl.addEventListener('click', downloadPDF);
elBtnDl2.addEventListener('click', downloadPDF);

elBtnShuffle.addEventListener('click', () => {
  const pages = generatePages();
  renderPreview(pages);
});

updateStatus();
