import React from 'react'
import './grid.css'

// availableSet: Set of strings "x,y" for cells that are allowed to be clicked
export default function Grid({ cells = [], onRefresh = ()=>{}, onCellClick = ()=>{}, availableSet = new Set() }){
  // cells expected array of {cellId,x,y,color,owner}
  // build 10x10 grid
  const grid = Array.from({length:10}, (_,y) => Array.from({length:10}, (_,x) => null))
  for (const c of cells){
    grid[c.y][c.x] = c
  }

  const palette = ['#ef4444','#3b82f6','#f97316','#10b981','#8b5cf6','#e11d48','#f59e0b','#06b6d4','#84cc16','#f43f5e']

  return (
    <div>
      <div className="grid">
        {grid.map((row, y) => (
          <div key={y} className="grid-row">
            {row.map((cell, x) => {
              const key = `${x},${y}`
              const isAvailable = availableSet.has(key)
              // debug: log availability so we can see why clicks may be ignored
              // (will appear in the browser console when Vite HMR is enabled)
              // eslint-disable-next-line no-console
              console.debug && console.debug(`grid cell ${key} available=${isAvailable}`)
              const classes = ['grid-cell']
              // mark the center 2x2 as the finish area
              const isFinish = ( (x === 4 || x === 5) && (y === 4 || y === 5) )
              if (isFinish) classes.push('finish')
              if (!isAvailable) classes.push('not-allowed')
              else classes.push('available')
              const ownerId = cell?.owner || cell?.['cell-owner']
              // intense finish background overrides owner color so goal is clearly visible
              const finishBg = 'linear-gradient(135deg,#ffd700 0%, #ff8c00 100%)'
              const bg = isFinish ? finishBg : (cell?.color || (ownerId ? palette[(Number(ownerId)-1) % palette.length] : '#eee'))
              return (
                <div
                  key={x}
                  className={classes.join(' ')}
                  onClick={(e) => {
                    // debug click
                    // eslint-disable-next-line no-console
                    console.log('grid cell click', key, 'isAvailable=', isAvailable, 'cell=', cell)
                    if (!isAvailable) {
                      // prevent accidental navigation when not allowed
                      e.stopPropagation()
                      return
                    }
                    onCellClick(cell || { x, y })
                  }}
                  style={{background: bg}}
                  title=""
                >
                  {cell?.isStarting && ownerId && (
                    <div className="starting-badge">{String(ownerId)}</div>
                  )}
                  {/* stored claim values are intentionally hidden in the grid UI */}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      {/* refresh button removed — polling on the page keeps the grid updated automatically */}
    </div>
  )
}
