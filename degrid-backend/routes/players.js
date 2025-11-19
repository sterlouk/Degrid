import express from 'express';
import playerController from '../controllers/playerController.js';
import { validate, sanitizeInput } from '../middleware/validation.js';
import { playerIdValidation } from '../utils/validators.js';

const router = express.Router();

/**
 * @route   GET /players
 * @desc    Get all players
 * @access  Public
 */
router.get(
  '/',
  playerController.getAllPlayers
);

/**
 * @route   GET /players/:playerId
 * @desc    Get player by ID
 * @access  Public
 */
router.get(
  '/:playerId',
  playerIdValidation,
  validate,
  playerController.getPlayer
);

/**
 * @route   POST /players
 * @desc    Create a new player
 * @access  Public
 */
router.post(
  '/',
  sanitizeInput,
  validate,
  playerController.createPlayer
);

/**
 * @route   PUT /players/:playerId
 * @desc    Update player
 * @access  Public
 */
router.put(
  '/:playerId',
  sanitizeInput,
  playerIdValidation,
  validate,
  playerController.updatePlayer
);

/**
 * @route   GET /players/:playerId/stats
 * @desc    Get player statistics
 * @access  Public
 */
router.get(
  '/:playerId/stats',
  playerIdValidation,
  validate,
  playerController.getPlayerStats
);

/**
 * @route   PUT /players/:playerId/inactive
 * @desc    Mark player as inactive
 * @access  Public
 */
router.put(
  '/:playerId/inactive',
  playerIdValidation,
  validate,
  playerController.markInactive
);

/**
 * @route   PUT /players/:playerId/exit
 * @desc    Player exits game
 * @access  Public
 */
router.put(
  '/:playerId/exit',
  playerIdValidation,
  validate,
  playerController.exitGame
);

export default router;
