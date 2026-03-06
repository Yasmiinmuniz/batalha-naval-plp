export const BOARD_SIZE = 10;
export const SHIP_SETUP = [6, 6, 4, 4, 3, 1];

const listeners = [];

function createEmptyCell() {
  return { mark: 'UNKNOWN', hasShip: false };
}

function canPlaceShip(board, row, col, size, orientation) {
  for (let i = 0; i < size; i += 1) {
    const r = orientation === 'vertical' ? row + i : row;
    const c = orientation === 'horizontal' ? col + i : col;
    if (r < 0 || c < 0 || r >= BOARD_SIZE || c >= BOARD_SIZE) return false;
    if (board[r][c].hasShip) return false;
  }
  return true;
}

function placeShip(board, row, col, size, orientation) {
  if (!canPlaceShip(board, row, col, size, orientation)) return false;
  for (let i = 0; i < size; i += 1) {
    const r = orientation === 'vertical' ? row + i : row;
    const c = orientation === 'horizontal' ? col + i : col;
    board[r][c].hasShip = true;
  }
  return true;
}

function createEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => createEmptyCell()));
}

const state = {
  gameId: null,
  mode: 'campaign',
  difficulty: 'basic',
  turn: 'PLAYER',
  status: 'IN_PROGRESS',
  medals: [],
  score: 0,
  loading: false,
  error: '',
  ranking: [],
  boards: {
    player: createEmptyBoard(),
    enemy: createEmptyBoard(),
  },
  setup: {
    phase: 'placing',
    orientation: 'horizontal',
    shipQueue: [...SHIP_SETUP],
  },
};

export function getState() {
  return state;
}

export function setState(patch) {
  Object.assign(state, patch);
  listeners.forEach((fn) => fn(state));
}

export function subscribe(listener) {
  listeners.push(listener);
}

function normalizeMark(cell) {
  if (!cell) return 'UNKNOWN';
  if (typeof cell === 'string') return cell.toUpperCase();

  const raw = String(cell.mark || cell.status || cell.result || '').toUpperCase();
  if (raw === 'HIT' || raw === 'MISS' || raw === 'SUNK') return raw;

  if (cell.sunk) return 'SUNK';
  if (cell.hit || (cell.wasShot && cell.hasShip)) return 'HIT';
  if (cell.wasShot && !cell.hasShip) return 'MISS';

  return 'UNKNOWN';
}

function normalizeBoard(inputBoard = [], revealShips) {
  const board = createEmptyBoard();

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      const incoming = inputBoard[row]?.[col] || null;
      const mark = normalizeMark(incoming);
      const hasShip = Boolean(incoming?.hasShip);

      board[row][col] = {
        mark,
        hasShip: revealShips ? hasShip : false,
      };
    }
  }

  return board;
}

export function applyGameSnapshot(snapshot = {}) {
  const game = snapshot.game || snapshot;
  const playerBoard = game.playerBoard || game.boards?.player || [];
  const enemyBoard = game.enemyBoard || game.boards?.enemy || [];

  const winner = String(game.winner || '').toUpperCase();
  const fallbackStatus = winner === 'PLAYER' ? 'PLAYER_WIN' : winner === 'AI' ? 'AI_WIN' : 'IN_PROGRESS';

  setState({
    gameId: game.id || state.gameId,
    turn: String(game.turn || game.currentTurn || 'PLAYER').toUpperCase(),
    status: String(game.status || fallbackStatus).toUpperCase(),
    medals: Array.isArray(game.medals) ? game.medals : [],
    score: Number(game.score || 0),
    boards: {
      player: normalizeBoard(playerBoard, true),
      enemy: normalizeBoard(enemyBoard, false),
    },
    error: '',
  });
}

export const MEDAL_CATALOG = [
  'Almirante',
  'Capitão de Mar e Guerra',
  'Capitão',
  'Marinheiro',
];


export function resetSetupState() {
  setState({
    setup: {
      phase: 'placing',
      orientation: 'horizontal',
      shipQueue: [...SHIP_SETUP],
    },
  });
}

export function placeNextPlayerShip(row, col) {
  const nextSize = state.setup.shipQueue[0];
  if (!nextSize) return { ok: false, reason: 'setup-complete' };

  const playerBoard = state.boards.player.map((r) => r.map((c) => ({ ...c })));
  const placed = placeShip(playerBoard, row, col, nextSize, state.setup.orientation);
  if (!placed) return { ok: false, reason: 'invalid-placement' };

  const nextQueue = state.setup.shipQueue.slice(1);
  setState({
    boards: { ...state.boards, player: playerBoard },
    setup: {
      ...state.setup,
      shipQueue: nextQueue,
      phase: nextQueue.length ? 'placing' : 'ready',
    },
  });

  return { ok: true, remaining: nextQueue.length, placedSize: nextSize };
}

export function toggleSetupOrientation() {
  const current = state.setup.orientation;
  setState({ setup: { ...state.setup, orientation: current === 'horizontal' ? 'vertical' : 'horizontal' } });
}