import express from 'express';
import cellController from '../controllers/cellController.js';
import { validate } from '../middleware/validation.js';
import { gameIdValidation, cellIdValidation, playerIdValidation } from '../utils/validators.js';

const router = express.Router();

/**
 * @route   GET /games/:gameId/cells
 * @desc    Get all cells for a game
 * @access  Public
 */
router.get(
  '/games/:gameId/cells',
  gameIdValidation,
  validate,
  cellController.getGameCells
);

/**
 * @route   GET /games/:gameId/cells/:cellId
 * @desc    Get specific cell
 * @access  Public
 */
router.get(
  '/games/:gameId/cells/:cellId',
  gameIdValidation,
  cellIdValidation,
  validate,
  cellController.getCell
);

/**
 * @route   PUT /games/:gameId/grid/cells/:cellId/colour
 * @desc    Update cell color
 * @access  Public
 */
router.put(
  '/games/:gameId/grid/cells/:cellId/colour',
  gameIdValidation,
  cellIdValidation,
  validate,
  cellController.updateCellColor
);

/**
 * @route   GET /games/:gameId/players/:playerId/cells
 * @desc    Get cells owned by a player
 * @access  Public
 */
router.get(
  '/games/:gameId/players/:playerId/cells',
  gameIdValidation,
  playerIdValidation,
  validate,
  cellController.getPlayerCells
);

export default router;
