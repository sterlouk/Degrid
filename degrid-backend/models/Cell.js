import mongoose from 'mongoose';
import { CELL_STATUS } from '../config/constants.js';

/**
 * Cell Schema
 * Represents a single cell in the game grid
 */
const cellSchema = new mongoose.Schema({
  cellId: {
    type: Number,
    required: true,
  },
  gameId: {
    type: Number,
    required: true,
  },
  row: {
    type: Number,
    required: true,
    min: 0,
  },
  column: {
    type: Number,
    required: true,
    min: 0,
  },
  owner: {
    type: Number,
    default: null, // null means unclaimed
  },
  cellColour: {
    type: String,
    default: '#CCCCCC', // Default gray for unclaimed cells
  },
  status: {
    type: String,
    enum: Object.values(CELL_STATUS),
    default: CELL_STATUS.UNCLAIMED,
  },
  challengeValue: {
    type: Number,
    min: 1,
    max: 100,
    required: true,
  },
  challengeId: {
    type: Number,
  },
  bestTimes: [{
    playerId: Number,
    time: Number, // Time in milliseconds
    completedAt: Date,
  }],
  claimHistory: [{
    playerId: Number,
    claimedAt: Date,
    lostAt: Date,
  }],
  isPerimeter: {
    type: Boolean,
    default: false,
  },
  isCentral: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Compound index for game and cell lookup
cellSchema.index({ gameId: 1, cellId: 1 }, { unique: true });
cellSchema.index({ gameId: 1, row: 1, column: 1 });
cellSchema.index({ owner: 1 });

/**
 * Claim a cell for a player
 * @param {Number} playerId - The player claiming the cell
 * @param {Number} completionTime - Time taken to complete challenge
 * @param {String} color - Player's color
 */
cellSchema.methods.claimCell = function(playerId, completionTime, color) {
  this.owner = playerId;
  this.cellColour = color;
  this.status = CELL_STATUS.CLAIMED;
  
  // Update best times
  const existingTimeIndex = this.bestTimes.findIndex(bt => bt.playerId === playerId);
  if (existingTimeIndex >= 0) {
    if (completionTime < this.bestTimes[existingTimeIndex].time) {
      this.bestTimes[existingTimeIndex].time = completionTime;
      this.bestTimes[existingTimeIndex].completedAt = new Date();
    }
  } else {
    this.bestTimes.push({
      playerId,
      time: completionTime,
      completedAt: new Date(),
    });
  }
  
  // Sort best times
  this.bestTimes.sort((a, b) => a.time - b.time);
  
  // Add to claim history
  this.claimHistory.push({
    playerId,
    claimedAt: new Date(),
  });
  
  return this.save();
};

/**
 * Get adjacent cell positions
 * @param {Number} gridSize - Size of the grid
 * @returns {Array} Array of adjacent positions [{row, column}]
 */
cellSchema.methods.getAdjacentPositions = function(gridSize) {
  const adjacent = [];
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1], // Up, Down, Left, Right
  ];
  
  for (const [dr, dc] of directions) {
    const newRow = this.row + dr;
    const newCol = this.column + dc;
    
    if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
      adjacent.push({ row: newRow, column: newCol });
    }
  }
  
  return adjacent;
};

const Cell = mongoose.model('Cell', cellSchema);

export default Cell;
