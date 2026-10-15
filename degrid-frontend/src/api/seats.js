// Seat tokens this browser holds, keyed by playerId. A hot-seat game on one
// device holds several. localStorage keeps them across reloads; the app renders
// no user HTML (React escapes all text), which limits the XSS exposure of that choice.
const KEY = 'degrid.seats'

export const getSeats = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {}
  } catch {
    return {}
  }
}

export const getSeatToken = (playerId) => getSeats()[playerId]

export const saveSeat = (playerId, token) => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...getSeats(), [playerId]: token }))
  } catch {
    // storage unavailable (private mode): the seat works until the page reloads
  }
}

export const clearSeats = () => {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
