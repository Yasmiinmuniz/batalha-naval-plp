import GameEngine from './game/GameEngine.js';

import FileStorage from './persistence/FileStorage.js';
import PlayerRepository from './persistence/PlayerRepository.js';

import GameService from './services/GameService.js';
import RankingService from './services/RankingService.js';
import RewardService from './services/RewardService.js';

const storage = new FileStorage('data/players.json');
const playerRepo = new PlayerRepository(storage);

const gameService = new GameService(playerRepo);
const rankingService = new RankingService(playerRepo);
const rewardService = new RewardService(playerRepo);

let inicioPartida = Date.now();

const engine = new GameEngine({
  callbacks: {

    onMoveResult: ({ playerId, result }) => {
      rewardService.registrarJogada(playerId, result);
    },

    onGameOver: ({ winner }) => {

      const loser = engine.players.find(p => p.id !== winner.id);

      if (!loser) return;

      gameService.finalizarPartida(winner.login, loser.login);

      rewardService.verificarFimDeJogo(winner, inicioPartida);

      inicioPartida = Date.now();
    }
  }
});

export default {
  engine,
  rankingService,
  playerRepo
};