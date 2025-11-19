import React, { useState } from 'react'
import api from '../api/client'

export default function IniProfilePage(){
  const [playerId, setPlayerId] = useState(1)
  const [name, setName] = useState('')
  const [color, setColor] = useState('red')
  const [message, setMessage] = useState('')

  const save = async () =>{
    try{
      const r = await api.put(`/players/${playerId}`, { color, description: message })
      alert('Profile updated')
    }catch(e){
      alert('Error: '+(e?.response?.data?.message||e.message))
    }
  }

  return (
    <div className="container">
      <h2>Initial Profile</h2>
      <div className="form-row">
        <label>Player ID:</label>
        <input type="number" value={playerId} min={1} max={10} onChange={e=>{
          if (typeof setPlayerId !== 'function') { console.error('setPlayerId is not a function in IniProfilePage', setPlayerId); return }
          setPlayerId(e.target.value)
        }} />
      </div>
      <div className="form-row">
        <label>Color:</label>
        <input type="text" value={color} onChange={e=>setColor(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Description:</label>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} />
      </div>
      <div>
        <button onClick={save}>Save</button>
      </div>
    </div>
  )
}
