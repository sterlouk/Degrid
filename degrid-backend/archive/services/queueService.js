import Queue from '../models/Queue.js';
import { mockQueue, getNextPlayerId } from '../utils/helpers.js';
import { ERROR_MESSAGES, GAME_CONFIG } from '../config/constants.js';

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
 * Add player to queue
 * @param {Object} playerData - Player data
 * @returns {Promise<Object>} Queue entry
 */
export const addToQueue = async (playerData) => {
  if (useMockData) {
    // Check if player already in queue
    const existingEntry = mockQueue.find(q => q.playerId === playerData.playerId);
    
    if (existingEntry) {
      throw new Error('Player already in queue');
    }
    
    const queueEntry = {
      playerId: playerData.playerId || getNextPlayerId(),
      username: playerData.username,
      language: playerData.language || 'en',
      preferredMaxPlayers: playerData.preferredMaxPlayers || null,
      joinedAt: new Date(),
      status: 'waiting',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockQueue.push(queueEntry);
    return queueEntry;
  }
  
  // Check if player already in queue
  const existingEntry = await Queue.findOne({ playerId: playerData.playerId, status: 'waiting' });
  
  if (existingEntry) {
    throw new Error('Player already in queue');
  }
  
  const queueEntry = new Queue({
    playerId: playerData.playerId,
    username: playerData.username,
    language: playerData.language || 'en',
    preferredMaxPlayers: playerData.preferredMaxPlayers,
  });
  
  return await queueEntry.save();
};

/**
 * Remove player from queue
 * @param {Number} playerId - Player ID
 * @returns {Promise<Boolean>} Success status
 */
export const removeFromQueue = async (playerId) => {
  if (useMockData) {
    const initialLength = mockQueue.length;
    const index = mockQueue.findIndex(q => q.playerId === parseInt(playerId));
    
    if (index >= 0) {
      mockQueue.splice(index, 1);
      return true;
    }
    
    return false;
  }
  
  const result = await Queue.deleteOne({ playerId });
  return result.deletedCount > 0;
};

/**
 * Get all players in queue
 * @returns {Promise<Array>} Array of queue entries
 */
export const getQueue = async () => {
  if (useMockData) {
    return mockQueue.filter(q => q.status === 'waiting');
  }
  
  return await Queue.find({ status: 'waiting' }).sort({ joinedAt: 1 });
};

/**
 * Get queue position for a player
 * @param {Number} playerId - Player ID
 * @returns {Promise<Object>} Position info
 */
export const getQueuePosition = async (playerId) => {
  const queue = await getQueue();
  const position = queue.findIndex(q => q.playerId === parseInt(playerId));
  
  if (position === -1) {
    throw new Error(ERROR_MESSAGES.PLAYER_NOT_FOUND);
  }
  
  return {
    position: position + 1,
    totalInQueue: queue.length,
    estimatedWaitTime: Math.max(0, GAME_CONFIG.MIN_PLAYERS - queue.length) * 10, // Simple estimation
  };
};

/**
 * Match players from queue to create a game
 * @param {Number} playerCount - Number of players to match
 * @returns {Promise<Array>} Array of matched players
 */
export const matchPlayersFromQueue = async (playerCount = GAME_CONFIG.MIN_PLAYERS) => {
  const queue = await getQueue();
  
  if (queue.length < playerCount) {
    return [];
  }
  
  const matchedPlayers = queue.slice(0, playerCount);
  
  // Mark as matched
  if (useMockData) {
    matchedPlayers.forEach(player => {
      player.status = 'matched';
      player.updatedAt = new Date();
    });
    
    // Remove from queue
    matchedPlayers.forEach(player => {
      const index = mockQueue.findIndex(q => q.playerId === player.playerId);
      if (index >= 0) {
        mockQueue.splice(index, 1);
      }
    });
  } else {
    const playerIds = matchedPlayers.map(p => p.playerId);
    await Queue.updateMany(
      { playerId: { $in: playerIds } },
      { status: 'matched' }
    );
  }
  
  return matchedPlayers;
};

/**
 * Get queue statistics
 * @returns {Promise<Object>} Queue statistics
 */
export const getQueueStats = async () => {
  const queue = await getQueue();
  
  return {
    totalWaiting: queue.length,
    canStartGame: queue.length >= GAME_CONFIG.MIN_PLAYERS,
    playersNeeded: Math.max(0, GAME_CONFIG.MIN_PLAYERS - queue.length),
    averageWaitTime: queue.length > 0
      ? queue.reduce((sum, q) => sum + (Date.now() - q.joinedAt.getTime()), 0) / queue.length / 1000
      : 0,
  };
};

export default {
  setDataSource,
  addToQueue,
  removeFromQueue,
  getQueue,
  getQueuePosition,
  matchPlayersFromQueue,
  getQueueStats,
};
