import axios from 'axios'
import { getSeatToken } from './seats'

// Vite only exposes env vars prefixed with VITE_ to the browser bundle
const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' }
})

// Attach the seat token when acting as a player this browser has joined
api.interceptors.request.use(config => {
  const match = /^\/players\/(\d+)(\/|$)/.exec(config.url || '')
  const token = match && getSeatToken(match[1])
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
