import gameService from '../services/gameService.js';
import cellService from '../services/cellService.js';
import { successResponse, errorResponse } from '../utils/responses.js';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/constants.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Create a new game
 * POST /games
 */
export const createGame = asyncHandler(async (req, res) => {
  const { language, maxPlayers, gridSize } = req.body;
  
  const game = await gameService.createGame({
    language,
    maxPlayers,
    gridSize,
  });
  
  return successResponse(res, game, SUCCESS_MESSAGES.GAME_CREATED, HTTP_STATUS.CREATED);
});

/**
 * Get game by ID
 * GET /games/:gameId
 */
export const getGame = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  
  const game = await gameService.getGameById(gameId);
  
  if (!game) {
    return errorResponse(res, ERROR_MESSAGES.GAME_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  
  return successResponse(res, game);
});

/**
 * Get all games
 * GET /games
 */
export const getAllGames = asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  const games = await gameService.getAllGames({ status });
  
  return successResponse(res, games);
});

/**
 * Get game grid
 * GET /games/:gameId/grid
 */
export const getGameGrid = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  
  const game = await gameService.getGameById(gameId);
  
  if (!game) {
    return errorResponse(res, ERROR_MESSAGES.GAME_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  
  const cells = await cellService.getCellsByGameId(gameId);
  
  return successResponse(res, cells);
});

/**
 * Update game grid (system operation)
 * PUT /games/:gameId/grid
 */
export const updateGameGrid = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  
  const game = await gameService.getGameById(gameId);
  
  if (!game) {
    return errorResponse(res, ERROR_MESSAGES.GAME_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  
  // Advance turn
  await gameService.advanceTurn(gameId);
  
  return successResponse(res, null, 'Grid updated successfully');
});

/**
 * Player joins game
 * POST /games/:gameId/players
 */
export const joinGame = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  const { playerId, username, language } = req.body;
  
  const player = await gameService.addPlayerToGame(gameId, {
    playerId,
    username,
    language,
  });
  
  return successResponse(res, player, SUCCESS_MESSAGES.PLAYER_JOINED, HTTP_STATUS.OK);
});

/**
 * Remove player from game
 * DELETE /games/:gameId/players/:playerId
 */
export const removePlayer = asyncHandler(async (req, res) => {
  const { gameId, playerId } = req.params;
  
  await gameService.removePlayerFromGame(gameId, playerId);
  
  return successResponse(res, null, SUCCESS_MESSAGES.PLAYER_REMOVED);
});

/**
 * Update player profile
 * PUT /games/:gameId/players/:playerId/profile
 */
export const updatePlayerProfile = asyncHandler(async (req, res) => {
  const { gameId, playerId } = req.params;
  const { username, language } = req.body;
  
  const player = await gameService.updatePlayerProfile(gameId, playerId, {
    username,
    language,
  });
  
  return successResponse(res, player, SUCCESS_MESSAGES.PROFILE_UPDATED);
});

/**
 * Get current turn
 * GET /games/:gameId/turn
 */
export const getCurrentTurn = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  
  const turnInfo = await gameService.getCurrentTurn(gameId);
  
  return successResponse(res, turnInfo);
});

/**
 * Set turn order
 * PUT /games/:gameId/turn-order
 */
export const setTurnOrder = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  const { order } = req.body;
  
  await gameService.setTurnOrder(gameId, order);
  
  return successResponse(res, null, SUCCESS_MESSAGES.TURN_UPDATED);
});

/**
 * Claim or challenge a cell
 * POST /games/:gameId/cells/:cellId/claim
 */
export const claimCell = asyncHandler(async (req, res) => {
  const { gameId, cellId } = req.params;
  const { playerId } = req.body;
  
  // Get game
  const game = await gameService.getGameById(gameId);
  
  if (!game) {
    return errorResponse(res, ERROR_MESSAGES.GAME_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  
  // Check if it's player's turn
  if (game.currentTurn.playerId !== parseInt(playerId)) {
    return errorResponse(res, ERROR_MESSAGES.NOT_YOUR_TURN, HTTP_STATUS.FORBIDDEN);
  }
  
  // Get player from game
  const player = game.players.find(p => p.playerId === parseInt(playerId));
  
  if (!player) {
    return errorResponse(res, ERROR_MESSAGES.PLAYER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  
  // Get cell
  const cell = await cellService.getCellById(gameId, cellId);
  
  if (!cell) {
    return errorResponse(res, ERROR_MESSAGES.CELL_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  
  // Check if cell is adjacent to player's cells (unless it's their starting cell)
  if (player.claimedCells.length > 0) {
    const isAdjacent = cellService.isCellAdjacentToPlayer(
      gameId,
      parseInt(cellId),
      player.claimedCells,
      game.gridSize
    );
    
    if (!isAdjacent) {
      return errorResponse(res, ERROR_MESSAGES.CELL_NOT_ADJACENT, HTTP_STATUS.BAD_REQUEST);
    }
  }
  
  // Simulate challenge completion (in real app, this would be checked separately)
  const completionTime = Math.floor(Math.random() * 10000) + 3000; // 3-13 seconds

  // Debug flag: include stored/attempt values when present.
  // Safety: allow debug only when running in development or staging AND the DEBUG_CLAIM env var is explicitly set to 'true'.
  const debugRequested = req.query && (req.query.debug === 'true' || req.query.debug === '1');
  const envAllowed = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'staging';
  const debug = envAllowed && process.env.DEBUG_CLAIM === 'true' && debugRequested;

  // Attempt to claim the cell (service returns structured result)
  const result = await cellService.claimCell(
    gameId,
    cellId,
    playerId,
    player.color,
    completionTime,
    debug
  );

  if (result.success) {
    const updatedCell = result.cell;

    // Update player's claimed cells in game
    if (!player.claimedCells.includes(parseInt(cellId))) {
      player.claimedCells.push(parseInt(cellId));
      player.score += 1;
    }

    // Check win condition
    const hasWon = game.checkWinCondition(parseInt(playerId), player.claimedCells);

    if (hasWon) {
      await game.completeGame(parseInt(playerId));
      return successResponse(res, {
        cell: updatedCell,
        gameWon: true,
        winner: playerId,
        debug: debug ? { logged: true } : undefined,
      }, 'Cell claimed - Game won!');
    }

    // Advance turn
    await gameService.advanceTurn(gameId);

    return successResponse(res, {
      success: true,
      message: SUCCESS_MESSAGES.CELL_CLAIMED,
      result: {
        success: result.success,
        message: result.message,
        cell: result.cell,
      },
      debug: debug ? { logged: true } : undefined,
    }, SUCCESS_MESSAGES.CELL_CLAIMED);
  }

  // On failure (no ownership transfer), still advance turn (consumes player's attempt)
  await gameService.advanceTurn(gameId);

  return successResponse(res, {
    success: false,
    message: result.message,
    debug: debug ? { logged: true } : undefined,
  }, result.message);
});

/**
 * Player votes for rematch
 * POST /games/:gameId/players/:playerId/rematch
 */
export const voteRematch = asyncHandler(async (req, res) => {
  const { gameId, playerId } = req.params;
  
  await gameService.recordRematchVote(gameId, playerId);
  
  return successResponse(res, null, SUCCESS_MESSAGES.VOTE_RECORDED);
});

export default {
  createGame,
  getGame,
  getAllGames,
  getGameGrid,
  updateGameGrid,
  joinGame,
  removePlayer,
  updatePlayerProfile,
  getCurrentTurn,
  setTurnOrder,
  claimCell,
  voteRematch,
};
