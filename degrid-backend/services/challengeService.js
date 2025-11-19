import Challenge from '../models/Challenge.js';
import { mockChallenges, randomInt } from '../utils/helpers.js';
import { ERROR_MESSAGES } from '../config/constants.js';

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
 * Get challenge by ID
 * @param {Number} challengeId - Challenge ID
 * @returns {Promise<Object>} Challenge object
 */
export const getChallengeById = async (challengeId) => {
  if (useMockData) {
    return mockChallenges.find(c => c.challengeId === parseInt(challengeId));
  }
  
  return await Challenge.findOne({ challengeId });
};

/**
 * Get all challenges
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of challenges
 */
export const getAllChallenges = async (filters = {}) => {
  if (useMockData) {
    let challenges = [...mockChallenges];
    
    if (filters.type) {
      challenges = challenges.filter(c => c.type === filters.type);
    }
    
    if (filters.difficulty) {
      challenges = challenges.filter(c => c.difficulty === parseInt(filters.difficulty));
    }
    
    return challenges;
  }
  
  const query = {};
  if (filters.type) query.type = filters.type;
  if (filters.difficulty) query.difficulty = filters.difficulty;
  
  return await Challenge.find(query);
};

/**
 * Get a random challenge
 * @param {Object} filters - Filter options (type, difficulty)
 * @returns {Promise<Object>} Random challenge
 */
export const getRandomChallenge = async (filters = {}) => {
  const challenges = await getAllChallenges(filters);
  
  if (challenges.length === 0) {
    throw new Error(ERROR_MESSAGES.CHALLENGE_NOT_FOUND);
  }
  
  const randomIndex = randomInt(0, challenges.length - 1);
  return challenges[randomIndex];
};

/**
 * Check if answer is correct
 * @param {Number} challengeId - Challenge ID
 * @param {String} answer - Player's answer
 * @returns {Promise<Object>} Result object with isCorrect boolean
 */
export const checkAnswer = async (challengeId, answer) => {
  const challenge = await getChallengeById(challengeId);
  
  if (!challenge) {
    throw new Error(ERROR_MESSAGES.CHALLENGE_NOT_FOUND);
  }
  
  const isCorrect = challenge.answer.toLowerCase().trim() === answer.toLowerCase().trim();
  
  // Update statistics (in mock mode, just modify the object)
  if (useMockData) {
    challenge.timesUsed += 1;
    const totalAttempts = challenge.timesUsed;
    const successCount = Math.round((challenge.successRate / 100) * (totalAttempts - 1));
    const newSuccessCount = successCount + (isCorrect ? 1 : 0);
    challenge.successRate = (newSuccessCount / totalAttempts) * 100;
  } else {
    await challenge.updateStats(isCorrect);
  }
  
  return {
    isCorrect,
    correctAnswer: isCorrect ? challenge.answer : null,
    points: isCorrect ? challenge.points : 0,
  };
};

/**
 * Create a new challenge (database only)
 * @param {Object} challengeData - Challenge data
 * @returns {Promise<Object>} Created challenge
 */
export const createChallenge = async (challengeData) => {
  if (useMockData) {
    const newChallenge = {
      challengeId: mockChallenges.length + 1,
      ...challengeData,
      timesUsed: 0,
      successRate: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    mockChallenges.push(newChallenge);
    return newChallenge;
  }
  
  const challenge = new Challenge({
    challengeId: Date.now(),
    ...challengeData,
  });
  
  return await challenge.save();
};

export default {
  setDataSource,
  getChallengeById,
  getAllChallenges,
  getRandomChallenge,
  checkAnswer,
  createChallenge,
};
