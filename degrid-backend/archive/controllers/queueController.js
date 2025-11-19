import queueService from '../services/queueService.js';
import gameService from '../services/gameService.js';
import { successResponse, errorResponse } from '../utils/responses.js';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/constants.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Join queue
 * POST /queue/players
 */
export const joinQueue = asyncHandler(async (req, res) => {
  const { playerId, username, language, preferredMaxPlayers } = req.body;
  
  try {
    const queueEntry = await queueService.addToQueue({
      playerId,
      username,
      language,
      preferredMaxPlayers,
    });
    
    // Check if we can match players
    const stats = await queueService.getQueueStats();
    
    return successResponse(res, {
      queueEntry,
      queueStats: stats,
    }, 'Successfully joined queue', HTTP_STATUS.OK);
  } catch (error) {
    return errorResponse(res, error.message, HTTP_STATUS.BAD_REQUEST);
  }
});

/**
 * Leave queue
 * DELETE /queue/players/:playerId
 */
export const leaveQueue = asyncHandler(async (req, res) => {
  const { playerId } = req.params;
  
  const removed = await queueService.removeFromQueue(playerId);
  
  if (!removed) {
    return errorResponse(res, ERROR_MESSAGES.PLAYER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  
  return successResponse(res, null, 'Successfully left queue');
});

/**
 * Get queue status
 * GET /queue
 */
export const getQueueStatus = asyncHandler(async (req, res) => {
  const queue = await queueService.getQueue();
  const stats = await queueService.getQueueStats();
  
  return successResponse(res, {
    players: queue,
    stats,
  });
});

/**
 * Get player's queue position
 * GET /queue/players/:playerId/position
 */
export const getQueuePosition = asyncHandler(async (req, res) => {
  const { playerId } = req.params;
  
  try {
    const position = await queueService.getQueuePosition(playerId);
    
    return successResponse(res, position);
  } catch (error) {
    return errorResponse(res, error.message, HTTP_STATUS.NOT_FOUND);
  }
});

/**
 * Match players from queue (system operation)
 * POST /queue/match
 */
export const matchPlayers = asyncHandler(async (req, res) => {
  const { playerCount } = req.body;
  
  const matchedPlayers = await queueService.matchPlayersFromQueue(playerCount);
  
  if (matchedPlayers.length === 0) {
    return errorResponse(res, 'Not enough players in queue', HTTP_STATUS.BAD_REQUEST);
  }
  
  // Create a game with matched players
  const game = await gameService.createGame({
    language: matchedPlayers[0].language,
    maxPlayers: matchedPlayers.length,
  });
  
  // Add players to game
  for (const player of matchedPlayers) {
    await gameService.addPlayerToGame(game.gameId, {
      playerId: player.playerId,
      username: player.username,
      language: player.language,
    });
  }
  
  return successResponse(res, {
    game,
    matchedPlayers,
  }, 'Players matched and game created');
});

export default {
  joinQueue,
  leaveQueue,
  getQueueStatus,
  getQueuePosition,
  matchPlayers,
};
