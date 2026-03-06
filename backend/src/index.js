const http = require('http');
const GameService = require('./services/GameService');

const service = new GameService();
const PORT = process.env.PORT || 3000;

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (_error) {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});

  try {
    if (req.method === 'GET' && req.url === '/api/ranking') {
      return sendJson(res, 200, service.getRanking());
    }

    if (req.method === 'POST' && req.url === '/api/game') {
      const body = await parseBody(req);
      const created = service.createGame(body);
      return sendJson(res, 201, created);
    }

    const deployMatch = req.url.match(/^\/api\/game\/([^/]+)\/deploy$/);
    if (req.method === 'POST' && deployMatch) {
      const gameId = deployMatch[1];
      const body = await parseBody(req);
      const result = service.deployPlayerBoard(gameId, body.playerBoard || []);
      return sendJson(res, 200, result);
    }

    const attackMatch = req.url.match(/^\/api\/game\/([^/]+)\/attack$/);
    if (req.method === 'POST' && attackMatch) {
      const gameId = attackMatch[1];
      const body = await parseBody(req);
      const result = service.playerAttack(gameId, Number(body.row), Number(body.col));
      return sendJson(res, 200, result);
    }

    return sendJson(res, 404, { message: 'Rota não encontrada' });
  } catch (error) {
    return sendJson(res, 400, { message: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Backend Batalha Naval rodando em http://localhost:${PORT}`);
});