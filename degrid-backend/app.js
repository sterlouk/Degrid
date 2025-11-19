import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { getLogger } from './middleware/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
// only use the simple game routes for the refocused implementation
import simpleRoutes from './routes/simpleGame.js';

/**
 * Create and configure Express application
 * @returns {Object} Configured Express app
 */
const createApp = () => {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    optionsSuccessStatus: 200,
  };
  app.use(cors(corsOptions));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression middleware
  app.use(compression());

  // Logging middleware
  app.use(getLogger());

  // Simple in-memory game endpoints (refocused implementation)
  // Mount at root so frontend can call /players, /grid, etc.
  app.use('/', simpleRoutes);

  // 404 handler
  app.use(notFound);

  // Global error handler
  app.use(errorHandler);

  return app;
};

export default createApp;
