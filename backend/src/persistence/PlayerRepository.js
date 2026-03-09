export default class PlayerRepository {
  constructor(storage) {
    this.storage = storage;
  }

  getAll() {
    return this.storage.read() || [];
  }

  saveAll(players) {
    this.storage.write(players);
  }

  findByLogin(login) {
    return this.getAll().find(p => p.login === login) || null;
  }

  create(login, nome, senha) {
    const players = this.getAll();

    if (players.some(p => p.login === login)) {
      throw new Error('Login já existe');
    }

    const novo = {
      id: Date.now().toString(),
      login,
      nome,
      senha,
      estatisticas: { partidas: 0, vitorias: 0, derrotas: 0, taxaVitoria: 0, taxaDerrota: 0 },
      medalhas: []
    };

    players.push(novo);
    this.saveAll(players);
    return novo;
  }

  authenticate(login, senha) {
    const player = this.findByLogin(login);
    if (!player || player.senha !== senha) {
      throw new Error('Login ou senha inválidos');
    }
    return { id: player.id, login: player.login, nome: player.nome }; 
  }
}