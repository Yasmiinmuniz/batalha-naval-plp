import { requestDeployFallback } from './api.js';
import { renderApp } from './boardView.js';
import { getState, setState, subscribe, placeNextPlayerShip, toggleSetupOrientation } from './state.js';
import { attackCell, moveShip, refreshRanking, startNewGame } from './playerActions.js';

const refs = {
  playerName: document.querySelector('#playerName'),
  modeSelect: document.querySelector('#modeSelect'),
  difficultySelect: document.querySelector('#difficultySelect'),
  rotateBtn: document.querySelector('#rotateBtn'),
  newGameBtn: document.querySelector('#newGameBtn'),
  refreshRankingBtn: document.querySelector('#refreshRankingBtn'),
  moveBtn: document.querySelector('#moveBtn'),
  fromRow: document.querySelector('#fromRow'),
  fromCol: document.querySelector('#fromCol'),
  toRow: document.querySelector('#toRow'),
  toCol: document.querySelector('#toCol'),
  turnText: document.querySelector('#turnText'),
  statusText: document.querySelector('#statusText'),
  scoreText: document.querySelector('#scoreText'),
  loadingText: document.querySelector('#loadingText'),
  nextShipText: document.querySelector('#nextShipText'),
  errorText: document.querySelector('#errorText'),
  dynamicPanel: document.querySelector('#dynamicPanel'),
  playerBoard: document.querySelector('#playerBoard'),
  enemyBoard: document.querySelector('#enemyBoard'),
  medalsList: document.querySelector('#medalsList'),
  rankingContainer: document.querySelector('#rankingContainer'),
};

function draw() {
  renderApp(getState(), refs, {
    onEnemyBoardCellClick: (row, col) => {
      attackCell(row, col);
    },
    onPlayerBoardCellClick: async (row, col) => {
      const state = getState();
      if (state.setup.phase !== 'placing' || state.loading) return;

      const result = placeNextPlayerShip(row, col);
      if (!result.ok) {
        setState({ error: 'Posição inválida para este navio.' });
        return;
      }

      if (result.remaining === 0) {
        setState({ error: '', loading: true });
        try {
          await requestDeployFallback(state.gameId, getState().boards.player);
          setState({ setup: { ...getState().setup, phase: 'done' }, error: '' });
        } catch (err) {
          setState({ error: err.message || 'Falha ao enviar frota para o backend.' });
        } finally {
          setState({ loading: false });
        }
      }
    },
  });
}

subscribe(draw);

refs.newGameBtn.addEventListener('click', () => {
  const playerName = refs.playerName.value.trim() || 'Capitão';
  const difficulty = refs.difficultySelect.value;
  const mode = refs.modeSelect.value;
  startNewGame({ playerName, difficulty, mode });
});

refs.refreshRankingBtn.addEventListener('click', () => {
  refreshRanking();
});

refs.modeSelect.addEventListener('change', () => {
  setState({ mode: refs.modeSelect.value });
});

refs.moveBtn.addEventListener('click', () => {
  moveShip(
    Number(refs.fromRow.value),
    Number(refs.fromCol.value),
    Number(refs.toRow.value),
    Number(refs.toCol.value),
  );
});

refs.rotateBtn.addEventListener('click', () => {
  toggleSetupOrientation();
  const orientation = getState().setup.orientation === 'horizontal' ? 'Horizontal' : 'Vertical';
  refs.rotateBtn.textContent = `Rotação: ${orientation}`;
});

refs.difficultySelect.value = getState().difficulty;
refs.modeSelect.value = getState().mode;

startNewGame({
  playerName: 'Capitão',
  difficulty: getState().difficulty,
  mode: getState().mode,
});
refreshRanking();