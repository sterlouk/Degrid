# Degrid frontend

React + Vite client for the Degrid API.

```bash
npm install
npm run dev     # http://localhost:5173
npm run build
```

The API URL comes from `VITE_API_BASE_URL`. It defaults to `http://localhost:3000`, and [`.env.production`](.env.production) sets the deployed URL for builds. Only `VITE_*` variables reach the browser bundle, and they are public, so never put secrets in them.

Screens:
- **Start:** join seats.
- **Grid:** the board, the current turn and restart.
- **Cell request:** claim a cell and roll the challenge.
- **Players:** view players and edit your profile.
