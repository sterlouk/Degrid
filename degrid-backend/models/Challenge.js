import mongoose from 'mongoose';
import { CHALLENGE_TYPES } from '../config/constants.js';

/**
 * Challenge Schema
 * Represents a challenge that must be completed to claim a cell
 */
const challengeSchema = new mongoose.Schema({
  challengeId: {
    type: Number,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: Object.values(CHALLENGE_TYPES),
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  options: [{
    type: String,
  }],
  difficulty: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
  },
  timeLimit: {
    type: Number, // in seconds
    default: 30,
  },
  points: {
    type: Number,
    default: 10,
  },
  timesUsed: {
    type: Number,
    default: 0,
  },
  successRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
}, {
  timestamps: true,
});

// Indexes
// Note: `challengeId` is already declared as unique at the field level. Avoid duplicate index declarations.
challengeSchema.index({ type: 1 });
challengeSchema.index({ difficulty: 1 });

/**
 * Check if an answer is correct
 * @param {String} providedAnswer - The answer provided by the player
 * @returns {Boolean} True if correct
 */
challengeSchema.methods.checkAnswer = function(providedAnswer) {
  return this.answer.toLowerCase().trim() === providedAnswer.toLowerCase().trim();
};

/**
 * Update challenge statistics
 * @param {Boolean} wasSuccessful - Whether the challenge was completed successfully
 */
challengeSchema.methods.updateStats = function(wasSuccessful) {
  this.timesUsed += 1;
  
  const totalAttempts = this.timesUsed;
  const successCount = Math.round((this.successRate / 100) * (totalAttempts - 1));
  const newSuccessCount = successCount + (wasSuccessful ? 1 : 0);
  
  this.successRate = (newSuccessCount / totalAttempts) * 100;
  
  return this.save();
};

const Challenge = mongoose.model('Challenge', challengeSchema);

export default Challenge;
