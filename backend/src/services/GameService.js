const { randomUUID } = require('crypto');

const BOARD_SIZE = 10;
const SHIP_SIZES = [6, 6, 4, 4, 3, 1];

function createBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({ hasShip: false, wasShot: false })),
  );
}

function insideBoard(row, col) {
  return row >= 0 && col >= 0 && row < BOARD_SIZE && col < BOARD_SIZE;
}

function getShipCells(size, row, col, orientation) {
  return Array.from({ length: size }, (_, index) => ({
    row: orientation === 'vertical' ? row + index : row,
    col: orientation === 'horizontal' ? col + index : col,
  }));
}

function canPlaceShip(board, size, row, col, orientation) {
  return getShipCells(size, row, col, orientation)
    .every(({ row: r, col: c }) => insideBoard(r, c) && !board[r][c].hasShip);
}

function placeShip(board, size, row, col, orientation) {
  if (!canPlaceShip(board, size, row, col, orientation)) return false;
  getShipCells(size, row, col, orientation).forEach(({ row: r, col: c }) => {
    board[r][c].hasShip = true;
  });
  return true;
}

function randomPlaceShips(board) {
  SHIP_SIZES.forEach((size) => {
    let placed = false;
    while (!placed) {
      const row = Math.floor(Math.random() * BOARD_SIZE);
      const col = Math.floor(Math.random() * BOARD_SIZE);
      const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
      placed = placeShip(board, size, row, col, orientation);
    }
  });
}

function allShipsDestroyed(board) {
  return board.flat().every((cell) => !cell.hasShip || cell.wasShot);
}

function randomUnshot(board) {
  const options = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (!board[row][col].wasShot) options.push({ row, col });
    }
  }
  return options[Math.floor(Math.random() * options.length)];
}

function registerHitNeighbors(queue, row, col) {
  [
    { row: row - 1, col },
    { row: row + 1, col },
    { row, col: col - 1 },
    { row, col: col + 1 },
  ].forEach((coord) => {
    if (insideBoard(coord.row, coord.col)) queue.push(coord);
  });
}

class GameService {
  constructor() {
    this.games = new Map();
    this.ranking = new Map();
  }

  createGame({ playerName = 'Capitão', difficulty = 'easy' } = {}) {
    const id = randomUUID();
    const enemyBoard = createBoard();
    randomPlaceShips(enemyBoard);

    this.games.set(id, {
      id,
      playerName,
      difficulty,
      phase: 'setup',
      playerBoard: null,
      enemyBoard,
      aiTargets: [],
      gameOver: false,
      winner: null,
    });

    if (!this.ranking.has(playerName)) {
      this.ranking.set(playerName, { name: playerName, score: 0, wins: 0, losses: 0, games: 0 });
    }

    return { id, phase: 'setup' };
  }

  deployPlayerBoard(id, serializedBoard) {
    const game = this._getGame(id);
    if (game.phase !== 'setup') throw new Error('Jogo já iniciado');

    game.playerBoard = serializedBoard.map((row) =>
      row.map((cell) => ({ hasShip: Boolean(cell.hasShip), wasShot: Boolean(cell.wasShot) })),
    );
    game.phase = 'battle';
    return { ok: true, phase: game.phase };
  }

  playerAttack(id, row, col) {
    const game = this._getGame(id);
    if (game.phase !== 'battle' || game.gameOver) throw new Error('Jogo indisponível para ataque');
    if (!insideBoard(row, col)) throw new Error('Coordenada inválida');

    const enemyCell = game.enemyBoard[row][col];
    if (enemyCell.wasShot) throw new Error('Posição já atacada');

    enemyCell.wasShot = true;
    const playerStatus = enemyCell.hasShip ? 'hit' : 'miss';

    if (allShipsDestroyed(game.enemyBoard)) {
      game.gameOver = true;
      game.winner = 'player';
      this._registerGameResult(game);
      return {
        player: { row, col, status: playerStatus },
        ai: null,
        gameOver: true,
        winner: game.winner,
      };
    }

    const aiMove = this._aiAttack(game);
    if (allShipsDestroyed(game.playerBoard)) {
      game.gameOver = true;
      game.winner = 'ai';
      this._registerGameResult(game);
    }

    return {
      player: { row, col, status: playerStatus },
      ai: aiMove,
      gameOver: game.gameOver,
      winner: game.winner,
    };
  }

  getRanking() {
    return [...this.ranking.values()]
      .sort((a, b) => (b.score - a.score) || (b.wins - a.wins) || (a.losses - b.losses));
  }

  _registerGameResult(game) {
    const player = this.ranking.get(game.playerName);
    if (!player) return;

    player.games += 1;

    if (game.winner === 'player') {
      player.wins += 1;
      player.score += 100;
      return;
    }

    player.losses += 1;
    player.score = Math.max(0, player.score - 20);
  }

  _aiAttack(game) {
    let target;

    if (game.difficulty === 'easy') {
      target = randomUnshot(game.playerBoard);
    } else {
      while (game.aiTargets.length) {
        const candidate = game.aiTargets.shift();
        if (!game.playerBoard[candidate.row][candidate.col].wasShot) {
          target = candidate;
          break;
        }
      }

      if (!target && game.difficulty === 'hard') {
        const parityCandidates = [];
        for (let row = 0; row < BOARD_SIZE; row += 1) {
          for (let col = 0; col < BOARD_SIZE; col += 1) {
            if (!game.playerBoard[row][col].wasShot && (row + col) % 2 === 0) {
              parityCandidates.push({ row, col });
            }
          }
        }
        if (parityCandidates.length) {
          target = parityCandidates[Math.floor(Math.random() * parityCandidates.length)];
        }
      }

      if (!target) target = randomUnshot(game.playerBoard);
    }

    const cell = game.playerBoard[target.row][target.col];
    cell.wasShot = true;
    const status = cell.hasShip ? 'hit' : 'miss';

    if (status === 'hit') {
      registerHitNeighbors(game.aiTargets, target.row, target.col);
    }

    return { row: target.row, col: target.col, status };
  }

  _getGame(id) {
    const game = this.games.get(id);
    if (!game) throw new Error('Partida não encontrada');
    return game;
  }
}

module.exports = GameService;