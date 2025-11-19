import Game from '../models/Game.js';
import {
  mockGames,
  mockCellsGame1,
  mockCellsGame2,
  getNextGameId,
  getCentralCells,
  assignStartingPositions,
  getRandomColor,
  initializeGridCells,
} from '../utils/helpers.js';
import { GAME_CONFIG, GAME_STATUS, ERROR_MESSAGES } from '../config/constants.js';

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
 * Create a new game
 * @param {Object} gameData - Game creation data
 * @returns {Promise<Object>} Created game
 */
export const createGame = async (gameData) => {
  if (useMockData) {
    const newGame = {
      gameId: getNextGameId(),
      language: gameData.language || 'en',
      gridSize: gameData.gridSize || GAME_CONFIG.GRID_SIZE,
      maxPlayers: gameData.maxPlayers || GAME_CONFIG.MAX_PLAYERS,
      currentPlayers: 0,
      players: [],
      status: GAME_STATUS.WAITING,
      currentTurn: {
        playerId: null,
        turnNumber: 0,
      },
      turnOrder: [],
      winner: null,
      rematchVotes: [],
      centralCells: getCentralCells(gameData.gridSize || GAME_CONFIG.GRID_SIZE),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockGames.push(newGame);
    return newGame;
  }
  
  const game = new Game({
    gameId: Date.now(),
    language: gameData.language || 'en',
    gridSize: gameData.gridSize || GAME_CONFIG.GRID_SIZE,
    maxPlayers: gameData.maxPlayers || GAME_CONFIG.MAX_PLAYERS,
    centralCells: getCentralCells(gameData.gridSize || GAME_CONFIG.GRID_SIZE),
  });
  
  return await game.save();
};

/**
 * Get game by ID
 * @param {Number} gameId - Game ID
 * @returns {Promise<Object>} Game object
 */
export const getGameById = async (gameId) => {
  if (useMockData) {
    return mockGames.find(g => g.gameId === parseInt(gameId));
  }
  
  return await Game.findOne({ gameId });
};

/**
 * Get all games
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of games
 */
export const getAllGames = async (filters = {}) => {
  if (useMockData) {
    let games = [...mockGames];
    
    if (filters.status) {
      games = games.filter(g => g.status === filters.status);
    }
    
    return games;
  }
  
  const query = {};
  if (filters.status) {
    query.status = filters.status;
  }
  
  return await Game.find(query).sort({ createdAt: -1 });
};

/**
 * Add player to game
 * @param {Number} gameId - Game ID
 * @param {Object} playerData - Player data
 * @returns {Promise<Object>} Updated game
 */
export const addPlayerToGame = async (gameId, playerData) => {
  if (useMockData) {
    const game = mockGames.find(g => g.gameId === parseInt(gameId));
    
    if (!game) {
      throw new Error(ERROR_MESSAGES.GAME_NOT_FOUND);
    }
    
    if (game.currentPlayers >= game.maxPlayers) {
      throw new Error(ERROR_MESSAGES.GAME_FULL);
    }
    
    if (game.status !== GAME_STATUS.WAITING) {
      throw new Error(ERROR_MESSAGES.GAME_ALREADY_STARTED);
    }
    
    const playerExists = game.players.some(p => p.playerId === playerData.playerId);
    if (playerExists) {
      throw new Error(ERROR_MESSAGES.PLAYER_ALREADY_IN_GAME);
    }
    
    const usedColors = game.players.map(p => p.color);
    const color = getRandomColor(usedColors);
    
    const newPlayer = {
      playerId: playerData.playerId,
      username: playerData.username,
      language: playerData.language || 'en',
      color,
      claimedCells: [],
      score: 0,
      status: 'active',
      startingCell: null,
    };
    
    game.players.push(newPlayer);
    game.currentPlayers += 1;
    game.updatedAt = new Date();
    
    // Start game if we have enough players
    if (game.currentPlayers >= GAME_CONFIG.MIN_PLAYERS) {
      const startingPositions = assignStartingPositions(game.currentPlayers, game.gridSize);
      
      game.players.forEach((player, index) => {
        player.startingCell = startingPositions[index];
        player.claimedCells.push(startingPositions[index]);
      });
      
      game.status = GAME_STATUS.IN_PROGRESS;
      game.turnOrder = game.players.map(p => p.playerId);
      game.currentTurn.playerId = game.turnOrder[0];
      game.currentTurn.turnNumber = 1;
    }
    
    return newPlayer;
  }
  
  const game = await Game.findOne({ gameId });
  
  if (!game) {
    throw new Error(ERROR_MESSAGES.GAME_NOT_FOUND);
  }
  
  const usedColors = game.players.map(p => p.color);
  const color = getRandomColor(usedColors);
  
  const newPlayer = {
    playerId: playerData.playerId,
    username: playerData.username,
    language: playerData.language || 'en',
    color,
    claimedCells: [],
    score: 0,
    status: 'active',
    startingCell: null,
  };
  
  const added = game.addPlayer(newPlayer);
  
  if (!added) {
    if (game.currentPlayers >= game.maxPlayers) {
      throw new Error(ERROR_MESSAGES.GAME_FULL);
    }
    throw new Error(ERROR_MESSAGES.PLAYER_ALREADY_IN_GAME);
  }
  
  // Start game if we have enough players
  if (game.currentPlayers >= GAME_CONFIG.MIN_PLAYERS && game.status === GAME_STATUS.WAITING) {
    const startingPositions = assignStartingPositions(game.currentPlayers, game.gridSize);
    
    game.players.forEach((player, index) => {
      player.startingCell = startingPositions[index];
      player.claimedCells.push(startingPositions[index]);
    });
    
    game.startGame();
  }
  
  await game.save();
  
  return newPlayer;
};

/**
 * Remove player from game
 * @param {Number} gameId - Game ID
 * @param {Number} playerId - Player ID
 * @returns {Promise<Boolean>} Success status
 */
export const removePlayerFromGame = async (gameId, playerId) => {
  if (useMockData) {
    const game = mockGames.find(g => g.gameId === parseInt(gameId));
    
    if (!game) {
      throw new Error(ERROR_MESSAGES.GAME_NOT_FOUND);
    }
    
    const initialLength = game.players.length;
    game.players = game.players.filter(p => p.playerId !== parseInt(playerId));
    
    if (game.players.length < initialLength) {
      game.currentPlayers -= 1;
      game.updatedAt = new Date();
      
      // Cancel game if not enough players
      if (game.currentPlayers < GAME_CONFIG.MIN_PLAYERS && game.status === GAME_STATUS.IN_PROGRESS) {
        game.status = GAME_STATUS.CANCELLED;
      }
      
      return true;
    }
    
    throw new Error(ERROR_MESSAGES.PLAYER_NOT_FOUND);
  }
  
  const game = await Game.findOne({ gameId });
  
  if (!game) {
    throw new Error(ERROR_MESSAGES.GAME_NOT_FOUND);
  }
  
  const removed = game.removePlayer(playerId);
  
  if (!removed) {
    throw new Error(ERROR_MESSAGES.PLAYER_NOT_FOUND);
  }
  
  // Cancel game if not enough players
  if (game.currentPlayers < GAME_CONFIG.MIN_PLAYERS && game.status === GAME_STATUS.IN_PROGRESS) {
    game.status = GAME_STATUS.CANCELLED;
  }
  
  await game.save();
  
  return true;
};

/**
 * Update player profile
 * @param {Number} gameId - Game ID
 * @param {Number} playerId - Player ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated player
 */
export const updatePlayerProfile = async (gameId, playerId, updateData) => {
  if (useMockData) {
    const game = mockGames.find(g => g.gameId === parseInt(gameId));
    
    if (!game) {
      throw new Error(ERROR_MESSAGES.GAME_NOT_FOUND);
    }
    
    const player = game.players.find(p => p.playerId === parseInt(playerId));
    
    if (!player) {
      throw new Error(ERROR_MESSAGES.PLAYER_NOT_FOUND);
    }
    
    if (updateData.username) player.username = updateData.username;
    if (updateData.language) player.language = updateData.language;
    
    game.updatedAt = new Date();
    
    return player;
  }
  
  const game = await Game.findOne({ gameId });
  
  if (!game) {
    throw new Error(ERROR_MESSAGES.GAME_NOT_FOUND);
  }
  
  const player = game.players.find(p => p.playerId === playerId);
  
  if (!player) {
    throw new Error(ERROR_MESSAGES.PLAYER_NOT_FOUND);
  }
  
  if (updateData.username) player.username = updateData.username;
  if (updateData.language) player.language = updateData.language;
  
  await game.save();
  
  return player;
};

/**
 * Get current turn info
 * @param {Number} gameId - Game ID
 * @returns {Promise<Object>} Turn info
 */
export const getCurrentTurn = async (gameId) => {
  const game = await getGameById(gameId);
  
  if (!game) {
    throw new Error(ERROR_MESSAGES.GAME_NOT_FOUND);
  }
  
  return {
    currentPlayerId: game.currentTurn.playerId,
    turnNumber: game.currentTurn.turnNumber,
  };
};

/**
 * Set turn order
 * @param {Number} gameId - Game ID
 * @param {Array} order - Array of player IDs in turn order
 * @returns {Promise<Object>} Updated game
 */
export const setTurnOrder = async (gameId, order) => {
  if (useMockData) {
    const game = mockGames.find(g => g.gameId === parseInt(gameId));
    
    if (!game) {
      throw new Error(ERROR_MESSAGES.GAME_NOT_FOUND);
    }
    
    game.turnOrder = order;
    game.currentTurn.playerId = order[0];
    game.updatedAt = new Date();
    
    return game;
  }
  
  const game = await Game.findOne({ gameId });
  
  if (!game) {
    throw new Error(ERROR_MESSAGES.GAME_NOT_FOUND);
  }
  
  game.turnOrder = order;
  game.currentTurn.playerId = order[0];
  
  await game.save();
  
  return game;
};

/**
 * Record rematch vote
 * @param {Number} gameId - Game ID
 * @param {Number} playerId - Player ID
 * @returns {Promise<Object>} Updated game
 */
export const recordRematchVote = async (gameId, playerId) => {
  if (useMockData) {
    const game = mockGames.find(g => g.gameId === parseInt(gameId));
    
    if (!game) {
      throw new Error(ERROR_MESSAGES.GAME_NOT_FOUND);
    }
    
    const alreadyVoted = game.rematchVotes.some(v => v.playerId === parseInt(playerId));
    
    if (!alreadyVoted) {
      game.rematchVotes.push({
        playerId: parseInt(playerId),
        votedAt: new Date(),
      });
      game.updatedAt = new Date();
    }
    
    return game;
  }
  
  const game = await Game.findOne({ gameId });
  
  if (!game) {
    throw new Error(ERROR_MESSAGES.GAME_NOT_FOUND);
  }
  
  const alreadyVoted = game.rematchVotes.some(v => v.playerId === playerId);
  
  if (!alreadyVoted) {
    game.rematchVotes.push({
      playerId,
      votedAt: new Date(),
    });
    
    await game.save();
  }
  
  return game;
};

/**
 * Advance to next turn
 * @param {Number} gameId - Game ID
 * @returns {Promise<Object>} Updated game
 */
export const advanceTurn = async (gameId) => {
  if (useMockData) {
    const game = mockGames.find(g => g.gameId === parseInt(gameId));
    
    if (!game) {
      throw new Error(ERROR_MESSAGES.GAME_NOT_FOUND);
    }
    
    if (game.turnOrder.length === 0) {
      throw new Error('Turn order not set');
    }
    
    const currentIndex = game.turnOrder.indexOf(game.currentTurn.playerId);
    const nextIndex = (currentIndex + 1) % game.turnOrder.length;
    
    game.currentTurn.playerId = game.turnOrder[nextIndex];
    
    if (nextIndex === 0) {
      game.currentTurn.turnNumber += 1;
    }
    
    game.updatedAt = new Date();
    
    return game;
  }
  
  const game = await Game.findOne({ gameId });
  
  if (!game) {
    throw new Error(ERROR_MESSAGES.GAME_NOT_FOUND);
  }
  
  game.nextTurn();
  await game.save();
  
  return game;
};

export default {
  setDataSource,
  createGame,
  getGameById,
  getAllGames,
  addPlayerToGame,
  removePlayerFromGame,
  updatePlayerProfile,
  getCurrentTurn,
  setTurnOrder,
  recordRematchVote,
  advanceTurn,
};
