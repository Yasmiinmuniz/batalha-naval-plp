import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import './Ranking.css';

export default function Ranking() {
  const navigate = useNavigate();
  const [rankingData, setRankingData] = useState([]);
  
  const loggedUser = JSON.parse(localStorage.getItem('loggedUser') || '{}');

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/ranking');
        const data = await res.json();
        setRankingData(data);
      } catch (error) {
        console.error("Erro ao carregar o ranking:", error);
      }
    };
    fetchRanking();
  }, []);

  return (
    <div className="ranking-layout">
      <Header />
      <main className="ranking-container">
        <div className="drawn-card ranking-card">
          <div className="ranking-header">
            <h1>Ranking Global</h1>
            <button className="drawn-btn white-btn" onClick={() => navigate('/home')}>Voltar ao Lobby</button>
          </div>

          <div className="table-wrapper">
            <table className="drawn-table">
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Jogador</th>
                  <th>Vitórias</th>
                  <th>Taxa de Vitória</th>
                </tr>
              </thead>
              <tbody>
                {rankingData.map((player) => (
                  <tr key={player.posicao} className={player.nome === loggedUser.nome ? 'highlight-row' : ''}>
                    <td className="pos-col">#{player.posicao}</td>
                    <td className="name-col">{player.nome}</td>
                    <td>{player.vitorias}</td>
                    <td className="rate-col">{Math.round(player.taxaVitoria * 100)}%</td>
                  </tr>
                ))}
                {rankingData.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>Nenhum jogador no ranking ainda!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}