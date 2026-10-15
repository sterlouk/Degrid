import { createHash, randomBytes, randomInt as cryptoRandomInt, timingSafeEqual } from 'node:crypto';

// In-memory state for a single Degrid game.

export const GRID_SIZE = 10;
export const WINNING_CELLS = new Set(['4,4', '5,4', '4,5', '5,5']);

const DEFAULT_COLORS = ['red', 'blue', 'green', 'orange', 'purple', 'cyan', 'magenta', 'lime', 'brown', 'teal'];
const NAMES = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy'];
// Starting cells on the left and right edges, two apart
const START_COORDS = [
  [0, 0], [0, 2], [0, 4], [0, 6], [0, 8],
  [9, 8], [9, 6], [9, 4], [9, 2], [9, 0],
];

export const players = [];
export const cells = [];
export const pendingChallenges = new Map(); // challengeId -> { playerId, cellId }
const seatTokenHashes = new Map(); // playerId -> sha256(token)
let currentPlayerId = 1;
let winner = null;

/**
 * Dice rolls use the CSPRNG: Math.random() is predictable once enough of its
 * outputs are observed, and every roll is returned to clients.
 */
export const rollDie = () => cryptoRandomInt(1, 101);

export const resetGame = () => {
  players.length = 0;
  cells.length = 0;
  pendingChallenges.clear();
  seatTokenHashes.clear();
  currentPlayerId = 1;
  winner = null;

  NAMES.forEach((name, i) => {
    players.push({ playerId: i + 1, name, color: DEFAULT_COLORS[i], description: '', claimedCells: [] });
  });

  let cellId = 1;
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      cells.push({ cellId: cellId++, x, y, color: null, owner: null, claimValue: null, isStarting: false });
    }
  }

  players.forEach((p, i) => {
    const [x, y] = START_COORDS[i];
    const cell = findCellByXY(x, y);
    cell.owner = p.playerId;
    cell.color = p.color;
    cell.isStarting = true;
    cell.claimValue = rollDie();
    p.claimedCells.push(cell.cellId);
  });
};

export const findCellByXY = (x, y) => cells.find(c => c.x === x && c.y === y);
export const findCellById = (cellId) => cells.find(c => c.cellId === Number(cellId));
export const findPlayer = (playerId) => players.find(p => p.playerId === Number(playerId));

/** Only joined seats take turns, so a game with fewer than 10 players doesn't stall on empty seats. */
export const getTurnOrder = () => {
  const seated = players.filter(p => seatTokenHashes.has(p.playerId)).map(p => p.playerId);
  return seated.length > 0 ? seated : players.map(p => p.playerId);
};

/** The player whose turn it is: the current id, or the next one in turn order if that seat is empty. */
export const getCurrentPlayerId = () => {
  const order = getTurnOrder();
  if (order.includes(currentPlayerId)) return currentPlayerId;
  return order.find(id => id > currentPlayerId) ?? order[0];
};

export const advanceTurn = () => {
  const order = getTurnOrder();
  const index = order.indexOf(getCurrentPlayerId());
  currentPlayerId = order[(index + 1) % order.length];
  // A challenge requested on one turn must not be playable on a later one
  pendingChallenges.clear();
  return currentPlayerId;
};

export const getWinner = () => winner;
export const setWinner = (playerId) => { winner = Number(playerId); };

/** 4-directional adjacency to any cell the player owns. */
export const isAdjacentToPlayer = (playerId, cell) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => findCellByXY(cell.x + dx, cell.y + dy)?.owner === Number(playerId));

export const createChallenge = (playerId, cell) => {
  const challengeId = randomBytes(16).toString('hex');
  pendingChallenges.set(challengeId, { playerId: Number(playerId), cellId: cell.cellId });
  return challengeId;
};

// ---- Seats: which client controls which player ----

const sha256 = (value) => createHash('sha256').update(value).digest();

export const isSeatTaken = (playerId) => seatTokenHashes.has(Number(playerId));

/** Claims a free seat and returns its bearer token (only the hash is stored). */
export const joinSeat = (playerId) => {
  const token = randomBytes(32).toString('base64url');
  seatTokenHashes.set(Number(playerId), sha256(token));
  return token;
};

export const verifySeatToken = (playerId, token) => {
  const expected = seatTokenHashes.get(Number(playerId));
  if (!expected || typeof token !== 'string') return false;
  return timingSafeEqual(expected, sha256(token));
};

resetGame();
