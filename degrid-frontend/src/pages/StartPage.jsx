import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function StartPage(){
  const nav = useNavigate()
  return (
    <div className="container">
      <h1>Degrid</h1>
      <p>Start the game.</p>
      <button className="primary" onClick={() => nav('/grid')}>START GAME</button>
    </div>
  )
}
