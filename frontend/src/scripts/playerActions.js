import { SHIP_SIZES, allShipsDestroyed, placeShip } from './state.js';
import { getAiTarget, registerHitNeighbors } from './campaignView.js';

function formatCoord(row, col) {
  return `(${row + 1}, ${col + 1})`;
}

export function handlePlayerPlacement(state, row, col, refs) {
  const size = SHIP_SIZES[state.currentShipIndex];
  if (!size) return;

  const success = placeShip(state.playerBoard, size, row, col, state.orientation);
  if (!success) {
    refs.statusText.textContent = 'Posição inválida para este navio.';
    return;
  }

  state.currentShipIndex += 1;

  if (state.currentShipIndex >= SHIP_SIZES.length) {
    state.phase = 'battle';
    refs.statusText.textContent = 'Batalha iniciada! Ataque o tabuleiro inimigo.';
    state.battleLog = 'A IA está aguardando seu primeiro disparo.';
  }
}

export function playerAttack(state, row, col, refs) {
  if (state.phase !== 'battle' || state.gameOver) return;

  const enemyCell = state.enemyBoard[row][col];
  if (enemyCell.wasShot) return;

  enemyCell.wasShot = true;
  const playerResult = enemyCell.hasShip ? 'acerto' : 'água';

  if (allShipsDestroyed(state.enemyBoard)) {
    state.gameOver = true;
    refs.statusText.textContent = `${state.playerName} venceu! 🚢`;
    state.battleLog = `Seu disparo em ${formatCoord(row, col)} foi ${playerResult}. Fim de jogo.`;
    return;
  }

  const aiResult = aiTurn(state);
  refs.statusText.textContent = `Você: ${playerResult} em ${formatCoord(row, col)}.`;
  state.battleLog = aiResult;
}

export function aiTurn(state) {
  if (state.gameOver) return '';

  const target = getAiTarget(state);
  const cell = state.playerBoard[target.row][target.col];
  cell.wasShot = true;

  let result = 'água';
  if (cell.hasShip) {
    result = 'acerto';
    registerHitNeighbors(state.enemyTargets, target.row, target.col);
  }

  if (allShipsDestroyed(state.playerBoard)) {
    state.gameOver = true;
    return `IA: ${result} em ${formatCoord(target.row, target.col)}. A IA venceu esta campanha.`;
  }

  return `IA: ${result} em ${formatCoord(target.row, target.col)}.`;
}