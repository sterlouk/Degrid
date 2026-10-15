# Degrid API

Express REST API for Degrid. It keeps the state of one game in memory.

```bash
cp .env.example .env
npm install
npm test        # node --test
npm run dev     # http://localhost:3000
```

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Listen port |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated allowed browser origins |
| `ADMIN_TOKEN` | *(unset)* | Required for `POST /game/reset`; resets are disabled when unset |

See the [main README](../README.md) for the endpoint list and [SECURITY.md](../SECURITY.md) for the auth design.
