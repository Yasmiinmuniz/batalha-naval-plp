import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import GameBoard from './pages/GameBoard';
import Instructions from './pages/Instructions';
import Ranking from './pages/Ranking';
import Profile from './pages/Profile';
import Statistics from './pages/Statistics';

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc', marginBottom: '1rem' }}>
        <ul style={{ display: 'flex', gap: '15px', listStyle: 'none', margin: 0, padding: 0 }}>
          <li><Link to="/">Instructions</Link></li>
          <li><Link to="/gameBoard">Game Board</Link></li>
          <li><Link to="/ranking">Ranking</Link></li>
          <li><Link to="/profile">Profile</Link></li>
          <li><Link to="/statistics">Statistics</Link></li>
        </ul>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Instructions />} />
          <Route path="/gameBoard" element={<GameBoard />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/statistics" element={<Statistics />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App
