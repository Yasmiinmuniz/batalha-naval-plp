import { attack, createGame, getGame, getRanking, move } from './api.js';
import { applyGameSnapshot, getState, setState, resetSetupState } from './state.js';
import { mapDifficultyToApi } from './campaignView.js';

function withLoading(asyncAction) {
  return async (...args) => {
    setState({ loading: true, error: '' });
    try {
      await asyncAction(...args);
    } catch (error) {
      setState({ error: error.message || 'Erro inesperado.' });
    } finally {
      setState({ loading: false });
    }
  };
}

function applyLegacyTurnResult(response, row, col) {
  const state = getState();
  const boards = {
    player: state.boards.player.map((r) => r.map((c) => ({ ...c }))),
    enemy: state.boards.enemy.map((r) => r.map((c) => ({ ...c }))),
  };

  if (response.player) {
    const mark = String(response.player.status || '').toUpperCase() === 'HIT' ? 'HIT' : 'MISS';
    boards.enemy[row][col].mark = mark;
  }

  if (response.ai) {
    const mark = String(response.ai.status || '').toUpperCase() === 'HIT' ? 'HIT' : 'MISS';
    boards.player[response.ai.row][response.ai.col].mark = mark;
  }

  setState({
    boards,
    status: response.gameOver ? (String(response.winner || '').toUpperCase() === 'PLAYER' ? 'PLAYER_WIN' : 'AI_WIN') : state.status,
    turn: 'PLAYER',
  });
}

export const startNewGame = withLoading(async ({ playerName, difficulty, mode }) => {
  resetSetupState();

  const created = await createGame({
    playerName,
    difficulty: mapDifficultyToApi(difficulty),
    mode,
  });

  const gameId = created.id || created.gameId;
  const state = getState();
  const freshPlayer = state.boards.player.map((r) => r.map(() => ({ mark: 'UNKNOWN', hasShip: false })));
  const freshEnemy = state.boards.enemy.map((r) => r.map(() => ({ mark: 'UNKNOWN', hasShip: false })));

  setState({
    gameId,
    mode,
    difficulty,
    status: 'IN_PROGRESS',
    turn: 'PLAYER',
    boards: { player: freshPlayer, enemy: freshEnemy },
  });

  if (created.game || created.boards || created.playerBoard) {
    applyGameSnapshot(created);
    return;
  }

  try {
    const snapshot = await getGame(gameId);
    applyGameSnapshot(snapshot);
  } catch (_error) {
  }
});

export const attackCell = withLoading(async (row, col) => {
  const state = getState();
  if (!state.gameId || state.turn !== 'PLAYER' || state.status !== 'IN_PROGRESS' || state.setup.phase !== 'done') return;

  const response = await attack(state.gameId, row, col);
  if (response.game || response.boards || response.playerBoard) {
    applyGameSnapshot(response);
    return;
  }

  try {
    const snapshot = await getGame(state.gameId);
    applyGameSnapshot(snapshot);
  } catch (_error) {
    applyLegacyTurnResult(response, row, col);
  }
});

export const moveShip = withLoading(async (fromRow, fromCol, toRow, toCol) => {
  const state = getState();
  if (!state.gameId || state.mode !== 'dynamic' || state.turn !== 'PLAYER' || state.status !== 'IN_PROGRESS') return;

  const response = await move(state.gameId, fromRow, fromCol, toRow, toCol);
  if (response.game || response.boards || response.playerBoard) {
    applyGameSnapshot(response);
    return;
  }

  try {
    const snapshot = await getGame(state.gameId);
    applyGameSnapshot(snapshot);
  } catch (_error) {
    setState({ error: 'Endpoint /game/:id/move não disponível no backend atual.' });
  }
});

export const refreshRanking = withLoading(async () => {
  try {
    const ranking = await getRanking();
    setState({ ranking: Array.isArray(ranking) ? ranking : ranking.ranking || [] });
  } catch (_error) {
    setState({ ranking: [] });
  }
});