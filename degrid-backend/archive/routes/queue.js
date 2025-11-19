import express from 'express';
import queueController from '../controllers/queueController.js';
import { validate, sanitizeInput } from '../middleware/validation.js';
import { joinQueueValidation, playerIdValidation } from '../utils/validators.js';

const router = express.Router();

/**
 * @route   POST /queue/players
 * @desc    Join queue
 * @access  Public
 */
router.post(
  '/players',
  sanitizeInput,
  joinQueueValidation,
  validate,
  queueController.joinQueue
);

/**
 * @route   DELETE /queue/players/:playerId
 * @desc    Leave queue
 * @access  Public
 */
router.delete(
  '/players/:playerId',
  playerIdValidation,
  validate,
  queueController.leaveQueue
);

/**
 * @route   GET /queue
 * @desc    Get queue status
 * @access  Public
 */
router.get(
  '/',
  queueController.getQueueStatus
);

/**
 * @route   GET /queue/players/:playerId/position
 * @desc    Get player's queue position
 * @access  Public
 */
router.get(
  '/players/:playerId/position',
  playerIdValidation,
  validate,
  queueController.getQueuePosition
);

/**
 * @route   POST /queue/match
 * @desc    Match players from queue (system operation)
 * @access  Public
 */
router.post(
  '/match',
  sanitizeInput,
  validate,
  queueController.matchPlayers
);

export default router;
