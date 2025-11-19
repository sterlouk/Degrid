import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import './challenge.css'

export default function CellRequestPage(){
  const [searchParams] = useSearchParams()
  const initPid = searchParams.get('playerId') ? Number(searchParams.get('playerId')) : 1
  const [playerId, setPlayerId] = useState(initPid)
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const [resp, setResp] = useState(null)
  const [currentPlayerId, setCurrentPlayerId] = useState(null)
  const [loadingRequest, setLoadingRequest] = useState(false)
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [modalCell, setModalCell] = useState(null)
  const [modalOwner, setModalOwner] = useState(null)
  const [rolling, setRolling] = useState(false)
  const [displayNum, setDisplayNum] = useState(0)
  const intervalRef = useRef(null)
  const startBtnRef = useRef(null)
  const [autoRequested, setAutoRequested] = useState(false)

  useEffect(()=>{
    const sx = searchParams.get('x')
    const sy = searchParams.get('y')
    if (sx !== null) setX(Number(sx))
    if (sy !== null) setY(Number(sy))
    const sp = searchParams.get('playerId')
    if (sp && Number(sp) !== playerId) setPlayerId(Number(sp))

    // clear any previous response/modal state when query changes to avoid showing stale errors
    setResp(null)
    setModalCell(null)
    setModalOwner(null)
    setShowModal(false)
    setAutoRequested(false)

    ;(async ()=>{
      try{
        const r = await api.get('/players/turn')
        setCurrentPlayerId(r.data.currentPlayerId)
      }catch(e){ console.warn('failed fetch turn', e) }
    })()
  }, [searchParams])

  useEffect(()=>{
    const sx = searchParams.get('x')
    const sy = searchParams.get('y')
    const sp = searchParams.get('playerId')
    if (!autoRequested && sx !== null && sy !== null && sp){
      if (currentPlayerId && Number(currentPlayerId) !== Number(sp)) return
      setAutoRequested(true)
      requestCell()
    }
  }, [searchParams, currentPlayerId, autoRequested])

  useEffect(()=>{
    if (showModal && startBtnRef.current){
      try { startBtnRef.current.focus() } catch(e){}
    }
  }, [showModal])

  const requestCell = async () =>{
    if (loadingRequest) return
    setLoadingRequest(true)
    setResp(null)
    if (x < 0 || x > 9 || y < 0 || y > 9) return setResp({ error: 'Coordinates must be 0..9' })
    if (currentPlayerId && Number(playerId) !== Number(currentPlayerId)) {
      return setResp({ error: `Not player ${playerId}'s turn` })
    }
    try{
      const r = await api.post(`/players/${playerId}/request`, { x: Number(x), y: Number(y) })
      setResp(r.data)
      if (r.data && r.data.success && r.data.challengeId){
        const cellInfo = r.data.cell
        try{
          const cellResp = await api.get(`/cells/${cellInfo.cellId}`)
          setModalCell(cellResp.data.cell)
          if (cellResp.data.cell['cell-owner']){
            const ownerId = cellResp.data.cell['cell-owner']
            const ownerResp = await api.get(`/players/${ownerId}`)
            setModalOwner(ownerResp.data.player)
          } else {
            setModalOwner(null)
          }
        }catch(e){ console.warn('failed to fetch cell/owner', e) }
        setShowModal(true)
      }
    }catch(e){
      // store full server response (if present) so UI can show debug info (owner, player.claimedCells)
      setResp(e?.response?.data || { error: e?.message || 'Unknown error' })
    }finally{
      setLoadingRequest(false)
    }
  }

  const startChallengeFromModal = async (challengeIdToStart) =>{
    setRolling(true)
    setDisplayNum(0)
    try{
      const r = await api.post(`/players/${playerId}/challenge`, { challengeId: challengeIdToStart })
      const data = r.data
      const target = data.attempt || Math.floor(Math.random()*100)+1
      let cur = 0
      intervalRef.current = setInterval(()=>{
        cur = Math.min(target, cur + Math.ceil(Math.random()*12))
        setDisplayNum(cur)
        setModalCell(prev => prev ? { ...prev, claimValue: cur } : prev)
        if (cur >= target){
          clearInterval(intervalRef.current)
          const finalVal = data.attempt ?? target
          setModalCell(prev => prev ? { ...prev, claimValue: finalVal } : prev)
          setRolling(false)
          setResp(data)
          ;(async ()=>{
            try{
              const gridResp = await api.get('/grid')
              const freshGrid = gridResp.data.cells || []
              // give the player a moment to inspect the stored value in the modal
              setTimeout(()=>{
                setShowModal(false)
                navigate('/grid', { state: { grid: freshGrid } })
              }, 2000)
            }catch(e){
              // fallback: still wait a moment then navigate without state
              setTimeout(()=>{
                setShowModal(false)
                navigate('/grid')
              }, 2000)
            }
          })()
        }
      }, 80)
    }catch(e){
        setRolling(false)
        setResp(e?.response?.data || { error: e?.message || 'Unknown error' })
    }
  }

  return (
    <div className="container">
      <h2>Cell Request</h2>
      <div className="form-row">
        <label>Player ID:</label>
        <input type="number" value={playerId} min={1} max={10} onChange={e=>setPlayerId(Number(e.target.value))} />
      </div>

      <div className="form-row">
        <label>X:</label>
        <input type="number" value={x} min={0} max={9} onChange={e=>setX(e.target.value)} />
        <label>Y:</label>
        <input type="number" value={y} min={0} max={9} onChange={e=>setY(e.target.value)} />
      </div>

      <div>
  <button onClick={requestCell} disabled={loadingRequest || (currentPlayerId && Number(playerId) !== Number(currentPlayerId))}>{loadingRequest ? 'Requesting...' : 'Request coordinates'}</button>
        {currentPlayerId && Number(playerId) !== Number(currentPlayerId) && (
          <div style={{color:'crimson',marginTop:8}}>It's not player {playerId}'s turn ({currentPlayerId} has the turn)</div>
        )}
      </div>

      <div className="response">
        {resp && resp.error && (
          <div className="error">{resp.error}</div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => { if (!rolling) setShowModal(false) }}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <h3>Challenge for cell ({x},{y})</h3>
            <div style={{marginBottom:8}}>Cell ID: <strong>{modalCell?.cellId || '—'}</strong> — Stored value: <strong>{modalCell?.claimValue ?? '—'}</strong></div>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <div className="big-die">{
                rolling ? displayNum : (
                  (modalCell && modalCell.claimValue !== undefined && modalCell.claimValue !== null)
                    ? modalCell.claimValue
                    : (displayNum > 0 ? displayNum : '-')
                )
              }</div>
              <div>
                <div>Current owner:</div>
                {modalOwner ? (
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:18,height:18,background:modalOwner.color,borderRadius:4}}></div>
                    <div>{modalOwner.name} (ID {modalOwner.playerId})</div>
                  </div>
                ) : <div>None</div>}
                <div style={{marginTop:8}}>
                  {modalCell ? (
                    <>
                      <button ref={startBtnRef} onClick={()=>startChallengeFromModal(resp.challengeId)} disabled={rolling}>{rolling ? 'Rolling...' : 'Start Challenge'}</button>
                      {!modalCell.owner && (
                        <div style={{marginTop:8,fontStyle:'italic',color:'#fff'}}>Note: this cell currently has no owner.</div>
                      )}
                    </>
                  ) : (
                    <div><em>Cell data not available.</em></div>
                  )}
                </div>
                {resp && resp.attempt !== undefined && (
                  <div style={{marginTop:8}}>Last attempt: {resp.attempt} — {resp.success ? <span style={{color:'green'}}>Success</span> : <span style={{color:'crimson'}}>Failed</span>}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
