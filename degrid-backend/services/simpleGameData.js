import { randomInt } from '../utils/helpers.js';

// Simple in-memory game data for the refocused implementation
const GRID_SIZE = 10; // 10x10 grid

// Create 10 hard-coded players with fixed IDs and names
export const players = [];
const defaultColors = ['red','blue','green','orange','purple','cyan','magenta','lime','brown','teal'];
const hardcodedNames = ['Alice','Bob','Carol','Dave','Eve','Frank','Grace','Heidi','Ivan','Judy'];
for (let i=1;i<=10;i++){
  players.push({
    playerId: i,
    name: hardcodedNames[i-1],
    color: defaultColors[(i-1) % defaultColors.length],
    description: '',
    claimedCells: [] // will fill after cells are created
  });
}

// Create grid cells (100 cells)
export const cells = [];
let id = 1;
for (let y=0;y<GRID_SIZE;y++){
  for (let x=0;x<GRID_SIZE;x++){
    cells.push({
      cellId: id,
      x,
      y,
      color: null,
      challengeId: null,
      owner: null,
      // stored claim value (1-100) used for challenge comparisons
      claimValue: null,
      // API-friendly explicit field requested: cell-owner contains playerId of owner
      'cell-owner': null,
      // mark whether this cell is one of the initial starting positions
      isStarting: false,
    });
    id++;
  }
}

// Assign one specific cell to each player according to requested coordinates
// Coordinates: (0,0) (0,2) (0,4) (0,6) (0,8) (9,8) (9,6) (9,4) (9,2) (9,0)
const initialCoords = [
  [0,0], [0,2], [0,4], [0,6], [0,8],
  [9,8], [9,6], [9,4], [9,2], [9,0]
];
for (let i = 0; i < players.length; i++){
  const p = players[i];
  const [x,y] = initialCoords[i];
  const cell = cells.find(c => c.x === x && c.y === y);
  if (cell) {
    cell.owner = p.playerId;
    cell['cell-owner'] = p.playerId;
    cell.color = p.color;
    cell.isStarting = true;
    // set an initial stored claim value for this owner's acquisition
    cell.claimValue = randomInt(1,100);
    p.claimedCells.push(cell.cellId);
  }
}

// Pending challenges map: challengeId -> { playerId, cellId, x,y, createdAt }
export const pendingChallenges = new Map();

// Turn state for simple/mock game
// We'll use players array order as the default turn order
export const turnOrder = players.map(p => p.playerId);
// index into turnOrder indicating whose turn it is
export let currentTurnIndex = 0;

export const getCurrentPlayerId = () => turnOrder[currentTurnIndex];
export const advanceTurn = () => {
  if (turnOrder.length === 0) return null;
  currentTurnIndex = (currentTurnIndex + 1) % turnOrder.length;
  return getCurrentPlayerId();
};

// winner state: null or playerId of the winner
export let winner = null;
export const getWinner = () => winner;
export const setWinner = (playerId) => { winner = playerId ? Number(playerId) : null; return winner };

export const findCellByXY = (x,y) => cells.find(c => c.x === x && c.y === y);
export const findCellById = (cellId) => cells.find(c => c.cellId === parseInt(cellId));
export const findPlayer = (playerId) => players.find(p => p.playerId === parseInt(playerId));

export const createChallenge = (playerId, cell) => {
  const cid = `${Date.now()}-${randomInt(1,100000)}`;
  const entry = { playerId: parseInt(playerId), cellId: cell.cellId, x: cell.x, y: cell.y, createdAt: Date.now() };
  pendingChallenges.set(cid, entry);
  // link challenge id to cell for traceability
  cell.challengeId = cid;
  return cid;
};

export const removeChallenge = (cid) => {
  if (!pendingChallenges.has(cid)) return false;
  const entry = pendingChallenges.get(cid);
  const cell = findCellById(entry.cellId);
  if (cell) cell.challengeId = null;
  pendingChallenges.delete(cid);
  return true;
};

// adjacency: 4-directional (N,S,E,W)
export const isAdjacentToPlayer = (playerId, cell) => {
  const offsets = [[1,0],[-1,0],[0,1],[0,-1]];
  for (const [dx,dy] of offsets){
    const nx = cell.x + dx;
    const ny = cell.y + dy;
    const neighbor = findCellByXY(nx, ny);
    if (neighbor && neighbor.owner === parseInt(playerId)) return true;
  }
  return false;
};

// reset the entire in-memory game to initial state
export const resetGame = () => {
  // clear arrays/maps
  players.length = 0;
  cells.length = 0;
  pendingChallenges.clear();
  // re-create players
  for (let i=1;i<=10;i++){
    players.push({
      playerId: i,
      name: hardcodedNames[i-1],
      color: defaultColors[(i-1) % defaultColors.length],
      description: '',
      claimedCells: []
    });
  }
  // recreate cells
  let nid = 1;
  for (let yy=0; yy<GRID_SIZE; yy++){
    for (let xx=0; xx<GRID_SIZE; xx++){
      cells.push({
        cellId: nid,
        x: xx,
        y: yy,
        color: null,
        challengeId: null,
        owner: null,
        claimValue: null,
        'cell-owner': null,
        isStarting: false,
      });
      nid++;
    }
  }
  // reassign initial coords
  for (let i = 0; i < players.length; i++){
    const p = players[i];
    const [x,y] = initialCoords[i];
    const cell = cells.find(c => c.x === x && c.y === y);
    if (cell) {
      cell.owner = p.playerId;
      cell['cell-owner'] = p.playerId;
      cell.color = p.color;
      cell.isStarting = true;
      // set an initial stored claim value for this owner's acquisition
      cell.claimValue = randomInt(1,100);
      p.claimedCells.push(cell.cellId);
    }
  }
  // reset turn order and index
  turnOrder.length = 0;
  for (const p of players) turnOrder.push(p.playerId);
  currentTurnIndex = 0;
  // clear winner
  winner = null;
  return true;
}

export default {
  players,
  cells,
  pendingChallenges,
  findCellByXY,
  findCellById,
  findPlayer,
  createChallenge,
  removeChallenge,
  isAdjacentToPlayer,
  // turn helpers
  turnOrder,
  currentTurnIndex,
  getCurrentPlayerId,
  advanceTurn,
  // winner helpers
  winner,
  getWinner,
  setWinner,
  // reset helper
  resetGame,
};
