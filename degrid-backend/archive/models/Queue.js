import mongoose from 'mongoose';

/**
 * Queue Schema
 * Represents the waiting queue for players to join games
 */
const queueSchema = new mongoose.Schema({
  playerId: {
    type: Number,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    default: 'en',
  },
  preferredMaxPlayers: {
    type: Number,
    default: null,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  notifiedAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['waiting', 'matched', 'expired'],
    default: 'waiting',
  },
}, {
  timestamps: true,
});

// Indexes
// Note: `playerId` is already declared as unique at the field level. Avoid duplicate index declarations.
queueSchema.index({ status: 1, joinedAt: 1 });
queueSchema.index({ joinedAt: 1 });

/**
 * Get waiting time in seconds
 * @returns {Number} Waiting time in seconds
 */
queueSchema.methods.getWaitingTime = function() {
  return Math.floor((Date.now() - this.joinedAt.getTime()) / 1000);
};

/**
 * Mark as matched
 */
queueSchema.methods.markMatched = function() {
  this.status = 'matched';
  return this.save();
};

const Queue = mongoose.model('Queue', queueSchema);

export default Queue;
