import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api/client'
import Grid from '../components/Grid'

export default function GridPage(){
  const [cells, setCells] = useState([])
  const [players, setPlayers] = useState([])
  const [winner, setWinner] = useState(null)
  // remove manual selection; follow server's current player automatically
  const [currentPlayerId, setCurrentPlayerId] = useState(null)
  const [availableSet, setAvailableSet] = useState(new Set())
  const navigate = useNavigate()
  const location = useLocation()
  const [resetting, setResetting] = useState(false)

  // If navigation passed a fresh grid (e.g. after a recent challenge), prefer it initially
  useEffect(()=>{
    if (location && location.state && Array.isArray(location.state.grid)){
      setCells(location.state.grid)
    }
  }, [location])

  const fetchGrid = async ()=>{
    try{
      const r = await api.get('/grid')
      setCells(r.data.cells)
      // pick up optional winner field returned by the grid endpoint
      if (r.data.winner !== undefined && r.data.winner !== null) setWinner(r.data.winner)
      else setWinner(null)
      // if the grid endpoint returns currentPlayerId (optional), pick it up
      if (r.data.currentPlayerId !== undefined) setCurrentPlayerId(r.data.currentPlayerId)
    }catch(e){ console.error(e) }
  }

  const fetchTurn = async ()=>{
    try{
      const r = await api.get('/players/turn')
      setCurrentPlayerId(r.data.currentPlayerId)
    }catch(e){ console.warn('failed to fetch turn', e) }
  }

  const fetchPlayers = async ()=>{
    try{
      const r = await api.get('/players')
      setPlayers(r.data.players || [])
    }catch(e){ console.error(e) }
  }

  useEffect(()=>{ fetchPlayers(); fetchGrid(); fetchTurn() }, [])

  const handleRestart = async () => {
    if (resetting) return
    if (!confirm('Restart the game and reset to initial state?')) return
    setResetting(true)
    try{
      await api.post('/game/reset')
      await fetchPlayers()
      await fetchGrid()
      await fetchTurn()
    }catch(e){
      console.error('reset failed', e)
      alert('Reset failed: ' + (e?.response?.data?.message || e?.message))
    }finally{
      setResetting(false)
    }
  }

  // poll for current turn and refresh grid so UI follows server-driven turns
  useEffect(()=>{
    const iv = setInterval(()=>{
      fetchTurn()
      fetchGrid()
    }, 2000)
    return () => clearInterval(iv)
  }, [])

  // recompute available targets whenever cells or currentPlayerId changes
  useEffect(()=>{
    const s = new Set()
    const pid = Number(currentPlayerId)
    // if there's a winner, disable all available moves
    if (winner) { setAvailableSet(s); return }
    if (!cells || cells.length === 0 || !pid) { setAvailableSet(s); return }
    // find all cells owned by pid (support both `owner` and `cell-owner` fields)
    const owned = cells.filter(c => Number(c.owner ?? c['cell-owner']) === pid)
    for (const o of owned){
      const neighbors = [ [o.x+1,o.y],[o.x-1,o.y],[o.x,o.y+1],[o.x,o.y-1] ]
      for (const [nx,ny] of neighbors){
        if (nx >=0 && nx < 10 && ny>=0 && ny<10){
          s.add(`${nx},${ny}`)
        }
      }
    }
    setAvailableSet(s)
  }, [cells, currentPlayerId])

  // fetch on mount and whenever the location changes (so redirecting back here refreshes)
  useEffect(()=>{ fetchGrid(); fetchTurn() }, [location])

  // helper: current turn player object (may be undefined)
  const currentTurnPlayer = players.find(p => Number(p.playerId) === Number(currentPlayerId))

  return (
    <div className="container">
      {winner ? (
        <div style={{display:'flex',alignItems:'center',gap:12,background:'#fffae6',border:'1px solid #ffd24d',padding:12,marginBottom:12,borderRadius:6, color:'#000'}}>
          <div>
            <strong style={{color:'#000'}}>Winner:</strong> <span style={{color:'#000'}}>{winner} {players.find(p=>p.playerId===winner)?.name ? `(${players.find(p=>p.playerId===winner).name})` : ''}</span>
          </div>
          <div style={{marginLeft:'auto'}}>
            <button onClick={handleRestart} disabled={resetting}>{resetting ? 'Restarting...' : 'Play again'}</button>
          </div>
        </div>
      ) : null}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
        <h2 style={{margin:0}}>Grid</h2>
        <div style={{marginLeft:'auto'}}>
          <button onClick={handleRestart} disabled={resetting}>{resetting ? 'Restarting...' : 'Restart'}</button>
        </div>
      </div>
      <p>Click a highlighted adjacent cell to request it — the UI follows the server's current turn automatically.</p>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
        <div>
          <strong>Current player:</strong>
          <span style={{marginLeft:8}}>{currentTurnPlayer ? `${currentTurnPlayer.name} (${currentTurnPlayer.playerId})` : '—'}</span>
        </div>
      </div>
      <Grid cells={cells} onRefresh={fetchGrid} availableSet={availableSet} onCellClick={(cell)=>{
        if (!currentPlayerId) {
          alert('No current player set')
          return
        }
        // prevent requesting a cell the player already owns
        const ownerId = Number(cell?.owner ?? cell?.['cell-owner'] ?? null)
        if (ownerId && ownerId === Number(currentPlayerId)){
          alert('You already own this cell')
          return
        }
        // navigate to cell request with coords prefilled and current player
        const x = typeof cell.x === 'number' ? cell.x : 0
        const y = typeof cell.y === 'number' ? cell.y : 0
        navigate(`/cell-request?x=${x}&y=${y}&playerId=${currentPlayerId}`)
      }} />
    </div>
  )
}
