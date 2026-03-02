import { BOARD_SIZE, MEDAL_CATALOG } from './state.js';
import { renderRanking } from './rankingView.js';
import { modeLabel } from './campaignView.js';

function cellCss(cell, owner) {
  const classes = ['cell'];

  if (owner === 'player' && cell.hasShip) classes.push('ship');
  if (cell.mark === 'HIT') classes.push('hit');
  if (cell.mark === 'MISS') classes.push('miss');
  if (cell.mark === 'SUNK') classes.push('sunk');

  return classes.join(' ');
}

function drawBoard(container, board, owner, onCellClick, clickEnabled) {
  container.innerHTML = '';

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const cell = board[row][col];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = cellCss(cell, owner);
      button.dataset.row = String(row);
      button.dataset.col = String(col);
      button.disabled = !clickEnabled;

      if (clickEnabled) {
        button.addEventListener('click', () => onCellClick(row, col));
      }

      container.append(button);
    }
  }
}

function renderMedals(listElement, medals = []) {
  listElement.innerHTML = '';

  MEDAL_CATALOG.forEach((medal) => {
    const li = document.createElement('li');
    li.textContent = medals.includes(medal) ? `🏅 ${medal}` : `▫️ ${medal}`;
    listElement.append(li);
  });
}

export function renderApp(state, refs, handlers) {
  const isPlayerTurn = state.turn === 'PLAYER';
  const inProgress = state.status === 'IN_PROGRESS';

  const statusMap = {
    IN_PROGRESS: 'Em andamento',
    PLAYER_WIN: 'Vitória do Jogador',
    AI_WIN: 'Vitória da IA',
  };

  refs.turnText.textContent = isPlayerTurn ? 'Seu turno' : 'Turno da IA';
  refs.statusText.textContent = statusMap[state.status] || state.status;
  refs.scoreText.textContent = String(state.score);
  refs.loadingText.textContent = state.loading ? 'Aguarde, sincronizando com servidor...' : `Modo ativo: ${modeLabel(state.mode)}`;
  refs.errorText.textContent = state.error;

  refs.dynamicPanel.classList.toggle('hidden', state.mode !== 'dynamic');

  drawBoard(
    refs.playerBoard,
    state.boards.player,
    'player',
    handlers.onPlayerBoardCellClick,
    state.setup.phase === 'placing' && !state.loading,
  );
  drawBoard(
    refs.enemyBoard,
    state.boards.enemy,
    'enemy',
    handlers.onEnemyBoardCellClick,
    isPlayerTurn && inProgress && !state.loading && state.setup.phase === 'done',
  );

  refs.moveBtn.disabled = !(state.mode === 'dynamic' && isPlayerTurn && inProgress && !state.loading);
  refs.newGameBtn.disabled = state.loading;
  refs.rotateBtn.disabled = !(state.setup.phase === 'placing') || state.loading;
  refs.nextShipText.textContent = state.setup.shipQueue.length ? `${state.setup.shipQueue[0]} casas (${state.setup.orientation})` : 'Frota posicionada';

  renderMedals(refs.medalsList, state.medals);
  renderRanking(refs.rankingContainer, state.ranking);
}