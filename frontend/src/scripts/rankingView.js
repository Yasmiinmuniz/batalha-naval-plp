export function renderRanking(container, ranking = []) {
  if (!ranking.length) {
    container.innerHTML = '<p class="muted">Ranking indisponível.</p>';
    return;
  }

  const rows = ranking.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.name || item.player || '---'}</td>
      <td>${item.score || 0}</td>
      <td>${item.wins || 0}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <table class="ranking-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Jogador</th>
          <th>Pontos</th>
          <th>Vitórias</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}