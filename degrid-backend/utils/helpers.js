import { PLAYER_COLORS, GAME_CONFIG, CHALLENGE_TYPES } from '../config/constants.js';

/**
 * Generate a random integer between min and max (inclusive)
 * @param {Number} min - Minimum value
 * @param {Number} max - Maximum value
 * @returns {Number} Random integer
 */
export const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Get a random color from the player colors array
 * @param {Array} usedColors - Array of already used colors
 * @returns {String} Random color hex code
 */
export const getRandomColor = (usedColors = []) => {
  const availableColors = PLAYER_COLORS.filter(color => !usedColors.includes(color));
  
  if (availableColors.length === 0) {
    return PLAYER_COLORS[randomInt(0, PLAYER_COLORS.length - 1)];
  }
  
  return availableColors[randomInt(0, availableColors.length - 1)];
};

/**
 * Calculate cell ID from row and column
 * @param {Number} row - Row index
 * @param {Number} column - Column index
 * @param {Number} gridSize - Size of the grid
 * @returns {Number} Cell ID
 */
export const calculateCellId = (row, column, gridSize) => {
  return row * gridSize + column;
};

/**
 * Calculate row and column from cell ID
 * @param {Number} cellId - Cell ID
 * @param {Number} gridSize - Size of the grid
 * @returns {Object} {row, column}
 */
export const calculatePosition = (cellId, gridSize) => {
  const row = Math.floor(cellId / gridSize);
  const column = cellId % gridSize;
  return { row, column };
};

/**
 * Check if a cell is on the perimeter
 * @param {Number} row - Row index
 * @param {Number} column - Column index
 * @param {Number} gridSize - Size of the grid
 * @returns {Boolean} True if on perimeter
 */
export const isPerimeterCell = (row, column, gridSize) => {
  return row === 0 || row === gridSize - 1 || column === 0 || column === gridSize - 1;
};

/**
 * Get central cell IDs for win condition
 * @param {Number} gridSize - Size of the grid
 * @returns {Array} Array of central cell IDs
 */
export const getCentralCells = (gridSize) => {
  const center = Math.floor(gridSize / 2);
  const centralCells = [];
  
  // Get 4 central cells (2x2 in the middle)
  for (let r = center - 1; r <= center; r++) {
    for (let c = center - 1; c <= center; c++) {
      centralCells.push(calculateCellId(r, c, gridSize));
    }
  }
  
  return centralCells;
};

/**
 * Get perimeter cell IDs for starting positions
 * @param {Number} gridSize - Size of the grid
 * @returns {Array} Array of perimeter cell IDs
 */
export const getPerimeterCells = (gridSize) => {
  const perimeter = [];
  
  // Top and bottom rows
  for (let c = 0; c < gridSize; c++) {
    perimeter.push(calculateCellId(0, c, gridSize));
    perimeter.push(calculateCellId(gridSize - 1, c, gridSize));
  }
  
  // Left and right columns (excluding corners already added)
  for (let r = 1; r < gridSize - 1; r++) {
    perimeter.push(calculateCellId(r, 0, gridSize));
    perimeter.push(calculateCellId(r, gridSize - 1, gridSize));
  }
  
  return perimeter;
};

/**
 * Assign starting positions to players
 * @param {Number} playerCount - Number of players
 * @param {Number} gridSize - Size of the grid
 * @returns {Array} Array of starting cell IDs
 */
export const assignStartingPositions = (playerCount, gridSize) => {
  const perimeterCells = getPerimeterCells(gridSize);
  const shuffled = shuffleArray(perimeterCells);
  
  // Ensure minimum distance between players
  const selected = [];
  const minDistance = Math.floor(perimeterCells.length / playerCount);
  
  for (let i = 0; i < playerCount && selected.length < playerCount; i++) {
    const index = i * minDistance;
    if (index < shuffled.length) {
      selected.push(shuffled[index]);
    }
  }
  
  return selected;
};

/**
 * Check if two cells are adjacent
 * @param {Number} cellId1 - First cell ID
 * @param {Number} cellId2 - Second cell ID
 * @param {Number} gridSize - Size of the grid
 * @returns {Boolean} True if adjacent
 */
export const areAdjacent = (cellId1, cellId2, gridSize) => {
  const pos1 = calculatePosition(cellId1, gridSize);
  const pos2 = calculatePosition(cellId2, gridSize);
  
  const rowDiff = Math.abs(pos1.row - pos2.row);
  const colDiff = Math.abs(pos1.column - pos2.column);
  
  // Adjacent if exactly one coordinate differs by 1 (no diagonals)
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
};

/**
 * Format time in milliseconds to readable string
 * @param {Number} ms - Time in milliseconds
 * @returns {String} Formatted time string
 */
export const formatTime = (ms) => {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  return `${seconds}s`;
};

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Sleep/delay function
 * @param {Number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generate a unique ID
 * @returns {Number} Unique timestamp-based ID
 */
export const generateId = () => {
  return Date.now() + randomInt(0, 9999);
};

// ==================== MOCK DATA ====================

/**
 * Mock games data
 */
export const mockGames = [
  {
    gameId: 1,
    language: 'en',
    gridSize: 10,
    maxPlayers: 4,
    currentPlayers: 2,
    players: [
      {
        playerId: 1,
        username: 'Alice',
        language: 'en',
        color: '#FF6B6B',
        claimedCells: [0, 10],
        score: 2,
        status: 'active',
        startingCell: 0,
      },
      {
        playerId: 2,
        username: 'Bob',
        language: 'en',
        color: '#4ECDC4',
        claimedCells: [9, 19],
        score: 2,
        status: 'active',
        startingCell: 9,
      },
    ],
    status: 'in_progress',
    currentTurn: {
      playerId: 1,
      turnNumber: 3,
    },
    turnOrder: [1, 2],
    winner: null,
    rematchVotes: [],
    centralCells: [44, 45, 54, 55],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    gameId: 2,
    language: 'en',
    gridSize: 10,
    maxPlayers: 6,
    currentPlayers: 4,
    players: [
      {
        playerId: 3,
        username: 'Charlie',
        language: 'en',
        color: '#45B7D1',
        claimedCells: [0],
        score: 1,
        status: 'active',
        startingCell: 0,
      },
      {
        playerId: 4,
        username: 'Diana',
        language: 'en',
        color: '#FFA07A',
        claimedCells: [9],
        score: 1,
        status: 'active',
        startingCell: 9,
      },
      {
        playerId: 5,
        username: 'Eve',
        language: 'en',
        color: '#98D8C8',
        claimedCells: [90],
        score: 1,
        status: 'active',
        startingCell: 90,
      },
      {
        playerId: 6,
        username: 'Frank',
        language: 'en',
        color: '#F7DC6F',
        claimedCells: [99],
        score: 1,
        status: 'active',
        startingCell: 99,
      },
    ],
    status: 'in_progress',
    currentTurn: {
      playerId: 3,
      turnNumber: 2,
    },
    turnOrder: [3, 4, 5, 6],
    winner: null,
    rematchVotes: [],
    centralCells: [44, 45, 54, 55],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/**
 * Mock players data
 */
export const mockPlayers = [
  {
    playerId: 1,
    username: 'Alice',
    language: 'en',
    status: 'active',
    color: '#FF6B6B',
    claimedCells: [0, 10],
    score: 2,
    gamesPlayed: 5,
    gamesWon: 2,
    isConnected: true,
    lastActiveAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    playerId: 2,
    username: 'Bob',
    language: 'en',
    status: 'active',
    color: '#4ECDC4',
    claimedCells: [9, 19],
    score: 2,
    gamesPlayed: 3,
    gamesWon: 1,
    isConnected: true,
    lastActiveAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    playerId: 3,
    username: 'Charlie',
    language: 'en',
    status: 'active',
    color: '#45B7D1',
    claimedCells: [0],
    score: 1,
    gamesPlayed: 10,
    gamesWon: 4,
    isConnected: true,
    lastActiveAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    playerId: 4,
    username: 'Diana',
    language: 'en',
    status: 'active',
    color: '#FFA07A',
    claimedCells: [9],
    score: 1,
    gamesPlayed: 7,
    gamesWon: 3,
    isConnected: true,
    lastActiveAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    playerId: 5,
    username: 'Eve',
    language: 'en',
    status: 'active',
    color: '#98D8C8',
    claimedCells: [90],
    score: 1,
    gamesPlayed: 4,
    gamesWon: 1,
    isConnected: true,
    lastActiveAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    playerId: 6,
    username: 'Frank',
    language: 'en',
    status: 'active',
    color: '#F7DC6F',
    claimedCells: [99],
    score: 1,
    gamesPlayed: 2,
    gamesWon: 0,
    isConnected: true,
    lastActiveAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/**
 * Mock challenges data
 */
export const mockChallenges = [
  {
    challengeId: 1,
    type: CHALLENGE_TYPES.MATH,
    question: 'What is 15 + 27?',
    answer: '42',
    options: ['40', '41', '42', '43'],
    difficulty: 2,
    timeLimit: 30,
    points: 10,
    timesUsed: 15,
    successRate: 75,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    challengeId: 2,
    type: CHALLENGE_TYPES.TRIVIA,
    question: 'What is the capital of France?',
    answer: 'Paris',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    difficulty: 1,
    timeLimit: 20,
    points: 5,
    timesUsed: 30,
    successRate: 90,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    challengeId: 3,
    type: CHALLENGE_TYPES.MATH,
    question: 'What is 8 × 7?',
    answer: '56',
    options: ['54', '56', '58', '60'],
    difficulty: 2,
    timeLimit: 25,
    points: 10,
    timesUsed: 20,
    successRate: 80,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    challengeId: 4,
    type: CHALLENGE_TYPES.TRIVIA,
    question: 'How many continents are there?',
    answer: '7',
    options: ['5', '6', '7', '8'],
    difficulty: 1,
    timeLimit: 20,
    points: 5,
    timesUsed: 25,
    successRate: 85,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    challengeId: 5,
    type: CHALLENGE_TYPES.MATH,
    question: 'What is the square root of 144?',
    answer: '12',
    options: ['10', '11', '12', '13'],
    difficulty: 3,
    timeLimit: 30,
    points: 15,
    timesUsed: 18,
    successRate: 70,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    challengeId: 6,
    type: CHALLENGE_TYPES.TRIVIA,
    question: 'Who painted the Mona Lisa?',
    answer: 'Leonardo da Vinci',
    options: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Donatello'],
    difficulty: 2,
    timeLimit: 25,
    points: 10,
    timesUsed: 22,
    successRate: 65,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    challengeId: 7,
    type: CHALLENGE_TYPES.MATH,
    question: 'What is 100 - 37?',
    answer: '63',
    options: ['61', '62', '63', '64'],
    difficulty: 2,
    timeLimit: 25,
    points: 10,
    timesUsed: 16,
    successRate: 78,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    challengeId: 8,
    type: CHALLENGE_TYPES.TRIVIA,
    question: 'What is the largest planet in our solar system?',
    answer: 'Jupiter',
    options: ['Saturn', 'Jupiter', 'Neptune', 'Uranus'],
    difficulty: 2,
    timeLimit: 25,
    points: 10,
    timesUsed: 19,
    successRate: 82,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    challengeId: 9,
    type: CHALLENGE_TYPES.MATH,
    question: 'What is 25% of 80?',
    answer: '20',
    options: ['18', '19', '20', '21'],
    difficulty: 3,
    timeLimit: 30,
    points: 15,
    timesUsed: 14,
    successRate: 68,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    challengeId: 10,
    type: CHALLENGE_TYPES.TRIVIA,
    question: 'In which year did World War II end?',
    answer: '1945',
    options: ['1943', '1944', '1945', '1946'],
    difficulty: 3,
    timeLimit: 30,
    points: 15,
    timesUsed: 17,
    successRate: 72,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/**
 * Mock queue data
 */
export const mockQueue = [
  {
    playerId: 7,
    username: 'Grace',
    language: 'en',
    preferredMaxPlayers: null,
    joinedAt: new Date(Date.now() - 30000),
    status: 'waiting',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    playerId: 8,
    username: 'Henry',
    language: 'en',
    preferredMaxPlayers: 4,
    joinedAt: new Date(Date.now() - 20000),
    status: 'waiting',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

/**
 * Initialize grid cells for a game
 * @param {Number} gameId - Game ID
 * @param {Number} gridSize - Size of the grid
 * @returns {Array} Array of cell objects
 */
export const initializeGridCells = (gameId, gridSize) => {
  const cells = [];
  const centralCells = getCentralCells(gridSize);
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cellId = calculateCellId(row, col, gridSize);
      
      cells.push({
        cellId,
        gameId,
        row,
        column: col,
        owner: null,
        cellColour: '#CCCCCC',
        status: 'unclaimed',
        challengeValue: randomInt(1, 100),
        challengeId: randomInt(1, 10),
        bestTimes: [],
        claimHistory: [],
        isPerimeter: isPerimeterCell(row, col, gridSize),
        isCentral: centralCells.includes(cellId),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
  
  return cells;
};

/**
 * Mock cells for game 1
 */
export const mockCellsGame1 = initializeGridCells(1, 10);

/**
 * Mock cells for game 2
 */
export const mockCellsGame2 = initializeGridCells(2, 10);

// Update some cells to be claimed by players in game 1
mockCellsGame1[0].owner = 1;
mockCellsGame1[0].cellColour = '#FF6B6B';
mockCellsGame1[0].status = 'claimed';

mockCellsGame1[10].owner = 1;
mockCellsGame1[10].cellColour = '#FF6B6B';
mockCellsGame1[10].status = 'claimed';

mockCellsGame1[9].owner = 2;
mockCellsGame1[9].cellColour = '#4ECDC4';
mockCellsGame1[9].status = 'claimed';

mockCellsGame1[19].owner = 2;
mockCellsGame1[19].cellColour = '#4ECDC4';
mockCellsGame1[19].status = 'claimed';

/**
 * Get next game ID
 * @returns {Number} Next available game ID
 */
export const getNextGameId = () => {
  const maxId = Math.max(...mockGames.map(g => g.gameId), 0);
  return maxId + 1;
};

/**
 * Get next player ID
 * @returns {Number} Next available player ID
 */
export const getNextPlayerId = () => {
  const maxId = Math.max(...mockPlayers.map(p => p.playerId), ...mockQueue.map(q => q.playerId), 0);
  return maxId + 1;
};
