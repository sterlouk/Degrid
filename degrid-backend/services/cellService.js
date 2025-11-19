import Cell from '../models/Cell.js';
import {
  mockCellsGame1,
  mockCellsGame2,
  areAdjacent,
  calculatePosition,
  randomInt,
} from '../utils/helpers.js';
import { ERROR_MESSAGES, CELL_STATUS } from '../config/constants.js';

// Global variable to track if using database or mock data
let useMockData = true;

/**
 * Set the data source mode
 * @param {Boolean} useMock - True to use mock data, false to use database
 */
export const setDataSource = (useMock) => {
  useMockData = useMock;
};

/**
 * Get all mock cells
 * @returns {Array} All mock cells
 */
const getAllMockCells = () => {
  return [...mockCellsGame1, ...mockCellsGame2];
};

/**
 * Get cells for a game
 * @param {Number} gameId - Game ID
 * @returns {Promise<Array>} Array of cells
 */
export const getCellsByGameId = async (gameId) => {
  if (useMockData) {
    const allCells = getAllMockCells();
    return allCells.filter(c => c.gameId === parseInt(gameId));
  }
  
  return await Cell.find({ gameId }).sort({ cellId: 1 });
};

/**
 * Get a specific cell
 * @param {Number} gameId - Game ID
 * @param {Number} cellId - Cell ID
 * @returns {Promise<Object>} Cell object
 */
export const getCellById = async (gameId, cellId) => {
  if (useMockData) {
    const allCells = getAllMockCells();
    return allCells.find(c => c.gameId === parseInt(gameId) && c.cellId === parseInt(cellId));
  }
  
  return await Cell.findOne({ gameId, cellId });
};

/**
 * Claim a cell
 * @param {Number} gameId - Game ID
 * @param {Number} cellId - Cell ID
 * @param {Number} playerId - Player ID
 * @param {String} playerColor - Player's color
 * @param {Number} completionTime - Time taken to complete challenge (ms)
 * @returns {Promise<Object>} Updated cell
 */
export const claimCell = async (gameId, cellId, playerId, playerColor, completionTime = 5000, debug = false) => {
  // Returns object: { success: boolean, message: string, cell: object|null }
  if (useMockData) {
    const allCells = getAllMockCells();
    const cell = allCells.find(c => c.gameId === parseInt(gameId) && c.cellId === parseInt(cellId));

    if (!cell) {
      throw new Error(ERROR_MESSAGES.CELL_NOT_FOUND);
    }

    // stored challenge value (may be present from initialization)
    let stored = cell.challengeValue ?? null;

    // If no stored value, assign one and return that the stored value was created (no ownership transfer)
    if (stored === null || stored === undefined) {
      stored = randomInt(1, 100);
      cell.challengeValue = stored;
      cell.updatedAt = new Date();

      // Log stored value for debugging when explicitly allowed via env
      const envAllowed = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'staging';
      if (envAllowed && process.env.DEBUG_CLAIM === 'true') {
        console.info(`[DEBUG][claim][store] game:${gameId} cell:${cellId} stored:${stored}`);
      }

      const res = {
        success: false,
        message: 'Challenge target stored. Make another attempt to resolve ownership.',
        cell: null,
      };

      return res;
    }

    // Generate attempt
    const attempt = randomInt(1, 100);

    // If attempt succeeds
    if (attempt <= stored) {
      // Update cell ownership
      cell.owner = parseInt(playerId);
      cell.cellColour = playerColor;
      cell.status = CELL_STATUS.CLAIMED;

      // Update best times
      const existingTimeIndex = cell.bestTimes.findIndex(bt => bt.playerId === parseInt(playerId));
      if (existingTimeIndex >= 0) {
        if (completionTime < cell.bestTimes[existingTimeIndex].time) {
          cell.bestTimes[existingTimeIndex].time = completionTime;
          cell.bestTimes[existingTimeIndex].completedAt = new Date();
        }
      } else {
        cell.bestTimes.push({
          playerId: parseInt(playerId),
          time: completionTime,
          completedAt: new Date(),
        });
      }

      // Sort best times
      cell.bestTimes.sort((a, b) => a.time - b.time);

      // Add to claim history
      cell.claimHistory.push({
        playerId: parseInt(playerId),
        claimedAt: new Date(),
      });

      cell.updatedAt = new Date();

      // Log attempt/stored for debugging when allowed
      const envAllowed = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'staging';
      if (envAllowed && process.env.DEBUG_CLAIM === 'true') {
        console.info(`[DEBUG][claim][success] game:${gameId} cell:${cellId} player:${playerId} attempt:${attempt} stored:${stored}`);
      }

      return {
        success: true,
        message: 'Cell claimed',
        cell,
      };
    }

    // Attempt failed - record in history
    cell.claimHistory.push({
      playerId: parseInt(playerId),
      claimedAt: new Date(),
      lostAt: new Date(),
    });
    cell.updatedAt = new Date();

    // Log failed attempt for debugging when allowed
    const envAllowedFail = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'staging';
    if (envAllowedFail && process.env.DEBUG_CLAIM === 'true') {
      console.info(`[DEBUG][claim][fail] game:${gameId} cell:${cellId} player:${playerId} attempt:${attempt} stored:${stored}`);
    }

    return {
      success: false,
      message: 'Attempt failed - ownership not transferred',
      cell: null,
    };
  }

  // Database-backed path
  const cell = await Cell.findOne({ gameId, cellId });

  if (!cell) {
    throw new Error(ERROR_MESSAGES.CELL_NOT_FOUND);
  }

  // stored value may be present in db; if missing, store and return
  let stored = cell.challengeValue ?? null;

  if (stored === null || stored === undefined) {
    stored = randomInt(1, 100);
    cell.challengeValue = stored;
    await cell.save();

    // Log stored value for debugging when allowed
    const envAllowedDb = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'staging';
    if (envAllowedDb && process.env.DEBUG_CLAIM === 'true') {
      console.info(`[DEBUG][claim][store] game:${gameId} cell:${cellId} stored:${stored}`);
    }

    return {
      success: false,
      message: 'Challenge target stored. Make another attempt to resolve ownership.',
      cell: null,
    };
  }

  const attempt = randomInt(1, 100);

  if (attempt <= stored) {
    // Use existing model method to claim and save
    await cell.claimCell(parseInt(playerId), completionTime, playerColor);

    // Log attempt/stored for debugging when allowed
    const envAllowedDbSuccess = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'staging';
    if (envAllowedDbSuccess && process.env.DEBUG_CLAIM === 'true') {
      console.info(`[DEBUG][claim][success] game:${gameId} cell:${cellId} player:${playerId} attempt:${attempt} stored:${stored}`);
    }

    return {
      success: true,
      message: 'Cell claimed',
      cell,
    };
  }

  // Failed attempt - record in history and save
  cell.claimHistory.push({
    playerId: parseInt(playerId),
    claimedAt: new Date(),
    lostAt: new Date(),
  });
  await cell.save();

  // Failed attempt - record in history and save
  cell.claimHistory.push({
    playerId: parseInt(playerId),
    claimedAt: new Date(),
    lostAt: new Date(),
  });
  await cell.save();

  // Log failed attempt for debugging when allowed
  const envAllowedDbFail = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'staging';
  if (envAllowedDbFail && process.env.DEBUG_CLAIM === 'true') {
    console.info(`[DEBUG][claim][fail] game:${gameId} cell:${cellId} player:${playerId} attempt:${attempt} stored:${stored}`);
  }

  return {
    success: false,
    message: 'Attempt failed - ownership not transferred',
    cell: null,
  };
};

/**
 * Check if a cell is adjacent to player's claimed cells
 * @param {Number} gameId - Game ID
 * @param {Number} cellId - Cell ID to check
 * @param {Array} playerCells - Array of cell IDs claimed by player
 * @param {Number} gridSize - Size of the grid
 * @returns {Boolean} True if adjacent
 */
export const isCellAdjacentToPlayer = (gameId, cellId, playerCells, gridSize) => {
  for (const ownedCellId of playerCells) {
    if (areAdjacent(cellId, ownedCellId, gridSize)) {
      return true;
    }
  }
  return false;
};

/**
 * Update cell color
 * @param {Number} gameId - Game ID
 * @param {Number} cellId - Cell ID
 * @param {String} color - New color
 * @returns {Promise<Object>} Updated cell
 */
export const updateCellColor = async (gameId, cellId, color) => {
  if (useMockData) {
    const allCells = getAllMockCells();
    const cell = allCells.find(c => c.gameId === parseInt(gameId) && c.cellId === parseInt(cellId));
    
    if (!cell) {
      throw new Error(ERROR_MESSAGES.CELL_NOT_FOUND);
    }
    
    cell.cellColour = color;
    cell.updatedAt = new Date();
    
    return cell;
  }
  
  const cell = await Cell.findOne({ gameId, cellId });
  
  if (!cell) {
    throw new Error(ERROR_MESSAGES.CELL_NOT_FOUND);
  }
  
  cell.cellColour = color;
  await cell.save();
  
  return cell;
};

/**
 * Get cells owned by a player
 * @param {Number} gameId - Game ID
 * @param {Number} playerId - Player ID
 * @returns {Promise<Array>} Array of cells
 */
export const getCellsByPlayer = async (gameId, playerId) => {
  if (useMockData) {
    const allCells = getAllMockCells();
    return allCells.filter(c => c.gameId === parseInt(gameId) && c.owner === parseInt(playerId));
  }
  
  return await Cell.find({ gameId, owner: playerId });
};

export default {
  setDataSource,
  getCellsByGameId,
  getCellById,
  claimCell,
  isCellAdjacentToPlayer,
  updateCellColor,
  getCellsByPlayer,
};
