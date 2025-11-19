import React, { useEffect, useState } from 'react'
import api from '../api/client'

export default function PlayerInfoPage(){
  const [players, setPlayers] = useState([])
  const [selected, setSelected] = useState(null)
  const [editingDesc, setEditingDesc] = useState('')

  useEffect(()=>{
    api.get('/players').then(r=>setPlayers(r.data.players)).catch(()=>{})
  }, [])

  const select = async (id) => {
    const r = await api.get(`/players/${id}`)
    setSelected(r.data.player)
    setEditingDesc(r.data.player.description || '')
  }

  const save = async () => {
    if (!selected) return
    await api.put(`/players/${selected.playerId}`, { description: editingDesc })
    // refresh list
    const r = await api.get('/players')
    setPlayers(r.data.players)
    alert('Saved')
  }

  return (
    <div className="container">
      <h2>Players</h2>
      <div className="flex">
        <div className="list">
          {players.map(p => (
            <div key={p.playerId} className="player-row" onClick={() => select(p.playerId)}>
              <strong style={{color:p.color}}>{p.name}</strong>
              <div>claimed: {p.claimedCells?.length || 0}</div>
            </div>
          ))}
        </div>
        <div className="detail">
          {selected ? (
            <div>
              <h3 style={{color:selected.color}}>{selected.name} (#{selected.playerId})</h3>
              <div>Color: {selected.color}</div>
              <div>Claimed cells: {selected.claimedCells?.join(', ')}</div>
              <h4>Edit description</h4>
              <textarea value={editingDesc} onChange={e=>setEditingDesc(e.target.value)} rows={4} />
              <div>
                <button onClick={save}>Save</button>
              </div>
            </div>
          ) : (<div>Select a player to view</div>)}
        </div>
      </div>
    </div>
  )
}
