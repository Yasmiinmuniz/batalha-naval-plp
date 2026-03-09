import GameEngine from '../game/GameEngine.js';
import CampaignManager from '../game/CampaingManager.js';
import { randomUUID } from 'crypto';

export default class GameService {
    constructor(playerRepo) {
        this.playerRepo = playerRepo; 
        this.activeGames = new Map(); 
        this.campaignManagers = new Map();
    }

    createGame(mode = 'PVP', gameMode = 'classic', aiLevel = 1, loginPlayer1, loginPlayer2) {
        const gameId = randomUUID();
        const engine = new GameEngine({ mode, gameMode });
        
        engine.loginPlayer1 = loginPlayer1;
        engine.loginPlayer2 = loginPlayer2;

        this.activeGames.set(gameId, engine);

        if (mode === 'IA') {
            const humanPlayer = engine.players[0];
            const campaign = new CampaignManager(humanPlayer, { mode, gameMode });
            campaign.currentLevel = aiLevel - 1; 
            campaign.startNextLevel(engine); 
            this.campaignManagers.set(gameId, campaign);
        }

        return { gameId, gameState: engine.getPublicState() };
    }

    getGameState(gameId) {
        const game = this.activeGames.get(gameId);
        if (!game) throw new Error("Partida não encontrada!");
        return game.getPublicState();
    }

    processAttack(gameId, row, col) {
        const game = this.activeGames.get(gameId);
        if (!game) throw new Error("Partida não encontrada!");

        const humanResult = game.attack(row, col);
        let aiResult = null;

        if (game.state === 'game_over') {
            this._lidarComFimDeJogo(game);
        } 

        else if (game.mode === 'IA' && game.state === 'playing') {
            const currentPlayer = game.getCurrentPlayer();
            if (currentPlayer.type === 'computer') {
                const campaign = this.campaignManagers.get(gameId);
                if (campaign) {
                    campaign.playComputerTurn(); 
                    aiResult = "IA realizou sua jogada."; 
                }

                if (game.state === 'game_over') {
                    this._lidarComFimDeJogo(game);
                }
            }
        }

        return {
            humanAttack: humanResult,
            aiAttackMsg: aiResult,
            gameState: game.getPublicState()
        };
    }

    _lidarComFimDeJogo(game) {
        const vencedorIndex = 1 - game.currentPlayerIndex; 
        const loginVencedor = vencedorIndex === 0 ? game.loginPlayer1 : game.loginPlayer2;
        const loginPerdedor = perdedorIndex === 0 ? game.loginPlayer1 : game.loginPlayer2;

        if (loginVencedor && loginPerdedor) {
            this.finalizarPartida(loginVencedor, loginPerdedor);
        } else if (loginVencedor) {
            this.finalizarPartida(loginVencedor, null); 
        } else if (loginPerdedor) {
            this.finalizarPartida(null, loginPerdedor);
        }
    }

    //para o modo dinâmico
    moveShip(gameId, shipId, direction) {
        const game = this.activeGames.get(gameId);
        if (!game) throw new Error("Partida não encontrada");

        const result = game.moveShip(shipId, direction);

        if (!result.success) {
            throw new Error(result.detail || "Erro ao mover o navio.");
        }
        return {
            message: "Navio movido com sucesso",
            moveResult: result,
            gameState: game.getPublicState()
        };
    }

  finalizarPartida(loginVencedor, loginPerdedor) {
    const vencedor = this.playerRepo.findByLogin(loginVencedor);
    const perdedor = this.playerRepo.findByLogin(loginPerdedor);

    if (!vencedor || !perdedor) return;

    vencedor.estatisticas.partidas++;
    vencedor.estatisticas.vitorias++;

    perdedor.estatisticas.partidas++;
    perdedor.estatisticas.derrotas++;

    this._calcularTaxas(vencedor);
    this._calcularTaxas(perdedor);

    this.playerRepo.update(vencedor);
    this.playerRepo.update(perdedor);
  }

  _calcularTaxas(player) {
    const total = player.estatisticas.partidas;

    player.estatisticas.taxaVitoria =
      total > 0 ? player.estatisticas.vitorias / total : 0;

    player.estatisticas.taxaDerrota =
      total > 0 ? player.estatisticas.derrotas / total : 0;
  }
}
