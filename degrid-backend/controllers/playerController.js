import playerService from '../services/playerService.js';
import { successResponse, errorResponse } from '../utils/responses.js';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/constants.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Get all players
 * GET /players
 */
export const getAllPlayers = asyncHandler(async (req, res) => {
  const { status, isConnected } = req.query;
  
  const filters = {};
  if (status) filters.status = status;
  if (isConnected !== undefined) filters.isConnected = isConnected === 'true';
  
  const players = await playerService.getAllPlayers(filters);
  
  return successResponse(res, players);
});

/**
 * Get player by ID
 * GET /players/:playerId
 */
export const getPlayer = asyncHandler(async (req, res) => {
  const { playerId } = req.params;
  
  const player = await playerService.getPlayerById(playerId);
  
  if (!player) {
    return errorResponse(res, ERROR_MESSAGES.PLAYER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  
  return successResponse(res, player);
});

/**
 * Create a new player
 * POST /players
 */
export const createPlayer = asyncHandler(async (req, res) => {
  const { playerId, username, language } = req.body;
  
  const player = await playerService.createPlayer({
    playerId,
    username,
    language,
  });
  
  return successResponse(res, player, 'Player created successfully', HTTP_STATUS.CREATED);
});

/**
 * Update player
 * PUT /players/:playerId
 */
export const updatePlayer = asyncHandler(async (req, res) => {
  const { playerId } = req.params;
  const updateData = req.body;
  
  const player = await playerService.updatePlayer(playerId, updateData);
  
  return successResponse(res, player, SUCCESS_MESSAGES.PROFILE_UPDATED);
});

/**
 * Get player statistics
 * GET /players/:playerId/stats
 */
export const getPlayerStats = asyncHandler(async (req, res) => {
  const { playerId } = req.params;
  
  const stats = await playerService.getPlayerStats(playerId);
  
  return successResponse(res, stats);
});

/**
 * Mark player as inactive
 * PUT /players/:playerId/inactive
 */
export const markInactive = asyncHandler(async (req, res) => {
  const { playerId } = req.params;
  
  const player = await playerService.markPlayerInactive(playerId);
  
  return successResponse(res, player, 'Player marked as inactive');
});

/**
 * Player exits the game
 * PUT /players/:playerId/exit
 */
export const exitGame = asyncHandler(async (req, res) => {
  const { playerId } = req.params;
  
  await playerService.markPlayerInactive(playerId);
  
  return successResponse(res, null, 'Player exited successfully');
});

export default {
  getAllPlayers,
  getPlayer,
  createPlayer,
  updatePlayer,
  getPlayerStats,
  markInactive,
  exitGame,
};
