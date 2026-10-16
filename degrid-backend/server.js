import 'dotenv/config';
import createApp from './app.js';

const PORT = Number(process.env.PORT) || 3000;

if (!process.env.ADMIN_TOKEN) {
  console.warn('ADMIN_TOKEN is not set: POST /game/reset is disabled.');
}

const server = createApp().listen(PORT, () => {
  console.log(`Degrid API listening on http://localhost:${PORT}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
