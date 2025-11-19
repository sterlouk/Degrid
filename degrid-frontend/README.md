# Degrid Frontend (minimal scaffold)

This is a minimal Vite + React frontend scaffold for the Degrid simple game backend.

Prerequisites:
- Node 18+ (or compatible)

Quick start:

cd frontend
npm install
npm run dev

Default API base URL: http://localhost:3000
You can override by creating a `.env` file in `frontend/` with:

VITE_API_BASE_URL=http://localhost:3000

Screens included:
- Start (Start game button)
- Players (list + profile edit)
- Grid (10x10 visual)
- Cell Request (enter coordinates and request challenge)
- Challenge (start challenge with challengeId)

This scaffold is intentionally small so you can iterate quickly. You may replace Vite with CRA if you prefer.
