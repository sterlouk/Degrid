# Security Review

After the course, I reviewed Degrid with a security lens. I reproduced each issue against the running original (tag [`course-submission`](https://github.com/sterlouk/Degrid/tree/course-submission)), fixed it, and covered it with a regression test in [`degrid-backend/test/game.test.js`](degrid-backend/test/game.test.js).

## Summary

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | Any client could act as any player (no authentication) | High | Fixed: seat tokens |
| 2 | Unauthenticated `POST /game/reset` wiped the game | High | Fixed: admin token, fails closed |
| 3 | Win on turn one: adjacency was only checked for owned cells | High (game integrity) | Fixed |
| 4 | Challenges could be played out of turn | Medium | Fixed |
| 5 | Predictable dice (`Math.random()`, every roll visible to clients) | Medium | Fixed: `crypto.randomInt` |
| 6 | No input validation (any type and size for color/description; non-integer coordinates) | Medium | Fixed |
| 7 | Production frontend pointed at `localhost` (wrong env variable name for Vite) | Medium (availability) | Fixed |
| 8 | Hardcoded fallback JWT secret published in the repo | Medium | Removed (the JWT code was never mounted) |
| 9 | CORS `*` with `credentials: true`, 10 MB body limit, internal error messages returned to clients | Low | Fixed |
| 10 | Vulnerable dependencies (react-router, axios, vite/esbuild, ...) | Low–High | Fixed: 0 known vulnerabilities |

## Details

### 1. Any client could act as any player

Every player endpoint took the player id from the URL and nothing else:

```bash
curl -X PUT https://<api>/players/2 -H 'Content-Type: application/json' -d '{"description":"hacked"}'
# 200 {"success":true,"player":{"playerId":2,"name":"Bob",...,"description":"hacked"}}
```

**Fix: seat tokens.** The game is played hot-seat (several players on one screen) or across devices, so per-user accounts would not fit. Instead, a client **joins a seat**:

- `POST /players/:id/join` returns a random 256-bit bearer token. The server stores only its SHA-256 hash and compares tokens in constant time (`crypto.timingSafeEqual`).
- A seat can be joined once. Every action as that player requires its token (`middleware/auth.js`).
- A hot-seat browser simply holds tokens for all the seats it joined.
- Turns skip seats nobody joined, so a 3-player game doesn't stall on 7 empty seats.

### 2. Anyone could reset the game

`POST /game/reset` had no protection. It now requires `ADMIN_TOKEN`. If that variable is **not set, resets are disabled**, so a missing config fails closed rather than open.

### 3. Win on turn one

The rules say players expand into adjacent cells. The server only checked adjacency **if the target cell already had an owner**, and the four winning center cells start unowned:

```bash
POST /players/1/request   {"x":4,"y":4}       → 200 Challenge created
POST /players/1/challenge {"challengeId":...} → {"success":true,"winner":1}
```

Notably, the **frontend already enforced adjacency**: the grid only highlights neighbouring cells. Only the API skipped the check, so anyone calling it directly could bypass the rule. Client-side checks are UX, not security. The server now checks adjacency for every claim. The regression test fails if the old condition is restored (verified by mutating the code).

### 4. Out-of-turn challenges

`requestClaim` checked the turn, but `startChallenge` did not. A player could request a cell on their turn, wait, then play the challenge during someone else's turn, which also advanced the turn order. Both steps now check the turn. Pending challenges are discarded whenever the turn passes, and challenge ids are random 128-bit values instead of `timestamp-random`.

### 5. Predictable dice

Rolls used `Math.random()`. V8's generator (xorshift128+) can be reconstructed from a modest number of outputs, and the API returns every roll. A player could therefore predict upcoming rolls and pick when to challenge. Rolls now use `crypto.randomInt`.

### 6. Input validation

- **Description:** a string of at most 280 characters (previously any JSON value up to 10 MB, stored in memory).
- **Color:** a CSS color name or `#rrggbb`.
- **Coordinates:** must be integers.

React escapes all rendered text, so stored values were never an XSS sink, but unbounded input was an easy memory DoS.

### 7. Production frontend called `localhost`

The committed `.env` set `REACT_APP_BACKEND_URL`, a Create React App convention. The app is built with Vite, which only exposes `VITE_*` variables, so the deployed build fell back to `http://localhost:3000`. Now `.env.production` sets `VITE_API_BASE_URL`, and the built bundle contains the real API URL.

### 8. Hardcoded JWT secret

`middleware/auth.js` signed and verified tokens with `process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'`. If the variable were missing in production, anyone could forge tokens with the published fallback. This code was never mounted, so it was not exploitable. It has been deleted along with the rest of the unused MongoDB, JWT and queue code.

### 9. Hardening

- **CORS:** allows only the origins in `CORS_ORIGIN`. Auth uses bearer headers rather than cookies, so credentialed CORS is unnecessary.
- **Body limit:** JSON bodies are capped at 10 KB.
- **Errors:** responses return generic messages; details stay in the server log.

### 10. Dependencies

Dependencies were updated (react-router 7, Vite 8, patched axios), and six unused backend dependencies were removed. CI runs `npm audit --audit-level=high` on both apps.

## Known limitations

- **Seats are first come, first served.** On a public deployment, anyone can join a free seat. That fits a casual game. A real product would add lobbies with invite codes.
- **Tokens live in `localStorage`.** They survive reloads, but script running on the page could read them. The app renders no user-supplied HTML, and the tokens only control a game seat.
- **No rate limiting,** so join and claim requests can be flooded. `express-rate-limit` would be the next step.
- **State is in memory.** Restarting the server resets the game and frees all seats.
