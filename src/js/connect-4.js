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
const elFontPicker = /** @type {HTMLSelectElement} */ ($('#fontpicker'));
const elFontPreview = /** @type {HTMLElement} */ ($('#font-preview'));
const elLoading = /** @type {HTMLElement} */ ($('#loading'));
const elLoadingText = /** @type {HTMLElement} */ ($('#loading-text'));

/** @type {string[][]} */
let currentPages = [];

function updateFontPreview() {
  elFontPreview.style.fontFamily = "'" + elFontPicker.value + "', sans-serif";
}

elFontPicker.addEventListener('change', () => {
  updateFontPreview();
  document.querySelectorAll('.c4-cell span').forEach((el) => {
    /** @type {HTMLElement} */ (el).style.fontFamily =
      "'" + elFontPicker.value + "', sans-serif";
  });
  document.querySelectorAll('.c4-board-hdr h2').forEach((el) => {
    /** @type {HTMLElement} */ (el).style.fontFamily =
      "'" + elFontPicker.value + "', sans-serif";
  });
  document.querySelectorAll('.c4-board-hdr p').forEach((el) => {
    /** @type {HTMLElement} */ (el).style.fontFamily =
      "'" + elFontPicker.value + "', sans-serif";
  });
  if (currentPages.length) {
    requestAnimationFrame(() => fitAllText());
  }
});

updateFontPreview();

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
function getFont() {
  return elFontPicker.value;
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
  } else if (words.length > total) {
    elStatus.className = 'c4-status-bar warn';
    elStatusWords.innerHTML =
      '<span class="ct">' +
      words.length +
      ' words (' +
      (words.length - total) +
      ' extra — random subset per page)</span>';
    elBtnGen.disabled = false;
  } else {
    elStatus.className = 'c4-status-bar ok';
    elStatusWords.innerHTML =
      '<span class="ct">' + words.length + ' words &#10003;</span>';
    elBtnGen.disabled = false;
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
  const font = getFont();
  currentPages = pages;
  elBoards.innerHTML = '';

  for (let pi = 0; pi < pages.length; pi++) {
    const page = pages[pi];
    const div = document.createElement('div');
    div.className = 'c4-preview-page';
    let html =
      '<div class="c4-board-inner"><div class="c4-board-hdr"><h2 style="font-family:\'' +
      font +
      "',sans-serif\">Connect 4</h2>";
    if (sub)
      html +=
        '<p style="font-family:\'' +
        font +
        "',sans-serif\">" +
        esc(sub) +
        '</p>';
    html += '</div>';
    html +=
      '<div class="c4-grid-wrap" style="grid-template-columns:repeat(' +
      cols +
      ',1fr);grid-template-rows:repeat(' +
      rows +
      ',1fr);">';
    for (let i = 0; i < page.length; i++) {
      html +=
        '<div class="c4-cell"><span style="font-family:\'' +
        font +
        "',sans-serif\">" +
        esc(page[i]) +
        '</span></div>';
    }
    html += '</div></div>';
    div.innerHTML = html;
    elBoards.appendChild(div);
  }

  elPreviewLabel.textContent = 'Preview — ' + pages.length + ' page(s)';
  elPreview.style.display = '';
  elBtnDl.disabled = false;

  requestAnimationFrame(() => fitAllText());
}

function fitAllText() {
  const maxFontSize = 42;
  const minFontSize = 9;
  const cells = document.querySelectorAll('.c4-cell');
  for (let i = 0; i < cells.length; i++) {
    const cell = /** @type {HTMLElement} */ (cells[i]);
    const span = /** @type {HTMLElement | null} */ (cell.querySelector('span'));
    if (!span) continue;
    const cellW = cell.clientWidth - 16;
    const cellH = cell.clientHeight - 8;

    let lo = minFontSize;
    let hi = maxFontSize;
    span.style.fontSize = hi + 'px';
    while (hi - lo > 0.5) {
      const mid = (lo + hi) / 2;
      span.style.fontSize = mid + 'px';
      if (span.scrollWidth > cellW || span.scrollHeight > cellH) {
        hi = mid;
      } else {
        lo = mid;
      }
    }
    span.style.fontSize = lo + 'px';
  }
}

function downloadPDF() {
  if (!currentPages.length) return;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: 'letter',
  });
  const pw = 792;
  const ph = 612;
  const margin = 40;
  const cols = getCols();
  const rows = getRows();
  const sub = elSub.value.trim();
  const font = getFont();

  const scale = 3;
  const canvasW = pw * scale;
  const canvasH = ph * scale;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));

  elLoading.classList.add('active');

  /** @param {string[]} pageData */
  function drawPage(pageData) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const mx = margin * scale;
    const my = margin * scale;
    const titleFontSize = 30 * scale;
    const subFontSize = 14 * scale;

    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "700 " + titleFontSize + "px '" + font + "', sans-serif";
    const titleY = my + titleFontSize * 0.5;
    ctx.fillText('Connect 4', canvasW / 2, titleY);

    let gridTop = titleY + titleFontSize * 0.65;

    if (sub) {
      ctx.font = "400 " + subFontSize + "px '" + font + "', sans-serif";
      const subY = gridTop + subFontSize * 0.7;
      ctx.fillStyle = '#555555';
      ctx.fillText(sub, canvasW / 2, subY);
      gridTop = subY + subFontSize * 0.8;
    }

    gridTop += 10 * scale;

    const gx = mx;
    const gy = gridTop;
    const gw = canvasW - mx * 2;
    const gh = canvasH - gy - my;
    const cw = gw / cols;
    const ch = gh / rows;

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5 * scale;
    ctx.strokeRect(gx, gy, gw, gh);

    ctx.lineWidth = 1.2 * scale;
    for (let c = 1; c < cols; c++) {
      ctx.beginPath();
      ctx.moveTo(gx + c * cw, gy);
      ctx.lineTo(gx + c * cw, gy + gh);
      ctx.stroke();
    }
    for (let r = 1; r < rows; r++) {
      ctx.beginPath();
      ctx.moveTo(gx, gy + r * ch);
      ctx.lineTo(gx + gw, gy + r * ch);
      ctx.stroke();
    }

    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const padX = 10 * scale;
    const padY = 6 * scale;

    for (let i = 0; i < pageData.length; i++) {
      const word = pageData[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = gx + col * cw + cw / 2;
      const cy = gy + row * ch + ch / 2;
      const maxW = cw - padX * 2;
      const maxH = ch - padY * 2;

      let lo = 8 * scale;
      let hi = 40 * scale;
      while (hi - lo > 0.5) {
        const mid = (lo + hi) / 2;
        ctx.font = "400 " + mid + "px '" + font + "', sans-serif";
        const m = ctx.measureText(word);
        const textH = mid * 1.1;
        if (m.width > maxW || textH > maxH) {
          hi = mid;
        } else {
          lo = mid;
        }
      }

      ctx.font = "400 " + lo + "px '" + font + "', sans-serif";
      ctx.fillText(word, cx, cy);
    }
  }

  let pageIndex = 0;
  function renderNext() {
    if (pageIndex >= currentPages.length) {
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
      elLoading.classList.remove('active');
      return;
    }

    elLoadingText.textContent =
      'Rendering page ' +
      (pageIndex + 1) +
      ' of ' +
      currentPages.length +
      '…';

    if (pageIndex > 0) doc.addPage('letter', 'landscape');

    drawPage(currentPages[pageIndex]);
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 0, 0, pw, ph);

    pageIndex++;
    setTimeout(renderNext, 10);
  }

  renderNext();
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
