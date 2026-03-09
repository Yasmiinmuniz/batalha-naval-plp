export const FLEET = [
  { id: 'porta1', name: 'Porta Aviões 1', size: 6 },
  { id: 'porta2', name: 'Porta Aviões 2', size: 6 },
  { id: 'guerra1', name: 'Navio de Guerra 1', size: 4 },
  { id: 'guerra2', name: 'Navio de Guerra 2', size: 4 },
  { id: 'encoura1', name: 'Encouraçado', size: 3 },
  { id: 'sub1', name: 'Submarino', size: 1 }
];

export function createEmptyBoard() {
  return Array(100).fill('empty');
}

// Verifica se cabe
export function canPlaceShip(board, startIdx, size, isHorizontal) {
  const row = Math.floor(startIdx / 10);
  const col = startIdx % 10;

  if (isHorizontal && col + size > 10) return false;
  if (!isHorizontal && row + size > 10) return false;

  for (let i = 0; i < size; i++) {
    const idx = isHorizontal ? startIdx + i : startIdx + i * 10;
    if (board[idx] !== 'empty') return false;
  }
  return true;
}

// Coloca manualmente no array (usado tanto pelo aleatório quanto pelo click)
export function placeShipManual(board, startIdx, size, isHorizontal, prefix, shipId) {
  let newBoard = [...board];
  if (size === 1) {
    newBoard[startIdx] = `${prefix}-single-${shipId}`;
    return newBoard;
  }
  for (let i = 0; i < size; i++) {
    const idx = isHorizontal ? startIdx + i : startIdx + i * 10;
    let part = 'body';
    if (i === 0) part = isHorizontal ? 'left' : 'top';
    if (i === size - 1) part = isHorizontal ? 'right' : 'bottom';
    newBoard[idx] = `${prefix}-${part}-${shipId}`;
  }
  return newBoard;
}

// Gera aleatório completo
export function generateRandomBoard(isOpponent = false) {
  let board = createEmptyBoard();
  const prefix = isOpponent ? 'oppship' : 'myship';

  FLEET.forEach(ship => {
    let placed = false;
    while (!placed) {
      const isHorizontal = Math.random() < 0.5;
      const startIdx = Math.floor(Math.random() * 100);

      if (canPlaceShip(board, startIdx, ship.size, isHorizontal)) {
        board = placeShipManual(board, startIdx, ship.size, isHorizontal, prefix, ship.id);
        placed = true;
      }
    }
  });
  return board;
}

export function moveShip(board, shipId, dx, dy) {
  const shipCells = [];
  board.forEach((cell, idx) => {
    if (cell.includes(shipId)) {
      shipCells.push({ idx, value: cell });
    }
  });

  if (shipCells.length === 0) return null; // Navio não encontrado (ou já afundou)

  let canMove = true;
  const newShipPositions = [];
  
  for (let { idx } of shipCells) {
    const row = Math.floor(idx / 10);
    const col = idx % 10;
    const newRow = row + dy;
    const newCol = col + dx;
    const newIdx = newRow * 10 + newCol;

    // Bateu na borda do mapa?
    if (newRow < 0 || newRow > 9 || newCol < 0 || newCol > 9) {
      canMove = false; break;
    }
    
    // Bateu em outro navio que não seja ele mesmo?
    if (board[newIdx] !== 'empty' && board[newIdx] !== 'miss' && !board[newIdx].includes(shipId)) {
       canMove = false; break;
    }
    newShipPositions.push(newIdx);
  }

  if (!canMove) return null; // Movimento inválido

  const newBoard = [...board];
  
  // Limpa a posição antiga (deixa 'empty')
  shipCells.forEach(({ idx }) => {
    newBoard[idx] = 'empty'; 
  });

  // Desenha na nova posição (carregando os 'hits' junto se já tiver tomado dano)
  shipCells.forEach(({ value }, i) => {
    newBoard[newShipPositions[i]] = value;
  });

  return newBoard;
}