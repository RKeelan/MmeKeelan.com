import '../css/styles.css';
import '../css/snakesAndLaddersStyles.css';
import { jsPDF } from 'jspdf';

/** @param {string} sel */
const $ = (sel) => document.querySelector(sel);

const elFocus = /** @type {HTMLInputElement} */ ($('#focusInput'));
const elWords = /** @type {HTMLTextAreaElement} */ ($('#wordInput'));
const elBoardSize = /** @type {HTMLSelectElement} */ ($('#boardSize'));
const elNumBoards = /** @type {HTMLSelectElement} */ ($('#numBoards'));
const elSnakeCount = /** @type {HTMLSelectElement} */ ($('#snakeCount'));
const elStatus = /** @type {HTMLElement} */ ($('#status'));
const elStatusWords = /** @type {HTMLElement} */ ($('#status-words'));
const elBtnGen = /** @type {HTMLButtonElement} */ ($('#btn-gen'));
const elBtnDl = /** @type {HTMLButtonElement} */ ($('#btn-dl'));
const elBtnDl2 = /** @type {HTMLButtonElement} */ ($('#btn-dl2'));
const elBtnShuffle = /** @type {HTMLButtonElement} */ ($('#btn-shuffle'));
const elPreview = /** @type {HTMLElement} */ ($('#preview-area'));
const elBoards = /** @type {HTMLElement} */ ($('#boards'));
const elPreviewLabel = /** @type {HTMLElement} */ ($('#preview-label'));
const elLoading = /** @type {HTMLElement} */ ($('#loading'));
const elLoadingText = /** @type {HTMLElement} */ ($('#loading-text'));

const MIN_WORDS = 10;

// Twemoji SVG URLs for the two emoji used in the game
const TWEMOJI_BASE =
	'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/';
const SNAKE_SVG_URL = TWEMOJI_BASE + '1f40d.svg';
const LADDER_SVG_URL = TWEMOJI_BASE + '1fa9c.svg';

/**
 * Load a Twemoji SVG and rasterise it to a PNG data URL at the given size.
 * @param {string} url
 * @param {number} size pixels
 * @returns {Promise<string>} PNG data URL
 */
function loadEmojiPng(url, size) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			const c = document.createElement('canvas');
			c.width = size;
			c.height = size;
			const cx = /** @type {CanvasRenderingContext2D} */ (
				c.getContext('2d')
			);
			cx.drawImage(img, 0, 0, size, size);
			resolve(c.toDataURL('image/png'));
		};
		img.onerror = () => reject(new Error('Failed to load emoji: ' + url));
		img.src = url;
	});
}

/** @type {Promise<{snake: string, ladder: string}> | null} */
let emojiPromise = null;

/** Load both emoji PNGs (cached after first call). */
function getEmojiPngs() {
	if (!emojiPromise) {
		emojiPromise = Promise.all([
			loadEmojiPng(SNAKE_SVG_URL, 64),
			loadEmojiPng(LADDER_SVG_URL, 64),
		]).then(([snake, ladder]) => ({ snake, ladder }));
	}
	return emojiPromise;
}

/**
 * @typedef {{
 *   words: string[],
 *   snakeMap: Record<number, number>,
 *   ladderMap: Record<number, number>,
 *   total: number,
 *   cols: number,
 *   rows: number,
 *   focus: string,
 *   boardNum: number
 * }} BoardData
 */

/** @type {BoardData[]} */
let currentBoards = [];

/** @returns {string[]} */
function getWords() {
	return [
		...new Set(
			elWords.value
				.split(/[\n,]+/)
				.map((w) => w.trim().toLowerCase())
				.filter(Boolean),
		),
	];
}

/**
 * Fisher-Yates shuffle (returns a new array).
 * @template T
 * @param {T[]} arr
 * @returns {T[]}
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

/**
 * Fill n slots from words, cycling through shuffled copies so words don't
 * repeat until the full list is used up.
 * @param {string[]} words
 * @param {number} n
 * @returns {string[]}
 */
function fillSlots(words, n) {
	const out = [];
	/** @type {string[]} */
	let pool = [];
	while (out.length < n) {
		if (!pool.length) pool = shuffle(words);
		out.push(/** @type {string} */ (pool.pop()));
	}
	return out;
}

/**
 * @param {number} lo
 * @param {number} hi
 */
function randInt(lo, hi) {
	return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

/**
 * Generate snake and ladder positions for a board.
 * @param {number} total
 * @param {number} count
 */
function generateSnakesAndLadders(total, count) {
	const snakes = [];
	const ladders = [];
	const used = new Set([1, total]);
	const maxJump = Math.max(5, Math.floor(total / 4));

	let att = 0;
	while (snakes.length < count && att < 500) {
		att++;
		const head = randInt(Math.floor(total * 0.3), total - 1);
		const dist = randInt(3, maxJump);
		const tail = head - dist;
		if (tail < 2 || used.has(head) || used.has(tail)) continue;
		snakes.push({ head, tail });
		used.add(head);
		used.add(tail);
	}
	att = 0;
	while (ladders.length < count && att < 500) {
		att++;
		const bottom = randInt(2, Math.floor(total * 0.7));
		const dist = randInt(3, maxJump);
		const top = bottom + dist;
		if (top >= total || used.has(bottom) || used.has(top)) continue;
		ladders.push({ bottom, top });
		used.add(bottom);
		used.add(top);
	}
	return { snakes, ladders };
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

/**
 * Build boustrophedon cell ordering for the grid.
 * @param {number} total
 * @param {number} cols
 * @param {number} rows
 * @returns {number[]} cell numbers in DOM order (top-left to bottom-right)
 */
function buildCellOrder(total, cols, rows) {
	/** @type {Record<number, {gRow: number, gCol: number}>} */
	const cellPos = {};
	for (let r = 0; r < rows; r++) {
		const boardRow = rows - 1 - r;
		const leftToRight = boardRow % 2 === 0;
		for (let c = 0; c < cols; c++) {
			const col = leftToRight ? c : cols - 1 - c;
			const cellNum = boardRow * cols + col + 1;
			cellPos[cellNum] = { gRow: r, gCol: c };
		}
	}
	const ordered = [];
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			for (let cn = 1; cn <= total; cn++) {
				if (cellPos[cn].gRow === r && cellPos[cn].gCol === c) {
					ordered.push(cn);
				}
			}
		}
	}
	return ordered;
}

function updateStatus() {
	const words = getWords();
	if (words.length < MIN_WORDS) {
		elStatus.className = 'sal-status-bar err';
		elStatusWords.innerHTML =
			'<span class="ct">' +
			words.length +
			' words \u2014 need at least ' +
			MIN_WORDS +
			'</span>';
		elBtnGen.disabled = true;
		elBtnGen.title =
			'Add more words (need at least ' +
			MIN_WORDS +
			', currently ' +
			words.length +
			')';
	} else {
		elStatus.className = 'sal-status-bar ok';
		elStatusWords.innerHTML =
			'<span class="ct">' + words.length + ' words \u2713</span>';
		elBtnGen.disabled = false;
		elBtnGen.title = '';
	}
}

/**
 * Generate board data for all boards.
 * @returns {BoardData[]}
 */
function generateBoards() {
	const words = getWords();
	const total = Number(elBoardSize.value);
	const numBoards = Number(elNumBoards.value);
	const snakeCount = Number(elSnakeCount.value);
	const focus = elFocus.value.trim();

	const cols = total === 30 ? 5 : 6;
	const rows = 6;

	/** @type {BoardData[]} */
	const boards = [];
	for (let b = 0; b < numBoards; b++) {
		const { snakes, ladders } = generateSnakesAndLadders(total, snakeCount);
		/** @type {Record<number, number>} */
		const snakeMap = {};
		/** @type {Record<number, number>} */
		const ladderMap = {};
		for (const s of snakes) snakeMap[s.head] = s.tail;
		for (const l of ladders) ladderMap[l.bottom] = l.top;

		boards.push({
			words: fillSlots(words, total - 2),
			snakeMap,
			ladderMap,
			total,
			cols,
			rows,
			focus,
			boardNum: b + 1,
		});
	}
	return boards;
}

/** @param {BoardData[]} boards */
function renderPreview(boards) {
	currentBoards = boards;
	elBoards.innerHTML = '';

	for (const board of boards) {
		const div = document.createElement('div');
		div.className = 'sal-preview-page';

		const inner = document.createElement('div');
		inner.className = 'sal-board-inner';

		// Header
		const header = document.createElement('div');
		header.className = 'sal-board-header';
		header.innerHTML =
			'<div class="sal-board-title">Serpents et \u00e9chelles</div>' +
			(board.focus
				? '<div class="sal-board-focus">' + esc(board.focus) + '</div>'
				: '') +
			'<div class="sal-board-num">Carte #' + board.boardNum + '</div>';
		inner.appendChild(header);

		// Grid
		const grid = document.createElement('div');
		grid.className = 'sal-grid';
		grid.style.gridTemplateColumns =
			'repeat(' + board.cols + ', 1fr)';

		const ordered = buildCellOrder(
			board.total,
			board.cols,
			board.rows,
		);
		let wi = 0;
		for (const cn of ordered) {
			const cell = document.createElement('div');
			cell.className = 'sal-cell';

			const numEl = document.createElement('span');
			numEl.className = 'sal-cell-num';
			numEl.textContent = String(cn);
			cell.appendChild(numEl);

			const wordEl = document.createElement('span');
			wordEl.className = 'sal-cell-word';

			if (cn === 1) {
				wordEl.textContent = 'D\u00c9PART';
				cell.classList.add('sal-cell-start');
			} else if (cn === board.total) {
				wordEl.textContent = 'ARRIV\u00c9E';
				cell.classList.add('sal-cell-end');
			} else {
				wordEl.textContent = board.words[wi++];
			}
			cell.appendChild(wordEl);

			if (board.snakeMap[cn] !== undefined) {
				const ico = document.createElement('span');
				ico.className = 'sal-cell-icon';
				ico.textContent = '\uD83D\uDC0D';
				cell.appendChild(ico);
				const lbl = document.createElement('span');
				lbl.className = 'sal-cell-label sal-label-snake';
				lbl.textContent =
					'\uD83D\uDC0D descends \u00e0 la case ' + board.snakeMap[cn];
				cell.appendChild(lbl);
			}
			if (board.ladderMap[cn] !== undefined) {
				const ico = document.createElement('span');
				ico.className = 'sal-cell-icon';
				ico.textContent = '\uD83E\uDE9C';
				cell.appendChild(ico);
				const lbl = document.createElement('span');
				lbl.className = 'sal-cell-label sal-label-ladder';
				lbl.textContent =
					'\uD83E\uDE9C monte \u00e0 la case ' + board.ladderMap[cn];
				cell.appendChild(lbl);
			}

			grid.appendChild(cell);
		}
		inner.appendChild(grid);

		// Footer
		const footer = document.createElement('div');
		footer.className = 'sal-board-footer';
		footer.innerHTML =
			'<strong>Comment jouer :</strong> Lance le d\u00e9 et avance. Lis le mot \u00e0 voix haute. ' +
			'Si tu ne peux pas le lire, reste sur ta case. Le premier \u00e0 l\u2019arriv\u00e9e gagne!' +
			'<div class="sal-board-legend">' +
			'<span>\uD83D\uDC0D descends \u00e0 la case = Serpent (recule!)</span>' +
			'<span>\uD83E\uDE9C monte \u00e0 la case = \u00c9chelle (avance!)</span>' +
			'</div>';
		inner.appendChild(footer);

		div.appendChild(inner);
		elBoards.appendChild(div);
	}

	elPreviewLabel.textContent =
		'Preview \u2014 ' + boards.length + ' board(s)';
	elPreview.style.display = '';
	elBtnDl.disabled = false;

	setTimeout(() => {
		elPreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}, 80);
}

function downloadPDF() {
	if (!currentBoards.length) return;

	elLoading.classList.add('active');
	elLoadingText.textContent = 'Loading emoji assets\u2026';

	getEmojiPngs()
		.then((emoji) => {
			generatePdfPages(emoji);
		})
		.catch(() => {
			// Fall back with no emoji images
			generatePdfPages(null);
		});
}

/** @param {{snake: string, ladder: string} | null} emoji */
function generatePdfPages(emoji) {
	const doc = new jsPDF({
		orientation: 'landscape',
		unit: 'pt',
		format: 'letter',
	});
	// Letter landscape in points: 792 x 612
	const pw = 792;
	const ph = 612;
	const mx = 36;
	const my = 28;
	const emojiSize = 8; // points

	/**
	 * Place an emoji image in the PDF, or skip if unavailable.
	 * @param {string | undefined} dataUrl
	 * @param {number} x
	 * @param {number} y
	 * @param {number} size
	 */
	function placeEmoji(dataUrl, x, y, size) {
		if (dataUrl) {
			doc.addImage(dataUrl, 'PNG', x, y, size, size);
		}
	}

	/** @param {BoardData} board */
	function drawPage(board) {
		const snakePng = emoji ? emoji.snake : undefined;
		const ladderPng = emoji ? emoji.ladder : undefined;

		// Title
		doc.setFontSize(20);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(26, 26, 26);
		let curY = my + 16;
		doc.text('Serpents et \u00e9chelles', pw / 2, curY, {
			align: 'center',
		});
		curY += 16;

		// Subtitle
		if (board.focus) {
			doc.setFontSize(11);
			doc.setFont('helvetica', 'normal');
			doc.setTextColor(85, 85, 85);
			doc.text(board.focus, pw / 2, curY, { align: 'center' });
			curY += 12;
		}

		// Card number
		doc.setFontSize(8);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(187, 187, 187);
		doc.text('Carte #' + board.boardNum, pw / 2, curY, {
			align: 'center',
		});
		curY += 10;

		// Footer reserved space
		const footerH = 32;
		const gx = mx;
		const gy = curY;
		const gw = pw - mx * 2;
		const gh = ph - gy - my - footerH;
		const cw = gw / board.cols;
		const ch = gh / board.rows;

		// Cell backgrounds (painted first so grid lines draw on top)
		const ordered = buildCellOrder(board.total, board.cols, board.rows);
		for (let idx = 0; idx < ordered.length; idx++) {
			const cn = ordered[idx];
			if (cn !== 1 && cn !== board.total) continue;
			const gridRow = Math.floor(idx / board.cols);
			const gridCol = idx % board.cols;
			const cx = gx + gridCol * cw;
			const cy = gy + gridRow * ch;
			if (cn === 1) {
				doc.setFillColor(217, 245, 224);
			} else {
				doc.setFillColor(255, 232, 204);
			}
			doc.rect(cx, cy, cw, ch, 'F');
		}

		// Grid outer border
		doc.setDrawColor(26, 26, 26);
		doc.setLineWidth(1.5);
		doc.rect(gx, gy, gw, gh);

		// Grid inner lines
		doc.setDrawColor(150, 150, 150);
		doc.setLineWidth(0.3);
		for (let c = 1; c < board.cols; c++) {
			doc.line(gx + c * cw, gy, gx + c * cw, gy + gh);
		}
		for (let r = 1; r < board.rows; r++) {
			doc.line(gx, gy + r * ch, gx + gw, gy + r * ch);
		}

		// Cell content
		let wi = 0;
		for (let idx = 0; idx < ordered.length; idx++) {
			const cn = ordered[idx];
			const gridRow = Math.floor(idx / board.cols);
			const gridCol = idx % board.cols;
			const cx = gx + gridCol * cw;
			const cy = gy + gridRow * ch;

			const isSnake = board.snakeMap[cn] !== undefined;
			const isLadder = board.ladderMap[cn] !== undefined;

			// Cell number (top-left)
			doc.setFontSize(6);
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(51, 51, 51);
			doc.text(String(cn), cx + 2, cy + 7);

			// Snake/ladder emoji icon (top-right corner)
			if (isSnake) {
				placeEmoji(snakePng, cx + cw - 12, cy + 2, 10);
			}
			if (isLadder) {
				placeEmoji(ladderPng, cx + cw - 12, cy + 2, 10);
			}

			// Word
			let word;
			if (cn === 1) {
				word = 'D\u00c9PART';
			} else if (cn === board.total) {
				word = 'ARRIV\u00c9E';
			} else {
				word = board.words[wi++];
			}

			// Fit word to cell
			doc.setFont('helvetica', 'bold');
			doc.setTextColor(26, 26, 26);
			const maxW = cw - 8;
			let fontSize = 14;
			doc.setFontSize(fontSize);
			while (fontSize > 6 && doc.getTextWidth(word) > maxW) {
				fontSize -= 0.5;
				doc.setFontSize(fontSize);
			}
			doc.text(word, cx + cw / 2, cy + ch / 2 + fontSize * 0.15, {
				align: 'center',
			});

			// Snake/ladder label (bottom of cell): emoji + text
			if (isSnake) {
				const label = 'descends \u00e0 la case ' + board.snakeMap[cn];
				doc.setFontSize(5);
				doc.setFont('helvetica', 'bold');
				doc.setTextColor(42, 157, 78);
				const labelW = doc.getTextWidth(label);
				const totalW = emojiSize + 2 + labelW;
				const startX = cx + (cw - totalW) / 2;
				placeEmoji(snakePng, startX, cy + ch - emojiSize - 1, emojiSize);
				doc.text(label, startX + emojiSize + 2, cy + ch - 2);
			}
			if (isLadder) {
				const label = 'monte \u00e0 la case ' + board.ladderMap[cn];
				doc.setFontSize(5);
				doc.setFont('helvetica', 'bold');
				doc.setTextColor(139, 94, 60);
				const labelW = doc.getTextWidth(label);
				const totalW = emojiSize + 2 + labelW;
				const startX = cx + (cw - totalW) / 2;
				placeEmoji(ladderPng, startX, cy + ch - emojiSize - 1, emojiSize);
				doc.text(label, startX + emojiSize + 2, cy + ch - 2);
			}
		}

		// Footer background
		const footerY = gy + gh + 4;
		doc.setFillColor(245, 240, 232);
		doc.rect(mx, footerY, gw, footerH - 4, 'F');

		// Footer instructions
		doc.setFontSize(7);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(51, 51, 51);
		const ftY = footerY + 9;
		doc.text('Comment jouer :', mx + 4, ftY);

		const instrX = mx + 4 + doc.getTextWidth('Comment jouer : ');
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(85, 85, 85);
		doc.text(
			'Lance le d\u00e9 et avance. Lis le mot \u00e0 voix haute. Si tu ne peux pas le lire, reste sur ta case.',
			instrX,
			ftY,
		);

		// Legend: emoji + text
		doc.setFontSize(6);
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(119, 119, 119);
		const legY = ftY + 10;
		const legEmojiSize = 7;
		let legX = mx + 4;
		placeEmoji(snakePng, legX, legY - legEmojiSize + 1, legEmojiSize);
		legX += legEmojiSize + 2;
		doc.text('descends \u00e0 la case = Serpent (recule!)', legX, legY);
		legX += doc.getTextWidth('descends \u00e0 la case = Serpent (recule!)   ');
		placeEmoji(ladderPng, legX, legY - legEmojiSize + 1, legEmojiSize);
		legX += legEmojiSize + 2;
		doc.text('monte \u00e0 la case = \u00c9chelle (avance!)', legX, legY);
	}

	let pageIndex = 0;
	function renderNext() {
		if (pageIndex >= currentBoards.length) {
			const sub = elFocus.value.trim();
			let fname = 'serpents_et_echelles';
			if (sub) {
				fname +=
					'_' +
					sub
						.replace(
							/[^a-zA-Z0-9\u00e0\u00e2\u00e4\u00e9\u00e8\u00ea\u00eb\u00ef\u00ee\u00f4\u00f9\u00fb\u00fc\u00e7\u00c0\u00c2\u00c4\u00c9\u00c8\u00ca\u00cb\u00cf\u00ce\u00d4\u00d9\u00db\u00dc\u00c7]+/g,
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
			currentBoards.length +
			'\u2026';

		if (pageIndex > 0) doc.addPage('letter', 'landscape');

		drawPage(currentBoards[pageIndex]);
		pageIndex++;
		setTimeout(renderNext, 10);
	}

	renderNext();
}

function generate() {
	const words = getWords();
	if (words.length < MIN_WORDS) return;

	const boards = generateBoards();
	renderPreview(boards);
	elBtnGen.textContent = 'Regenerate';
}

// Events
elWords.addEventListener('input', updateStatus);

elBtnGen.addEventListener('click', generate);

elBtnDl.addEventListener('click', downloadPDF);
elBtnDl2.addEventListener('click', downloadPDF);

elBtnShuffle.addEventListener('click', () => {
	const boards = generateBoards();
	renderPreview(boards);
});

updateStatus();
