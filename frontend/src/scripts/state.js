export const BOARD_SIZE = 10;
export const SHIP_SIZES = [5, 4, 3, 3, 2];

export function createBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({ hasShip: false, wasShot: false })),
  );
}

export function createInitialState() {
  return {
    playerName: 'Capitão',
    difficulty: 'easy',
    orientation: 'horizontal',
    phase: 'setup',
    currentShipIndex: 0,
    playerBoard: createBoard(),
    enemyBoard: createBoard(),
    enemyTargets: [],
    hoverRow: null,
    hoverCol: null,
    gameOver: false,
    battleLog: '',
  };
}

export function insideBoard(row, col) {
  return row >= 0 && col >= 0 && row < BOARD_SIZE && col < BOARD_SIZE;
}

export function getShipCells(size, row, col, orientation) {
  return Array.from({ length: size }, (_, index) => ({
    row: orientation === 'vertical' ? row + index : row,
    col: orientation === 'horizontal' ? col + index : col,
  }));
}

export function canPlaceShip(board, size, row, col, orientation) {
  return getShipCells(size, row, col, orientation)
    .every(({ row: r, col: c }) => insideBoard(r, c) && !board[r][c].hasShip);
}

export function placeShip(board, size, row, col, orientation) {
  if (!canPlaceShip(board, size, row, col, orientation)) return false;
  getShipCells(size, row, col, orientation).forEach(({ row: r, col: c }) => {
    board[r][c].hasShip = true;
  });
  return true;
}

export function allShipsDestroyed(board) {
  return board.flat().every((cell) => !cell.hasShip || cell.wasShot);
}