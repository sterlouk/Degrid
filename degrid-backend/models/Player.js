import mongoose from 'mongoose';
import { PLAYER_STATUS, LANGUAGES } from '../config/constants.js';

/**
 * Player Schema
 * Represents a player in the Degrid game
 */
const playerSchema = new mongoose.Schema({
  playerId: {
    type: Number,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  language: {
    type: String,
    enum: Object.values(LANGUAGES),
    default: LANGUAGES.EN,
  },
  status: {
    type: String,
    enum: Object.values(PLAYER_STATUS),
    default: PLAYER_STATUS.ACTIVE,
  },
  color: {
    type: String,
    required: true,
  },
  claimedCells: [{
    type: Number,
  }],
  score: {
    type: Number,
    default: 0,
  },
  gamesPlayed: {
    type: Number,
    default: 0,
  },
  gamesWon: {
    type: Number,
    default: 0,
  },
  isConnected: {
    type: Boolean,
    default: true,
  },
  lastActiveAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
// Note: `playerId` is already declared as unique at the field level. Avoid duplicate index declarations.
playerSchema.index({ username: 1 });
playerSchema.index({ status: 1 });

/**
 * Update player's last active timestamp
 */
playerSchema.methods.updateActivity = function() {
  this.lastActiveAt = new Date();
  return this.save();
};

/**
 * Mark player as inactive
 */
playerSchema.methods.markInactive = function() {
  this.status = PLAYER_STATUS.INACTIVE;
  this.isConnected = false;
  return this.save();
};

const Player = mongoose.model('Player', playerSchema);

export default Player;
