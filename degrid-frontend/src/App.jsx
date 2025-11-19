import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import StartPage from './pages/StartPage'
import PlayerInfoPage from './pages/PlayerInfoPage'
import GridPage from './pages/GridPage'
import CellRequestPage from './pages/CellRequestPage'
import ChallengePage from './pages/ChallengePage'

export default function App(){
  return (
    <div>
      <header className="header">
        <Link to="/">Degrid</Link>
        <nav>
          <Link to="/players">Players</Link>
          <Link to="/grid">Grid</Link>
          <Link to="/cell-request">Cell Request</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<StartPage/>} />
          <Route path="/players" element={<PlayerInfoPage/>} />
          <Route path="/grid" element={<GridPage/>} />
          <Route path="/cell-request" element={<CellRequestPage/>} />
          <Route path="/challenge" element={<ChallengePage/>} />
        </Routes>
      </main>
    </div>
  )
}
