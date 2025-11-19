import express from 'express';
import challengeController from '../controllers/challengeController.js';
import { validate, sanitizeInput } from '../middleware/validation.js';
import { challengeAnswerValidation, gameIdValidation, playerIdValidation } from '../utils/validators.js';

const router = express.Router();

/**
 * @route   GET /challenges
 * @desc    Get all challenges
 * @access  Public
 */
router.get(
  '/',
  challengeController.getAllChallenges
);

/**
 * @route   GET /challenges/random
 * @desc    Get a random challenge
 * @access  Public
 */
router.get(
  '/random',
  challengeController.getRandomChallenge
);

/**
 * @route   GET /challenges/:challengeId
 * @desc    Get challenge by ID
 * @access  Public
 */
router.get(
  '/:challengeId',
  challengeController.getChallenge
);

/**
 * @route   POST /challenges/:challengeId/answer
 * @desc    Check challenge answer
 * @access  Public
 */
router.post(
  '/:challengeId/answer',
  sanitizeInput,
  validate,
  challengeController.checkAnswer
);

/**
 * @route   POST /challenges
 * @desc    Create a new challenge
 * @access  Public
 */
router.post(
  '/',
  sanitizeInput,
  validate,
  challengeController.createChallenge
);

/**
 * @route   GET /games/:gameId/challenges/:challengeId
 * @desc    Get challenge for a specific game
 * @access  Public
 */
router.get(
  '/games/:gameId/challenges/:challengeId',
  gameIdValidation,
  validate,
  challengeController.getChallengeForGame
);

/**
 * @route   POST /games/:gameId/players/:playerId/challenge-answer
 * @desc    Submit challenge answer for a game
 * @access  Public
 */
router.post(
  '/games/:gameId/players/:playerId/challenge-answer',
  sanitizeInput,
  challengeAnswerValidation,
  validate,
  challengeController.submitChallengeAnswer
);

export default router;
