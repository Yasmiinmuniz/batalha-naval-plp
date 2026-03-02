import { BOARD_SIZE, SHIP_SIZES, canPlaceShip, getShipCells } from './state.js';

function cellClass(...tokens) {
  return ['cell', ...tokens].filter(Boolean).join(' ');
}

export function renderBoards(state, refs, handlers) {
  refs.playerBoard.innerHTML = '';
  refs.enemyBoard.innerHTML = '';

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const pCell = state.playerBoard[row][col];
      const playerCell = document.createElement('button');
      playerCell.type = 'button';
      playerCell.className = cellClass(
        pCell.hasShip && 'ship',
        pCell.wasShot && (pCell.hasShip ? 'hit' : 'miss'),
      );
      playerCell.dataset.row = String(row);
      playerCell.dataset.col = String(col);
      playerCell.addEventListener('click', handlers.onPlayerCellClick);

      if (state.phase === 'setup') {
        playerCell.addEventListener('mouseenter', handlers.onPlayerHover);
        playerCell.addEventListener('mouseleave', () => handlers.onPlayerHover(null));
      }

      refs.playerBoard.append(playerCell);

      const eCell = state.enemyBoard[row][col];
      const enemyCell = document.createElement('button');
      enemyCell.type = 'button';
      enemyCell.className = cellClass('enemy', eCell.wasShot && (eCell.hasShip ? 'hit' : 'miss'));
      enemyCell.disabled = state.phase !== 'battle' || eCell.wasShot || state.gameOver;
      enemyCell.dataset.row = String(row);
      enemyCell.dataset.col = String(col);
      enemyCell.addEventListener('click', handlers.onEnemyCellClick);
      refs.enemyBoard.append(enemyCell);
    }
  }

  if (state.phase === 'setup' && Number.isInteger(state.hoverRow) && Number.isInteger(state.hoverCol)) {
    const size = SHIP_SIZES[state.currentShipIndex];
    if (!size) return;

    const valid = canPlaceShip(state.playerBoard, size, state.hoverRow, state.hoverCol, state.orientation);
    getShipCells(size, state.hoverRow, state.hoverCol, state.orientation).forEach(({ row, col }) => {
      if (row < 0 || col < 0 || row >= BOARD_SIZE || col >= BOARD_SIZE) return;
      const idx = row * BOARD_SIZE + col;
      const el = refs.playerBoard.children[idx];
      if (el) el.classList.add(valid ? 'preview' : 'preview-invalid');
    });
  }
}

export function renderStatus(state, refs) {
  if (!state.gameOver && state.phase === 'setup') {
    const remaining = SHIP_SIZES.slice(state.currentShipIndex);
    const currentShip = SHIP_SIZES[state.currentShipIndex];
    refs.statusText.textContent = currentShip
      ? `Posicione o navio de tamanho ${currentShip}.`
      : 'Preparando batalha...';
    refs.shipsText.textContent = `Próximos navios: ${remaining.join(', ') || 'nenhum'}`;
  }

  if (state.phase === 'battle') {
    refs.shipsText.textContent = '';
  }

  refs.logText.textContent = state.battleLog;
}