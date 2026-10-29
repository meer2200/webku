const BOARD_SIZE = 10;
const SHAPES = [
  [[0, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [0, 1], [0, 2], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [2, 1]],
  [[0, 1], [1, 0], [1, 1], [1, 2]],
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]],
  [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]],
  [[0, 0], [0, 1], [1, 1], [1, 2]],
  [[0, 1], [0, 2], [1, 0], [1, 1]],
  [[0, 0], [1, 0], [1, 1], [2, 1]]
];

const boardElement = document.getElementById('board');
const piecesElement = document.getElementById('pieces');
const scoreElement = document.getElementById('score');
const bestElement = document.getElementById('bestScore');
const hintElement = document.getElementById('pieceHint');
const gameOverElement = document.getElementById('gameOver');
let board;
let pieces;
let selectedPiece = -1;
let score = 0;
let bestScore = Number(localStorage.getItem('blockPuzzleBest')) || 0;
let hoverCell = null;

function createBoard() {
  boardElement.innerHTML = '';
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, empty`);
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.addEventListener('click', () => placePiece(row, col));
      cell.addEventListener('mouseenter', () => { hoverCell = [row, col]; renderBoard(); });
      boardElement.appendChild(cell);
    }
  }
}

function randomPiece() {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return shape.map(([row, col]) => [row, col]);
}

function renderPieces() {
  piecesElement.innerHTML = '';
  pieces.forEach((shape, index) => {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = `piece-slot${selectedPiece === index ? ' selected' : ''}`;
    slot.disabled = !shape;
    slot.setAttribute('aria-label', shape ? `Select piece ${index + 1}, ${shape.length} blocks` : `Piece ${index + 1} used`);
    if (shape) {
      const preview = document.createElement('span');
      preview.className = 'mini-piece';
      const maxRow = Math.max(...shape.map(([row]) => row));
      const maxCol = Math.max(...shape.map(([, col]) => col));
      preview.style.gridTemplateRows = `repeat(${maxRow + 1}, 12px)`;
      preview.style.gridTemplateColumns = `repeat(${maxCol + 1}, 12px)`;
      shape.forEach(([row, col]) => {
        const block = document.createElement('span');
        block.className = 'mini-cell on';
        block.style.gridRow = row + 1;
        block.style.gridColumn = col + 1;
        preview.appendChild(block);
      });
      slot.appendChild(preview);
      slot.addEventListener('click', () => {
        selectedPiece = selectedPiece === index ? -1 : index;
        hintElement.textContent = selectedPiece < 0 ? 'Tap a piece to select it' : 'Now tap a spot on the board';
        renderPieces();
        renderBoard();
      });
    }
    piecesElement.appendChild(slot);
  });
}

function canPlace(shape, row, col) {
  return shape.every(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && !board[r][c];
  });
}

function renderBoard() {
  const cells = boardElement.children;
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cell = cells[row * BOARD_SIZE + col];
      const filled = board[row][col];
      cell.classList.toggle('filled', filled);
      cell.classList.remove('preview-valid', 'preview-invalid');
      cell.setAttribute('aria-label', `Row ${row + 1}, column ${col + 1}, ${filled ? 'filled' : 'empty'}`);
    }
  }
  if (selectedPiece < 0 || !pieces[selectedPiece] || !hoverCell) return;
  const [row, col] = hoverCell;
  const valid = canPlace(pieces[selectedPiece], row, col);
  pieces[selectedPiece].forEach(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
      cells[r * BOARD_SIZE + c].classList.add(valid ? 'preview-valid' : 'preview-invalid');
    }
  });
}

function placePiece(row, col) {
  if (selectedPiece < 0 || !pieces[selectedPiece]) {
    hintElement.textContent = 'Choose a piece first';
    return;
  }
  const shape = pieces[selectedPiece];
  if (!canPlace(shape, row, col)) {
    hintElement.textContent = 'That piece won’t fit there';
    return;
  }

  shape.forEach(([dr, dc]) => { board[row + dr][col + dc] = true; });
  score += shape.length;
  const fullRows = board.map(line => line.every(Boolean));
  const fullCols = Array.from({ length: BOARD_SIZE }, (_, colIndex) => board.every(line => line[colIndex]));
  const clearedLines = fullRows.filter(Boolean).length + fullCols.filter(Boolean).length;
  if (clearedLines) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (fullRows[r] || fullCols[c]) board[r][c] = false;
      }
    }
    score += clearedLines * 10;
  }

  pieces[selectedPiece] = null;
  selectedPiece = -1;
  hoverCell = null;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('blockPuzzleBest', bestScore);
  }
  scoreElement.textContent = score;
  bestElement.textContent = bestScore;
  hintElement.textContent = clearedLines ? `Great! ${clearedLines} line${clearedLines === 1 ? '' : 's'} cleared` : 'Nice move! Choose your next piece';

  if (pieces.every(piece => !piece)) pieces = [randomPiece(), randomPiece(), randomPiece()];
  renderPieces();
  renderBoard();
  if (!hasAnyMoves()) gameOverElement.hidden = false;
}

function hasAnyMoves() {
  return pieces.some(shape => shape && board.some((line, row) =>
    line.some((_, col) => canPlace(shape, row, col))
  ));
}

function newGame() {
  board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));
  pieces = [randomPiece(), randomPiece(), randomPiece()];
  score = 0;
  selectedPiece = -1;
  hoverCell = null;
  scoreElement.textContent = '0';
  bestElement.textContent = bestScore;
  hintElement.textContent = 'Tap a piece to select it';
  gameOverElement.hidden = true;
  renderPieces();
  renderBoard();
}

createBoard();
document.getElementById('newGameButton').addEventListener('click', newGame);
document.getElementById('playAgainButton').addEventListener('click', newGame);
bestElement.textContent = bestScore;
newGame();
