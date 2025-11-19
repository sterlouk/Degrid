/**
 * Application constants and configuration
 */

export const GAME_CONFIG = {
  MIN_PLAYERS: parseInt(process.env.MIN_PLAYERS) || 4,
  MAX_PLAYERS: parseInt(process.env.MAX_PLAYERS) || 36,
  GRID_SIZE: parseInt(process.env.GRID_SIZE) || 10,
  TURN_TIMEOUT_MS: parseInt(process.env.TURN_TIMEOUT_MS) || 60000,
  CHALLENGE_TIMEOUT_MS: parseInt(process.env.CHALLENGE_TIMEOUT_MS) || 30000,
  CENTRAL_CELLS_REQUIRED: 4, // Number of central cells needed to win
};

export const GAME_STATUS = {
  WAITING: 'waiting',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const CELL_STATUS = {
  UNCLAIMED: 'unclaimed',
  CLAIMED: 'claimed',
  CONTESTED: 'contested',
};

export const PLAYER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  FORFEITED: 'forfeited',
};

export const CHALLENGE_TYPES = {
  MATH: 'math',
  TRIVIA: 'trivia',
  MEMORY: 'memory',
  REACTION: 'reaction',
};

export const LANGUAGES = {
  EN: 'en',
  EL: 'el',
  ES: 'es',
  FR: 'fr',
  DE: 'de',
};

export const PLAYER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  '#F8B195', '#C06C84', '#6C5B7B', '#355C7D',
  '#2ECC71', '#E74C3C', '#3498DB', '#F39C12',
  '#9B59B6', '#1ABC9C', '#E67E22', '#34495E',
  '#16A085', '#27AE60', '#2980B9', '#8E44AD',
  '#2C3E50', '#F1C40F', '#E74C3C', '#ECF0F1',
  '#95A5A6', '#D35400', '#C0392B', '#BDC3C7',
  '#7F8C8D', '#D98880', '#C39BD3', '#7FB3D5',
];

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

export const ERROR_MESSAGES = {
  GAME_NOT_FOUND: 'Game not found',
  PLAYER_NOT_FOUND: 'Player not found',
  CELL_NOT_FOUND: 'Cell not found',
  CHALLENGE_NOT_FOUND: 'Challenge not found',
  INVALID_COORDINATES: 'Invalid cell coordinates',
  CELL_NOT_ADJACENT: 'Cell is not adjacent to your claimed cells',
  NOT_YOUR_TURN: 'It is not your turn',
  GAME_FULL: 'Game is full',
  GAME_ALREADY_STARTED: 'Game has already started',
  INVALID_PLAYER_COUNT: 'Invalid number of players',
  PLAYER_ALREADY_IN_GAME: 'Player is already in this game',
  CHALLENGE_TIMEOUT: 'Challenge timed out',
  INVALID_INPUT: 'Invalid input provided',
  DATABASE_ERROR: 'Database operation failed',
  UNAUTHORIZED: 'Unauthorized access',
};

export const SUCCESS_MESSAGES = {
  GAME_CREATED: 'Game created successfully',
  PLAYER_JOINED: 'Player joined successfully',
  PLAYER_REMOVED: 'Player removed successfully',
  CELL_CLAIMED: 'Cell claimed successfully',
  CHALLENGE_COMPLETED: 'Challenge completed successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  TURN_UPDATED: 'Turn updated successfully',
  VOTE_RECORDED: 'Rematch vote recorded',
};
