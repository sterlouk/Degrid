import jwt from 'jsonwebtoken';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';
import { errorResponse } from '../utils/responses.js';

/**
 * Basic authentication middleware
 * Validates JWT tokens for protected routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
    }
    
    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production');
    
    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token', HTTP_STATUS.UNAUTHORIZED);
    }
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired', HTTP_STATUS.UNAUTHORIZED);
    }
    return errorResponse(res, ERROR_MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is present but doesn't require it
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production');
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

/**
 * Generate JWT token for a player
 * @param {Object} player - Player object
 * @returns {String} JWT token
 */
export const generateToken = (player) => {
  const payload = {
    playerId: player.playerId,
    username: player.username,
  };
  
  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production', options);
};
