import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { getSeats, saveSeat } from '../api/seats'

export default function StartPage(){
  const nav = useNavigate()
  const [players, setPlayers] = useState([])
  const [mine, setMine] = useState(getSeats())
  const [error, setError] = useState('')

  const load = async () => {
    try {
      const r = await api.get('/players')
      setPlayers(r.data.players || [])
    } catch (e) {
      setError('Cannot reach the game server')
    }
  }

  useEffect(() => { load() }, [])

  const join = async (playerId) => {
    const r = await api.post(`/players/${playerId}/join`)
    saveSeat(playerId, r.data.token)
  }

  const joinOne = async (playerId) => {
    setError('')
    try {
      await join(playerId)
    } catch (e) {
      setError(e?.response?.data?.message || 'Could not join')
    }
    setMine(getSeats())
    load()
  }

  const joinAllFree = async () => {
    setError('')
    for (const p of players.filter(p => !p.seatTaken)) {
      try { await join(p.playerId) } catch { /* taken meanwhile */ }
    }
    setMine(getSeats())
    load()
  }

  // A stored token only counts if the server still has the seat taken (it forgets seats on restart)
  const isMine = (p) => p.seatTaken && mine[p.playerId]
  const controlled = players.filter(isMine)

  return (
    <div className="container">
      <h1>Degrid</h1>
      <p>Join one seat per player on your device, or take every free seat to play hot-seat with friends on one screen.</p>
      {error && <div className="error">{error}</div>}
      <div className="list">
        {players.map(p => (
          <div key={p.playerId} className="player-row">
            <strong style={{ color: p.color }}>{p.name}</strong>
            {isMine(p)
              ? <span> (you)</span>
              : p.seatTaken
                ? <span> (taken)</span>
                : <button onClick={() => joinOne(p.playerId)}>Join</button>}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button onClick={joinAllFree} disabled={!players.some(p => !p.seatTaken)}>Join all free seats (hot-seat)</button>
        <button className="primary" onClick={() => nav('/grid')} disabled={controlled.length === 0}>START GAME</button>
      </div>
      {controlled.length > 0 && <p>You control: {controlled.map(p => p.name).join(', ')}</p>}
    </div>
  )
}
