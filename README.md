# Degrid

[![CI](https://github.com/sterlouk/Degrid/actions/workflows/ci.yml/badge.svg)](https://github.com/sterlouk/Degrid/actions/workflows/ci.yml)

A turn-based multiplayer strategy game on a 10×10 grid. Players start on the edges of the board and expand cell by cell. The first player to capture one of the **four center cells** wins.

The frontend is React with Vite, and the backend is a Node.js/Express REST API.

## Background

Degrid was a team project (three people) for **Software Engineering II** at the Aristotle University of Thessaloniki (2025). The submitted version is tagged [`course-submission`](https://github.com/sterlouk/Degrid/tree/course-submission).

After the course I did a **security review and hardening pass**. It found and fixed:

- **Missing authentication:** anyone could act as any player or reset the game.
- **A rules bypass:** a player could win on turn one.
- **Out-of-turn moves and predictable dice.**
- **A misconfigured production build.**

Everything is in **[SECURITY.md](SECURITY.md)**: reproductions, fixes and regression tests.

## How to play

1. **Join seats.** Each player joins their seat from their own device, or one device clicks **Join all free seats** to play hot-seat on one screen.
2. **Claim a cell.** On your turn, pick a cell next to your territory. A free cell is yours automatically. To take an opponent's cell you roll 1–100 and must roll **at or below** the value stored on that cell. A successful roll replaces the stored value.
3. **The turn passes** after every challenge, win or lose.
4. **The first player to own a center cell** (4,4), (5,4), (4,5) or (5,5) wins.

## Architecture

```
React + Vite (:5173) ──axios──▶ Express API (:3000) ──▶ in-memory game state
  seat tokens in localStorage     helmet · CORS allowlist · 10 KB body limit
  attached per player request     requireSeat / requireAdmin middleware
```

| Path | Responsibility |
|---|---|
| [`degrid-backend/services/gameState.js`](degrid-backend/services/gameState.js) | Board, players, turn order, seats (hashed tokens), crypto-random dice |
| [`degrid-backend/controllers/gameController.js`](degrid-backend/controllers/gameController.js) | Game rules and input validation |
| [`degrid-backend/middleware/auth.js`](degrid-backend/middleware/auth.js) | Seat-token and admin-token checks |
| [`degrid-backend/routes/game.js`](degrid-backend/routes/game.js) | Public reads vs. seat-protected actions |
| [`degrid-frontend/src/api/`](degrid-frontend/src/api/) | API client and seat-token storage |
| [`docs/openapi-design.yaml`](docs/openapi-design.yaml) | The multi-game API we designed for the course. The implementation covers a single game. |

## Running locally

**Requirements:** Node 20.19+.

```bash
# Backend
cd degrid-backend
cp .env.example .env      # set ADMIN_TOKEN to enable game resets
npm install
npm test                  # 18 tests
npm run dev               # http://localhost:3000

# Frontend (second terminal)
cd degrid-frontend
npm install
npm run dev               # http://localhost:5173
```

## API

| Method | Path | Auth |
|---|---|---|
| GET | `/players`, `/players/:id`, `/players/turn`, `/grid`, `/cells/:id` | none |
| POST | `/players/:id/join` | none; returns the seat token |
| PUT | `/players/:id` (color, description) | seat token |
| POST/PUT/DELETE | `/players/:id/description` | seat token |
| POST | `/players/:id/request` `{x, y}` → `challengeId` | seat token, your turn |
| POST | `/players/:id/challenge` `{challengeId}` → roll result | seat token, your turn |
| POST | `/game/reset` | `ADMIN_TOKEN` |

## Testing

The backend tests use Node's built-in test runner against a live server on a random port, with no extra dependencies. They cover:

- **Authorization:** missing, forged and cross-player tokens.
- **Game rules:** adjacency, turns, stale challenges, winning.
- **Input validation**, including malformed and oversized bodies.
- **Admin reset** and the **CORS allowlist**.

CI runs the tests, the frontend build, and `npm audit` on every push.

I also played the UI hot-seat to check it by hand. That run caught a double-submitted challenge request, which the frontend now guards against.
