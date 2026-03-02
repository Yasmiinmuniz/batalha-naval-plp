import { BOARD_SIZE } from './state.js';

function randomUnshot(board) {
  const options = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (!board[row][col].wasShot) options.push({ row, col });
    }
  }
  return options[Math.floor(Math.random() * options.length)];
}

function mediumTarget(board, queue) {
  while (queue.length) {
    const target = queue.shift();
    if (!board[target.row][target.col].wasShot) return target;
  }
  return randomUnshot(board);
}

function hardTarget(board, queue) {
  while (queue.length) {
    const target = queue.shift();
    if (!board[target.row][target.col].wasShot) return target;
  }

  const parityCandidates = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (!board[row][col].wasShot && (row + col) % 2 === 0) {
        parityCandidates.push({ row, col });
      }
    }
  }

  if (parityCandidates.length) {
    return parityCandidates[Math.floor(Math.random() * parityCandidates.length)];
  }

  return randomUnshot(board);
}

export function getAiTarget(state) {
  if (state.difficulty === 'easy') return randomUnshot(state.playerBoard);
  if (state.difficulty === 'medium') return mediumTarget(state.playerBoard, state.enemyTargets);
  return hardTarget(state.playerBoard, state.enemyTargets);
}

export function registerHitNeighbors(queue, row, col) {
  const neighbors = [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ];

  neighbors.forEach((coord) => {
    if (coord.row >= 0 && coord.col >= 0 && coord.row < BOARD_SIZE && coord.col < BOARD_SIZE) {
      queue.push(coord);
    }
  });
}