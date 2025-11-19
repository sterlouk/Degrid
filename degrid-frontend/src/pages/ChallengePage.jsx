import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/client'
import './challenge.css'

export default function ChallengePage(){
  const [playerId, setPlayerId] = useState(1)
  const [challengeId, setChallengeId] = useState('')
  const [resp, setResp] = useState(null)
  const [rolling, setRolling] = useState(false)
  const [displayNum, setDisplayNum] = useState(0)
  const navigate = useNavigate()
  const intervalRef = useRef(null)

  const [searchParams] = useSearchParams()

  useEffect(()=>{
    const sp = searchParams.get('playerId')
    const sc = searchParams.get('challengeId')
    if (sp) {
      if (typeof setPlayerId !== 'function') {
        // eslint-disable-next-line no-console
        console.error('setPlayerId is not a function in ChallengePage:', setPlayerId)
        throw new Error('setPlayerId is not a function')
      }
      setPlayerId(Number(sp))
    }
    if (sc) setChallengeId(sc)
  }, [searchParams])

  const start = async () =>{
    setResp(null)
    if (!challengeId) return setResp({ error: 'challengeId required' })
    try{
      setRolling(true)
      setDisplayNum(0)
      // call backend
      const r = await api.post(`/players/${playerId}/challenge`, { challengeId })
      const data = r.data
      // animate number from 1..data.attempt quickly
      const target = data.attempt || Math.floor(Math.random()*100)+1
      let cur = 0
      intervalRef.current = setInterval(()=>{
        cur = Math.min(target, cur + Math.ceil(Math.random()*12))
        setDisplayNum(cur)
        if (cur >= target){
          clearInterval(intervalRef.current)
          setRolling(false)
          setResp(data)
          if (data.success){
            // show success briefly then go to grid
            setTimeout(()=> navigate('/grid'), 900)
          }
        }
      }, 80)
    }catch(e){
      setRolling(false)
      setResp({ error: e?.response?.data?.message || e.message })
    }
  }

  return (
    <div className="container">
      <h2>Challenge</h2>
      <div className="challenge-root">
        <div className="challenge-left">
          <div className="big-die">{rolling ? displayNum : (resp ? resp.attempt || '-' : '-')}</div>
          <div>
            <p>When you start the challenge a random value (1-100) will be generated.
            If it meets the success rule the cell will be transferred.</p>
          </div>
        </div>
        <div className="challenge-right">
          <div className="form-row">
            <label>Player ID:</label>
            <input type="number" value={playerId} min={1} max={10} onChange={e=>setPlayerId(e.target.value)} />
          </div>
          <div className="form-row">
            <label>Challenge ID:</label>
            <input type="text" value={challengeId} onChange={e=>setChallengeId(e.target.value)} style={{width:'100%'}} />
          </div>
          <div style={{marginTop:12}}>
            <button className="roll-btn" onClick={start} disabled={rolling}>{rolling ? 'Rolling...' : 'Start Challenge'}</button>
          </div>
          <div style={{marginTop:12}}>
            {resp && ( resp.error ? <div className="error">{resp.error}</div> : (
              <div>
                <div>Result: {resp.success ? <span className="result-success">Success</span> : <span className="result-fail">Failed</span>}</div>
                <div>Attempt: {resp.attempt}</div>
                <div style={{marginTop:8}}>{resp.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
