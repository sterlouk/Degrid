import { body, param, query } from 'express-validator';
import { GAME_CONFIG, LANGUAGES } from '../config/constants.js';

/**
 * Validation rules for game creation
 */
export const createGameValidation = [
  body('language')
    .optional()
    .isString()
    .isIn(Object.values(LANGUAGES))
    .withMessage('Invalid language'),
  body('maxPlayers')
    .optional()
    .isInt({ min: GAME_CONFIG.MIN_PLAYERS, max: GAME_CONFIG.MAX_PLAYERS })
    .withMessage(`Max players must be between ${GAME_CONFIG.MIN_PLAYERS} and ${GAME_CONFIG.MAX_PLAYERS}`),
  body('gridSize')
    .optional()
    .isInt({ min: 5, max: 20 })
    .withMessage('Grid size must be between 5 and 20'),
];

/**
 * Validation rules for joining a game
 */
export const joinGameValidation = [
  param('gameId')
    .isInt({ min: 1 })
    .withMessage('Invalid game ID'),
  body('playerId')
    .isInt({ min: 1 })
    .withMessage('Player ID is required and must be a positive integer'),
  body('username')
    .optional()
    .isString()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters'),
  body('language')
    .optional()
    .isString()
    .isIn(Object.values(LANGUAGES))
    .withMessage('Invalid language'),
];

/**
 * Validation rules for player profile update
 */
export const updateProfileValidation = [
  param('gameId')
    .isInt({ min: 1 })
    .withMessage('Invalid game ID'),
  param('playerId')
    .isInt({ min: 1 })
    .withMessage('Invalid player ID'),
  body('username')
    .isString()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters'),
  body('language')
    .isString()
    .isIn(Object.values(LANGUAGES))
    .withMessage('Invalid language'),
];

/**
 * Validation rules for claiming a cell
 */
export const claimCellValidation = [
  param('gameId')
    .isInt({ min: 1 })
    .withMessage('Invalid game ID'),
  param('cellId')
    .isInt({ min: 0 })
    .withMessage('Invalid cell ID'),
  body('playerId')
    .isInt({ min: 1 })
    .withMessage('Player ID is required'),
];

/**
 * Validation rules for turn order
 */
export const turnOrderValidation = [
  param('gameId')
    .isInt({ min: 1 })
    .withMessage('Invalid game ID'),
  body('order')
    .isArray({ min: GAME_CONFIG.MIN_PLAYERS })
    .withMessage(`Turn order must be an array with at least ${GAME_CONFIG.MIN_PLAYERS} players`),
  body('order.*')
    .isInt({ min: 1 })
    .withMessage('Each player ID must be a positive integer'),
];

/**
 * Validation rules for queue joining
 */
export const joinQueueValidation = [
  body('playerId')
    .isInt({ min: 1 })
    .withMessage('Player ID is required'),
  body('username')
    .isString()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters'),
  body('language')
    .optional()
    .isString()
    .isIn(Object.values(LANGUAGES))
    .withMessage('Invalid language'),
];

/**
 * Validation rules for challenge answer
 */
export const challengeAnswerValidation = [
  param('gameId')
    .isInt({ min: 1 })
    .withMessage('Invalid game ID'),
  param('playerId')
    .isInt({ min: 1 })
    .withMessage('Invalid player ID'),
  body('challengeId')
    .isInt({ min: 1 })
    .withMessage('Challenge ID is required'),
  body('answer')
    .isString()
    .notEmpty()
    .withMessage('Answer is required'),
];

/**
 * Common parameter validations
 */
export const gameIdValidation = [
  param('gameId')
    .isInt({ min: 1 })
    .withMessage('Invalid game ID'),
];

export const playerIdValidation = [
  param('playerId')
    .isInt({ min: 1 })
    .withMessage('Invalid player ID'),
];

export const cellIdValidation = [
  param('cellId')
    .isInt({ min: 0 })
    .withMessage('Invalid cell ID'),
];
