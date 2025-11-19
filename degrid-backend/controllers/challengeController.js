import challengeService from '../services/challengeService.js';
import { successResponse, errorResponse } from '../utils/responses.js';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/constants.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Get all challenges
 * GET /challenges
 */
export const getAllChallenges = asyncHandler(async (req, res) => {
  const { type, difficulty } = req.query;
  
  const challenges = await challengeService.getAllChallenges({ type, difficulty });
  
  return successResponse(res, challenges);
});

/**
 * Get challenge by ID
 * GET /challenges/:challengeId
 */
export const getChallenge = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  
  const challenge = await challengeService.getChallengeById(challengeId);
  
  if (!challenge) {
    return errorResponse(res, ERROR_MESSAGES.CHALLENGE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  
  return successResponse(res, challenge);
});

/**
 * Get a random challenge
 * GET /challenges/random
 */
export const getRandomChallenge = asyncHandler(async (req, res) => {
  const { type, difficulty } = req.query;
  
  const challenge = await challengeService.getRandomChallenge({ type, difficulty });
  
  // Don't expose the answer in the response
  const { answer, ...challengeWithoutAnswer } = challenge;
  
  return successResponse(res, challengeWithoutAnswer);
});

/**
 * Check challenge answer
 * POST /challenges/:challengeId/answer
 */
export const checkAnswer = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  const { answer } = req.body;
  
  if (!answer) {
    return errorResponse(res, 'Answer is required', HTTP_STATUS.BAD_REQUEST);
  }
  
  const result = await challengeService.checkAnswer(challengeId, answer);
  
  return successResponse(res, result, 
    result.isCorrect ? 'Correct answer!' : 'Incorrect answer');
});

/**
 * Get challenge for a specific game/cell
 * GET /games/:gameId/challenges/:challengeId
 */
export const getChallengeForGame = asyncHandler(async (req, res) => {
  const { gameId, challengeId } = req.params;
  
  const challenge = await challengeService.getChallengeById(challengeId);
  
  if (!challenge) {
    return errorResponse(res, ERROR_MESSAGES.CHALLENGE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  
  // Don't expose the answer
  const { answer, ...challengeWithoutAnswer } = challenge;
  
  return successResponse(res, challengeWithoutAnswer);
});

/**
 * Submit challenge answer for a game
 * POST /games/:gameId/players/:playerId/challenge-answer
 */
export const submitChallengeAnswer = asyncHandler(async (req, res) => {
  const { gameId, playerId } = req.params;
  const { challengeId, answer } = req.body;
  
  if (!answer) {
    return errorResponse(res, 'Answer is required', HTTP_STATUS.BAD_REQUEST);
  }
  
  const result = await challengeService.checkAnswer(challengeId, answer);
  
  return successResponse(res, {
    ...result,
    gameId: parseInt(gameId),
    playerId: parseInt(playerId),
  }, result.isCorrect ? SUCCESS_MESSAGES.CHALLENGE_COMPLETED : 'Challenge failed');
});

/**
 * Create a new challenge (admin function)
 * POST /challenges
 */
export const createChallenge = asyncHandler(async (req, res) => {
  const challengeData = req.body;
  
  const challenge = await challengeService.createChallenge(challengeData);
  
  return successResponse(res, challenge, 'Challenge created successfully', HTTP_STATUS.CREATED);
});

export default {
  getAllChallenges,
  getChallenge,
  getRandomChallenge,
  checkAnswer,
  getChallengeForGame,
  submitChallengeAnswer,
  createChallenge,
};
