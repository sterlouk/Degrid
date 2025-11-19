import express from 'express';
import gameController from '../controllers/gameController.js';
import { validate, sanitizeInput } from '../middleware/validation.js';
import {
  createGameValidation,
  joinGameValidation,
  updateProfileValidation,
  claimCellValidation,
  turnOrderValidation,
  gameIdValidation,
  playerIdValidation,
} from '../utils/validators.js';

const router = express.Router();

/**
 * @route   POST /games
 * @desc    Create a new game
 * @access  Public
 */
router.post(
  '/',
  sanitizeInput,
  createGameValidation,
  validate,
  gameController.createGame
);

/**
 * @route   GET /games
 * @desc    Get all games
 * @access  Public
 */
router.get(
  '/',
  gameController.getAllGames
);

/**
 * @route   GET /games/:gameId
 * @desc    Get game by ID
 * @access  Public
 */
router.get(
  '/:gameId',
  gameIdValidation,
  validate,
  gameController.getGame
);

/**
 * @route   GET /games/:gameId/grid
 * @desc    Get game grid
 * @access  Public
 */
router.get(
  '/:gameId/grid',
  gameIdValidation,
  validate,
  gameController.getGameGrid
);

/**
 * @route   PUT /games/:gameId/grid
 * @desc    Update game grid (system operation)
 * @access  Public
 */
router.put(
  '/:gameId/grid',
  gameIdValidation,
  validate,
  gameController.updateGameGrid
);

/**
 * @route   POST /games/:gameId/players
 * @desc    Player joins game
 * @access  Public
 */
router.post(
  '/:gameId/players',
  sanitizeInput,
  joinGameValidation,
  validate,
  gameController.joinGame
);

/**
 * @route   DELETE /games/:gameId/players/:playerId
 * @desc    Remove player from game
 * @access  Public
 */
router.delete(
  '/:gameId/players/:playerId',
  gameIdValidation,
  playerIdValidation,
  validate,
  gameController.removePlayer
);

/**
 * @route   PUT /games/:gameId/players/:playerId/profile
 * @desc    Update player profile
 * @access  Public
 */
router.put(
  '/:gameId/players/:playerId/profile',
  sanitizeInput,
  updateProfileValidation,
  validate,
  gameController.updatePlayerProfile
);

/**
 * @route   GET /games/:gameId/turn
 * @desc    Get current turn info
 * @access  Public
 */
router.get(
  '/:gameId/turn',
  gameIdValidation,
  validate,
  gameController.getCurrentTurn
);

/**
 * @route   PUT /games/:gameId/turn-order
 * @desc    Set turn order
 * @access  Public
 */
router.put(
  '/:gameId/turn-order',
  sanitizeInput,
  turnOrderValidation,
  validate,
  gameController.setTurnOrder
);

/**
 * @route   POST /games/:gameId/cells/:cellId/claim
 * @desc    Claim or challenge a cell
 * @access  Public
 */
router.post(
  '/:gameId/cells/:cellId/claim',
  sanitizeInput,
  claimCellValidation,
  validate,
  gameController.claimCell
);

/**
 * @route   POST /games/:gameId/players/:playerId/rematch
 * @desc    Vote for rematch
 * @access  Public
 */
router.post(
  '/:gameId/players/:playerId/rematch',
  gameIdValidation,
  playerIdValidation,
  validate,
  gameController.voteRematch
);

export default router;
