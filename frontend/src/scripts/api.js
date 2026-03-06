const BASE_URL = 'http://localhost:3000';

async function request(method, path, body) {
  const paths = [path, `/api${path}`];
  let lastError;

  for (const candidate of paths) {
    try {
      const response = await fetch(`${BASE_URL}${candidate}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || `Erro HTTP ${response.status}`);
      }
      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Falha de comunicação com o backend');
}

export function createGame(payload) {
  return request('POST', '/game', payload);
}

export function getGame(gameId) {
  return request('GET', `/game/${gameId}`);
}

export function attack(gameId, row, col) {
  return request('POST', `/game/${gameId}/attack`, { row, col });
}

export function move(gameId, fromRow, fromCol, toRow, toCol) {
  return request('POST', `/game/${gameId}/move`, {
    fromRow,
    fromCol,
    toRow,
    toCol,
  });
}

export function getRanking() {
  return request('GET', '/ranking');
}


export async function requestDeployFallback(gameId, playerBoard) {
  const response = await fetch(`${BASE_URL}/api/game/${gameId}/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerBoard }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Erro ao enviar frota');
  return data;
}