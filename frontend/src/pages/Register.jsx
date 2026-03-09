import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

export default function Register() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, login: username, senha: password })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      alert("Conta criada! Faça login.");
      navigate('/login');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Nova Conta</h1>
        <p className="auth-subtitle">Crie seu perfil para jogar!</p>
        
        <form onSubmit={handleRegister} className="auth-form">
          <div className="input-group">
            <label>Nome</label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Digite seu nome" required />
          </div>

          <div className="input-group">
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Escolha um nome de usuário" required />
          </div>
          
          <div className="input-group">
            <label>Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Crie uma senha" required />
          </div>
          
          <button type="submit" className="auth-submit-btn red">
            Criar Conta
          </button>
        </form>

        <div className="auth-footer">
          <span>Já tem uma conta?</span>
          <button type="button" onClick={() => navigate('/login')} className="switch-page-btn">
            Faça Login
          </button>
        </div>
      </div>
    </main>
  );
}