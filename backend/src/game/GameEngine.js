import Board from './Board.js';
import Ship from './Ship.js';
import Player from './Player.js';

import { randomUUID } from 'crypto';

const GameState = {
  SETUP_PLAYER_1: 'setup_player_1',
  SETUP_PLAYER_2: 'setup_player_2',
  PLAYING: 'playing',
  GAME_OVER: 'game_over'
};

export default class GameEngine {
  constructor(options = {}) {
    this.mode = options.mode || 'IA'; // 'PVP' ou 'IA']
    this.gameMode = options.gameMode || 'classic'; // 'classic', 'dynamic' ou 'campaign'
    this.callbacks = options.callbacks || {};

    this.players = [
      new Player(1, 'Player 1', 'human'),
      (this.mode === 'IA') 
        ? new Player(2, 'Computer', 'computer') 
        : new Player(2, 'Player 2', 'human')
    ];

    //cria o tabuleiro para cada jogador
    this.players.forEach(p => {
      const b = new Board();
      p.setBoard(b);
    });

    // tipos de navio
    this.shipTemplate = options.shipTemplate || [
      { type: 'porta-aviao', size: 6 },
      { type: 'porta-aviao', size: 6 },
      { type: 'guerra', size: 4 },
      { type: 'guerra', size: 4 },
      { type: 'encouracado', size: 3 },
      { type: 'submarine', size: 1 },
    ];

    // lista de navios não posicionados
    this.remainingToPlace = {};
    this.players.forEach(p => {
      this.remainingToPlace[p.id] = this.shipTemplate.map(s => ({ ...s }));
    });

    this.state = GameState.SETUP_PLAYER_1;
    this.currentPlayerIndex = 0; // 0 = player1, 1 = player2

    this._validateCallbacks();
    this._triggerUpdate();
  }

  _validateCallbacks() {
    const allowed = ['onUpdate','onInvalidPlacement','onShipPlaced','onAllPlaced','onMoveResult','onGameOver'];
    Object.keys(this.callbacks).forEach(k => {
      if (!allowed.includes(k)) delete this.callbacks[k];
    });
  }

  _trigger(name, payload) {
  const cb = this.callbacks[name];
  if (typeof cb === 'function') {
    cb(payload);
  }
}

  _triggerUpdate() {
    this._trigger('onUpdate', this.getPublicState());
  }

  _invalidPlacement(reason, detail) {
    this._trigger('onInvalidPlacement', { reason, detail });
    return { success: false, reason, detail };
  }

  placeShipForCurrentPlayer(shipType, row, col, orientation = 'horizontal') {
    const player = this.players[this.currentPlayerIndex];
    const playerId = player.id;
    const remaining = this.remainingToPlace[playerId];

    // verificar se o navio que o jogador quer posicionar está disponível
    let desiredIndex = -1;
    
    desiredIndex = remaining.findIndex(s => s.size === shipType);
    
    if (typeof shipType === 'string') {
      desiredIndex = remaining.findIndex(s => s.type === shipType);
    }
    if (desiredIndex === -1) {
      return this._invalidPlacement('ship-not-available', { detail: { shipType } });
    }

    const shipDef = remaining[desiredIndex];
    const shipId = `${shipDef.type}-${randomUUID()}`;
    const ship = new Ship(shipId, shipDef.type, shipDef.size);
    orientation = orientation === 'vertical' ? 'vertical' : 'horizontal';

    
    // valida posição do navio
    const board = player.board;
    if (!board.isValidPlacement(ship, row, col, orientation)) {
      return this._invalidPlacement('invalid-placement', { detail: { row, col, orientation } });
    }

    // posiciona navio
    try {
      board.placeShip(ship, row, col, orientation);
    } catch (err) {
      return this._invalidPlacement('place-error', { detail: err.message });
    }

    // remove navio da lista de não posicionados
    remaining.splice(desiredIndex, 1);

    // notificar posicionamento bem-sucedido
    this._trigger('onShipPlaced', { playerId, ship: { id: ship.id, type: ship.type, size: ship.size }, row, col, orientation });

    // verifica se todos os navios foram posicionados
    if (remaining.length === 0) {
      this._trigger('onAllPlaced', playerId);
      this._advanceSetupOrStart();
    } else {
      this._triggerUpdate();
    }

    return { success: true, ship: { id: ship.id, type: ship.type, size: ship.size } };
  }
  

  _advanceSetupOrStart() {
    // avança estado de setup ou inicia jogo
    if (this.state === GameState.SETUP_PLAYER_1) {
      this.state = GameState.SETUP_PLAYER_2;
      this.currentPlayerIndex = 1;
      this._triggerUpdate();
      return;
    }

    if (this.state === GameState.SETUP_PLAYER_2) {
      // todos os jogadores posicionaram navios - iniciar jogo
      this.state = GameState.PLAYING;
      this.currentPlayerIndex = 0; 
      this._triggerUpdate();
      return;
    }
  }

  // confirma que o jogador atual terminou de posicionar os navios
  confirmSetupForCurrentPlayer() {
  const remaining = this.remainingToPlace[this.getCurrentPlayer().id];
  if (remaining.length > 0) {
    return this._invalidPlacement('setup-incomplete', { remaining });
  }
  this._advanceSetupOrStart();
}

  // getters
  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  getOpponentPlayer() {
    return this.players[1 - this.currentPlayerIndex];
  }

  //método para movimentar navios (modo dinamico)
  moveShip(shipId, direction) {
    if (this.gameMode !== 'dynamic' && this.gameMode !== 'dinamico') {
        return { success: false, reason: 'invalid-mode', detail: "Movimentação só permitida no modo dinâmico" };
    } 

    if(this.state !== GameState.PLAYING){
        return { success: false, reason: 'not-playing', detail: "O jogo não está em andamento" };
    }
    const player = this.getCurrentPlayer();
    
    if(player.hasMovedThisTurn){
        return { success: false, reason: 'already-moved', detail: "O jogador já movimentou um navio neste turno" };
    }
    const ship = player.board.ships.find(s => s.id === shipId);
    if(!ship){
        return { success: false, reason: 'ship-not-found', detail: "Navio não encontrado." };
    }
    try {
        player.board.moveShip(ship, direction);
        player.hasMovedThisTurn = true;
        this._triggerUpdate();
        return { success: true, shipId, direction };
    } catch (err) {
        return { success: false, reason: 'move-error', detail: err.message };
    }
  }

  attack(row, col) {
    if (this.state !== GameState.PLAYING) {
      throw new Error("O jogo não está em andamento.");
    }

    const player = this.getCurrentPlayer();
    const opponent = this.getOpponentPlayer();

    // realizar ataque
    let result;
    try {
      result = player.attack(opponent, row, col);
    } catch (err) {
      this._trigger('onInvalidPlacement', { reason: 'attack-error', detail: err.message });
      throw err;
    }

    // notificar resultado para UI
    this._trigger('onMoveResult', { playerId: player.id, row, col, result });

    // checar vitória
    if (opponent.board.allShipsSunk()) {
      this.state = GameState.GAME_OVER;
      this._trigger('onGameOver', { winner: player });
      this._triggerUpdate();
      return { result, winner: player };
    }

    // trocar turno se o resultado foi miss; se hit/sunk o jogo mantém o turno.
    const wasMiss = result.status === 'miss';
    if (wasMiss) {
      this._switchTurn();
    } 
    else {
      player.hasMovedThisTurn = false; //reseta a movimentação para o próximo turno
    }

    this._triggerUpdate();
    return { result, nextPlayer: this.getCurrentPlayer() };
  }

  _switchTurn() {
    this.currentPlayerIndex = 1 - this.currentPlayerIndex;
    this.getCurrentPlayer().hasMovedThisTurn = false; //reseta a movimentação para o próximo turno
  }

  // comunicação com a UI
  getPublicState() {
    return {
      state: this.state,
      gameMode: this.gameMode,
      currentPlayerId: this.getCurrentPlayer().id,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        hasMovedThisTurn: p.hasMovedThisTurn,
        // para a UI do dono, mostrar posições dos seus navios.
        shipsRemainingToPlace: this.remainingToPlace[p.id].map(s => ({type: s.type, size: s.size })),
        ships: p.board.ships.map(s => ({
          id: s.id,
          type: s.type,
          size: s.size,
          row: s.row,
          col: s.col,
          orientation: s.orientation,
          hits: s.hits,
          sunk: s.sunk
        })),
        attacks: p.board.attacks.slice()
      }))
    };
  }

  // reiniciar o jogo
  // volta para o posicionamento dos navios
  reset() {
    this.players.forEach(p => {
      const b = new Board();
      p.setBoard(b);
      p.hasMovedThisTurn = false;
      this.remainingToPlace[p.id] = this.shipTemplate.map(s => ({ ...s }));
    });
    this.state = GameState.SETUP_PLAYER_1;
    this.currentPlayerIndex = 0;
    this._triggerUpdate();
  }
}
