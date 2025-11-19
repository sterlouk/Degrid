import Player from '../models/Player.js';
import { mockPlayers, getNextPlayerId, getRandomColor } from '../utils/helpers.js';
import { ERROR_MESSAGES, PLAYER_STATUS } from '../config/constants.js';

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
 * Get player by ID
 * @param {Number} playerId - Player ID
 * @returns {Promise<Object>} Player object
 */
export const getPlayerById = async (playerId) => {
  if (useMockData) {
    return mockPlayers.find(p => p.playerId === parseInt(playerId));
  }
  
  return await Player.findOne({ playerId });
};

/**
 * Get all players
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of players
 */
export const getAllPlayers = async (filters = {}) => {
  if (useMockData) {
    let players = [...mockPlayers];
    
    if (filters.status) {
      players = players.filter(p => p.status === filters.status);
    }
    
    if (filters.isConnected !== undefined) {
      players = players.filter(p => p.isConnected === filters.isConnected);
    }
    
    return players;
  }
  
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.isConnected !== undefined) query.isConnected = filters.isConnected;
  
  return await Player.find(query);
};

/**
 * Create a new player
 * @param {Object} playerData - Player data
 * @returns {Promise<Object>} Created player
 */
export const createPlayer = async (playerData) => {
  if (useMockData) {
    const newPlayer = {
      playerId: playerData.playerId || getNextPlayerId(),
      username: playerData.username,
      language: playerData.language || 'en',
      status: PLAYER_STATUS.ACTIVE,
      color: getRandomColor(),
      claimedCells: [],
      score: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      isConnected: true,
      lastActiveAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockPlayers.push(newPlayer);
    return newPlayer;
  }
  
  const player = new Player({
    playerId: playerData.playerId || Date.now(),
    username: playerData.username,
    language: playerData.language || 'en',
    color: getRandomColor(),
  });
  
  return await player.save();
};

/**
 * Update player
 * @param {Number} playerId - Player ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated player
 */
export const updatePlayer = async (playerId, updateData) => {
  if (useMockData) {
    const player = mockPlayers.find(p => p.playerId === parseInt(playerId));
    
    if (!player) {
      throw new Error(ERROR_MESSAGES.PLAYER_NOT_FOUND);
    }
    
    Object.assign(player, updateData);
    player.updatedAt = new Date();
    
    return player;
  }
  
  const player = await Player.findOne({ playerId });
  
  if (!player) {
    throw new Error(ERROR_MESSAGES.PLAYER_NOT_FOUND);
  }
  
  Object.assign(player, updateData);
  await player.save();
  
  return player;
};

/**
 * Mark player as inactive
 * @param {Number} playerId - Player ID
 * @returns {Promise<Object>} Updated player
 */
export const markPlayerInactive = async (playerId) => {
  if (useMockData) {
    const player = mockPlayers.find(p => p.playerId === parseInt(playerId));
    
    if (!player) {
      throw new Error(ERROR_MESSAGES.PLAYER_NOT_FOUND);
    }
    
    player.status = PLAYER_STATUS.INACTIVE;
    player.isConnected = false;
    player.updatedAt = new Date();
    
    return player;
  }
  
  const player = await Player.findOne({ playerId });
  
  if (!player) {
    throw new Error(ERROR_MESSAGES.PLAYER_NOT_FOUND);
  }
  
  await player.markInactive();
  
  return player;
};

/**
 * Update player activity
 * @param {Number} playerId - Player ID
 * @returns {Promise<Object>} Updated player
 */
export const updatePlayerActivity = async (playerId) => {
  if (useMockData) {
    const player = mockPlayers.find(p => p.playerId === parseInt(playerId));
    
    if (!player) {
      throw new Error(ERROR_MESSAGES.PLAYER_NOT_FOUND);
    }
    
    player.lastActiveAt = new Date();
    player.isConnected = true;
    player.updatedAt = new Date();
    
    return player;
  }
  
  const player = await Player.findOne({ playerId });
  
  if (!player) {
    throw new Error(ERROR_MESSAGES.PLAYER_NOT_FOUND);
  }
  
  await player.updateActivity();
  
  return player;
};

/**
 * Get player statistics
 * @param {Number} playerId - Player ID
 * @returns {Promise<Object>} Player statistics
 */
export const getPlayerStats = async (playerId) => {
  const player = await getPlayerById(playerId);
  
  if (!player) {
    throw new Error(ERROR_MESSAGES.PLAYER_NOT_FOUND);
  }
  
  return {
    playerId: player.playerId,
    username: player.username,
    gamesPlayed: player.gamesPlayed,
    gamesWon: player.gamesWon,
    winRate: player.gamesPlayed > 0 ? ((player.gamesWon / player.gamesPlayed) * 100).toFixed(2) : 0,
    score: player.score,
    status: player.status,
  };
};

export default {
  setDataSource,
  getPlayerById,
  getAllPlayers,
  createPlayer,
  updatePlayer,
  markPlayerInactive,
  updatePlayerActivity,
  getPlayerStats,
};
