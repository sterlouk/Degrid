import mongoose from 'mongoose';
import { GAME_STATUS, GAME_CONFIG } from '../config/constants.js';

/**
 * Game Schema
 * Represents a Degrid game instance
 */
const gameSchema = new mongoose.Schema({
  gameId: {
    type: Number,
    required: true,
    unique: true,
  },
  language: {
    type: String,
    default: 'en',
  },
  gridSize: {
    type: Number,
    required: true,
    default: GAME_CONFIG.GRID_SIZE,
    min: 5,
    max: 20,
  },
  maxPlayers: {
    type: Number,
    required: true,
    default: GAME_CONFIG.MAX_PLAYERS,
    min: GAME_CONFIG.MIN_PLAYERS,
    max: GAME_CONFIG.MAX_PLAYERS,
  },
  currentPlayers: {
    type: Number,
    default: 0,
  },
  players: [{
    playerId: Number,
    username: String,
    language: String,
    color: String,
    claimedCells: [Number],
    score: Number,
    status: String,
    startingCell: Number,
  }],
  status: {
    type: String,
    enum: Object.values(GAME_STATUS),
    default: GAME_STATUS.WAITING,
  },
  currentTurn: {
    playerId: Number,
    turnNumber: {
      type: Number,
      default: 0,
    },
  },
  turnOrder: [{
    type: Number,
  }],
  winner: {
    type: Number,
    default: null,
  },
  rematchVotes: [{
    playerId: Number,
    votedAt: Date,
  }],
  startedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  centralCells: [{
    type: Number,
  }],
}, {
  timestamps: true,
});

// Indexes
// Note: `gameId` is already declared as unique at the field level. Avoid duplicate index declarations.
gameSchema.index({ status: 1 });
gameSchema.index({ 'players.playerId': 1 });

/**
 * Add a player to the game
 * @param {Object} playerData - Player data to add
 * @returns {Boolean} Success status
 */
gameSchema.methods.addPlayer = function(playerData) {
  if (this.currentPlayers >= this.maxPlayers) {
    return false;
  }
  
  const playerExists = this.players.some(p => p.playerId === playerData.playerId);
  if (playerExists) {
    return false;
  }
  
  this.players.push(playerData);
  this.currentPlayers += 1;
  
  return true;
};

/**
 * Remove a player from the game
 * @param {Number} playerId - ID of player to remove
 * @returns {Boolean} Success status
 */
gameSchema.methods.removePlayer = function(playerId) {
  const initialLength = this.players.length;
  this.players = this.players.filter(p => p.playerId !== playerId);
  
  if (this.players.length < initialLength) {
    this.currentPlayers -= 1;
    return true;
  }
  
  return false;
};

/**
 * Start the game
 */
gameSchema.methods.startGame = function() {
  if (this.currentPlayers < GAME_CONFIG.MIN_PLAYERS) {
    return false;
  }
  
  this.status = GAME_STATUS.IN_PROGRESS;
  this.startedAt = new Date();
  
  // Set turn order if not already set
  if (this.turnOrder.length === 0) {
    this.turnOrder = this.players.map(p => p.playerId);
  }
  
  // Set first turn
  if (this.turnOrder.length > 0) {
    this.currentTurn.playerId = this.turnOrder[0];
    this.currentTurn.turnNumber = 1;
  }
  
  return true;
};

/**
 * Advance to next turn
 */
gameSchema.methods.nextTurn = function() {
  if (this.turnOrder.length === 0) return false;
  
  const currentIndex = this.turnOrder.indexOf(this.currentTurn.playerId);
  const nextIndex = (currentIndex + 1) % this.turnOrder.length;
  
  this.currentTurn.playerId = this.turnOrder[nextIndex];
  
  // Increment turn number when we complete a full round
  if (nextIndex === 0) {
    this.currentTurn.turnNumber += 1;
  }
  
  return true;
};

/**
 * Check if game is won
 * @param {Number} playerId - Player to check for win
 * @param {Array} playerCells - Array of cell IDs claimed by player
 * @returns {Boolean} True if player has won
 */
gameSchema.methods.checkWinCondition = function(playerId, playerCells) {
  if (!this.centralCells || this.centralCells.length === 0) {
    return false;
  }
  
  const centralCellsOwned = this.centralCells.filter(cellId => 
    playerCells.includes(cellId)
  );
  
  return centralCellsOwned.length >= GAME_CONFIG.CENTRAL_CELLS_REQUIRED;
};

/**
 * Complete the game
 * @param {Number} winnerId - ID of winning player
 */
gameSchema.methods.completeGame = function(winnerId) {
  this.status = GAME_STATUS.COMPLETED;
  this.winner = winnerId;
  this.completedAt = new Date();
  return this.save();
};

const Game = mongoose.model('Game', gameSchema);

export default Game;
