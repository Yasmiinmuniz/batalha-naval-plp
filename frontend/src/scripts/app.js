import { createInitialState, placeShip, SHIP_SIZES } from './state.js';
import { renderBoards, renderStatus } from './boardView.js';
import { handlePlayerPlacement, playerAttack } from './playerActions.js';

const refs = {
  playerBoard: document.querySelector('#playerBoard'),
  enemyBoard: document.querySelector('#enemyBoard'),
  statusText: document.querySelector('#statusText'),
  shipsText: document.querySelector('#shipsText'),
  logText: document.querySelector('#logText'),
  rotateBtn: document.querySelector('#rotateBtn'),
  newGameBtn: document.querySelector('#newGameBtn'),
  difficulty: document.querySelector('#difficulty'),
  playerName: document.querySelector('#playerName'),
  playerBoardTitle: document.querySelector('#playerBoardTitle'),
};

const state = createInitialState();

function randomPlaceEnemyShips() {
  SHIP_SIZES.forEach((size) => {
    let placed = false;
    while (!placed) {
      const row = Math.floor(Math.random() * 10);
      const col = Math.floor(Math.random() * 10);
      const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      placed = placeShip(state.enemyBoard, size, row, col, orientation);
    }
  });
}

function draw() {
  renderBoards(state, refs, {
    onPlayerCellClick,
    onEnemyCellClick,
    onPlayerHover,
  });
  renderStatus(state, refs);
}

function resetGame() {
  Object.assign(state, createInitialState());
  state.playerName = refs.playerName.value.trim() || 'Capitão';
  state.difficulty = refs.difficulty.value;
  refs.playerBoardTitle.textContent = `Tabuleiro de ${state.playerName}`;
  refs.rotateBtn.textContent = 'Rotacionar navio (Horizontal)';
  randomPlaceEnemyShips();
  draw();
}

function onPlayerCellClick(event) {
  if (state.phase !== 'setup') return;
  const row = Number(event.currentTarget.dataset.row);
  const col = Number(event.currentTarget.dataset.col);
  handlePlayerPlacement(state, row, col, refs);
  draw();
}

function onEnemyCellClick(event) {
  const row = Number(event.currentTarget.dataset.row);
  const col = Number(event.currentTarget.dataset.col);
  playerAttack(state, row, col, refs);
  draw();
}

function onPlayerHover(eventOrNull) {
  if (!eventOrNull) {
    state.hoverRow = null;
    state.hoverCol = null;
  } else {
    state.hoverRow = Number(eventOrNull.currentTarget.dataset.row);
    state.hoverCol = Number(eventOrNull.currentTarget.dataset.col);
  }
  draw();
}

refs.rotateBtn.addEventListener('click', () => {
  state.orientation = state.orientation === 'horizontal' ? 'vertical' : 'horizontal';
  const mode = state.orientation === 'horizontal' ? 'Horizontal' : 'Vertical';
  refs.rotateBtn.textContent = `Rotacionar navio (${mode})`;
  draw();
});

refs.newGameBtn.addEventListener('click', resetGame);
refs.playerName.addEventListener('input', () => {
  state.playerName = refs.playerName.value.trim() || 'Capitão';
  refs.playerBoardTitle.textContent = `Tabuleiro de ${state.playerName}`;
});
refs.difficulty.addEventListener('change', () => {
  state.difficulty = refs.difficulty.value;
});

resetGame();