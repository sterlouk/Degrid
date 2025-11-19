import express from 'express';
import playersRouter from './players.js';
import challengesRouter from './challenges.js';
import cellsRouter from './cells.js';

const router = express.Router();

/**
 * Health check endpoint
 * GET /
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Degrid Game API is running',
    version: '1.0.0',
    endpoints: {
      players: '/players',
      challenges: '/challenges',
      cells: '/games/:gameId/cells',
    },
  });
});

/**
 * Health check endpoint
 * GET /health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount routers
router.use('/players', playersRouter);
router.use('/challenges', challengesRouter);
router.use('/', cellsRouter); // Cell routes are nested under games


export default router;
