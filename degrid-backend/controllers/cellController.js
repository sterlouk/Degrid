import cellService from '../services/cellService.js';
import { successResponse, errorResponse } from '../utils/responses.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * Get all cells for a game
 * GET /games/:gameId/cells
 */
export const getGameCells = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  
  const cells = await cellService.getCellsByGameId(gameId);
  
  return successResponse(res, cells);
});

/**
 * Get specific cell
 * GET /games/:gameId/cells/:cellId
 */
export const getCell = asyncHandler(async (req, res) => {
  const { gameId, cellId } = req.params;
  
  const cell = await cellService.getCellById(gameId, cellId);
  
  if (!cell) {
    return errorResponse(res, ERROR_MESSAGES.CELL_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }
  
  return successResponse(res, cell);
});

/**
 * Update cell color
 * PUT /games/:gameId/grid/cells/:cellId/colour
 */
export const updateCellColor = asyncHandler(async (req, res) => {
  const { gameId, cellId } = req.params;
  const { color } = req.body;
  
  if (!color) {
    return errorResponse(res, 'Color is required', HTTP_STATUS.BAD_REQUEST);
  }
  
  const cell = await cellService.updateCellColor(gameId, cellId, color);
  
  return successResponse(res, cell, 'Cell color updated');
});

/**
 * Get cells owned by a player
 * GET /games/:gameId/players/:playerId/cells
 */
export const getPlayerCells = asyncHandler(async (req, res) => {
  const { gameId, playerId } = req.params;
  
  const cells = await cellService.getCellsByPlayer(gameId, playerId);
  
  return successResponse(res, cells);
});

export default {
  getGameCells,
  getCell,
  updateCellColor,
  getPlayerCells,
};
