import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { getLogger } from './middleware/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import gameRoutes from './routes/game.js';

/**
 * Allowed browser origins, from CORS_ORIGIN (comma-separated).
 * Defaults to the Vite dev server. Auth uses bearer tokens, not cookies, so
 * credentialed CORS is not needed.
 */
const allowedOrigins = () =>
  (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: allowedOrigins() }));
  app.use(express.json({ limit: '10kb' }));
  app.use(compression());
  app.use(getLogger());

  app.get('/health', (req, res) => res.json({ success: true, status: 'healthy' }));
  app.use('/', gameRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
};

export default createApp;
