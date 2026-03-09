export const mapBackendToFrontendBoard = (playerData, isOpponent) => {
    // Começa com água limpa
    const board = Array(100).fill('empty');
    const prefix = isOpponent ? 'oppship' : 'myship';

    // Se o jogador ainda não existe no estado, retorna vazio
    if (!playerData) return board;

    // 1. Desenha os Navios no tabuleiro
    playerData.ships.forEach(ship => {
        for (let i = 0; i < ship.size; i++) {
            const r = ship.orientation === 'vertical' ? ship.row + i : ship.row;
            const c = ship.orientation === 'horizontal' ? ship.col + i : ship.col;
            const idx = r * 10 + c;

            let part = 'body';
            if (ship.size === 1) part = 'single';
            else if (i === 0) part = ship.orientation === 'horizontal' ? 'left' : 'top';
            else if (i === ship.size - 1) part = ship.orientation === 'horizontal' ? 'right' : 'bottom';

            // Se afundou, já pinta de sunk direto
            board[idx] = ship.sunk ? `sunk-${part}-${ship.id}` : `${prefix}-${part}-${ship.id}`;
        }
    });

    // 2. Desenha os Ataques (Tiros na água ou acertos não-afundados)
    playerData.attacks.forEach(attackStr => {
        const [r, c] = attackStr.split(',').map(Number);
        const idx = r * 10 + c;

        if (board[idx].includes(prefix) && !board[idx].startsWith('sunk')) {
            // Acertou um pedaço do navio
            board[idx] = board[idx].replace(prefix, 'hit');
        } else if (!board[idx].includes(prefix) && !board[idx].startsWith('sunk')) {
            // Tiro na água
            board[idx] = 'miss';
        }
    });

    // 3. Névoa de Guerra: Esconde os navios intactos se for o tabuleiro inimigo
    if (isOpponent) {
        for (let i = 0; i < 100; i++) {
            if (board[i].startsWith('oppship')) {
                board[i] = 'empty';
            }
        }
    }

    return board;
};