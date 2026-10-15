import * as game from '../services/gameState.js';

const MAX_DESCRIPTION_LENGTH = 280;
const COLOR_PATTERN = /^(#[0-9a-fA-F]{6}|[a-zA-Z]{3,20})$/;

const notFound = (res, what) => res.status(404).json({ success: false, message: `${what} not found` });
const badRequest = (res, message) => res.status(400).json({ success: false, message });
const gameOver = (res) => res.status(403).json({ success: false, message: `Game over: player ${game.getWinner()} has already won` });

const validDescription = (d) => typeof d === 'string' && d.length <= MAX_DESCRIPTION_LENGTH;
const descriptionError = `Description must be a string of at most ${MAX_DESCRIPTION_LENGTH} characters`;

// ---- Players ----

export const listPlayers = (req, res) => {
  res.json({ success: true, players: game.players.map(p => ({ ...p, seatTaken: game.isSeatTaken(p.playerId) })) });
};

export const getPlayer = (req, res) => {
  const player = game.findPlayer(req.params.playerId);
  if (!player) return notFound(res, 'Player');
  res.json({ success: true, player });
};

export const joinSeat = (req, res) => {
  const player = game.findPlayer(req.params.playerId);
  if (!player) return notFound(res, 'Player');
  if (game.isSeatTaken(player.playerId)) {
    return res.status(409).json({ success: false, message: 'This seat is already taken' });
  }
  const token = game.joinSeat(player.playerId);
  res.status(201).json({ success: true, playerId: player.playerId, token });
};

export const updatePlayer = (req, res) => {
  const player = game.findPlayer(req.params.playerId);
  if (!player) return notFound(res, 'Player');
  const { color, description } = req.body;
  if (color !== undefined && !(typeof color === 'string' && COLOR_PATTERN.test(color))) {
    return badRequest(res, 'Color must be a CSS color name or #rrggbb');
  }
  if (description !== undefined && !validDescription(description)) return badRequest(res, descriptionError);

  if (color !== undefined) {
    player.color = color;
    for (const cellId of player.claimedCells) {
      const cell = game.findCellById(cellId);
      if (cell) cell.color = color;
    }
  }
  if (description !== undefined) player.description = description;
  res.json({ success: true, player });
};

export const getDescription = (req, res) => {
  const player = game.findPlayer(req.params.playerId);
  if (!player) return notFound(res, 'Player');
  res.json({ success: true, description: player.description });
};

export const postDescription = (req, res) => {
  const player = game.findPlayer(req.params.playerId);
  if (!player) return notFound(res, 'Player');
  const { description } = req.body;
  if (!description || !validDescription(description)) return badRequest(res, descriptionError);
  if (player.description) return res.status(409).json({ success: false, message: 'Description already exists; use PUT to update' });
  player.description = description;
  res.status(201).json({ success: true, description });
};

export const putDescription = (req, res) => {
  const player = game.findPlayer(req.params.playerId);
  if (!player) return notFound(res, 'Player');
  const { description } = req.body;
  if (!validDescription(description)) return badRequest(res, descriptionError);
  player.description = description;
  res.json({ success: true, description });
};

export const deleteDescription = (req, res) => {
  const player = game.findPlayer(req.params.playerId);
  if (!player) return notFound(res, 'Player');
  player.description = '';
  res.json({ success: true, message: 'Description removed' });
};

// ---- Board and turns ----

export const getGrid = (req, res) => {
  res.json({ success: true, gridSize: game.GRID_SIZE, cells: game.cells, winner: game.getWinner() });
};

export const getCell = (req, res) => {
  const cell = game.findCellById(req.params.cellId);
  if (!cell) return notFound(res, 'Cell');
  res.json({ success: true, cell });
};

export const getTurn = (req, res) => {
  res.json({ success: true, currentPlayerId: game.getCurrentPlayerId(), turnOrder: game.getTurnOrder() });
};

const isPlayersTurn = (playerId) => Number(playerId) === game.getCurrentPlayerId();

/** Step 1: ask to claim a cell. Returns a challenge to play this turn. */
export const requestClaim = (req, res) => {
  if (game.getWinner()) return gameOver(res);
  const player = game.findPlayer(req.params.playerId);
  if (!player) return notFound(res, 'Player');
  if (!isPlayersTurn(player.playerId)) return res.status(403).json({ success: false, message: 'Not your turn' });

  const { x, y } = req.body;
  if (!Number.isInteger(x) || !Number.isInteger(y)) return badRequest(res, 'Coordinates must be integers');
  const cell = game.findCellByXY(x, y);
  if (!cell) return notFound(res, 'Cell');
  if (cell.owner === player.playerId) return badRequest(res, 'You already own this cell');
  // Every claim must border the player's territory, owned or not. Previously unowned
  // cells skipped this check, so anyone could take a winning center cell on turn one.
  if (!game.isAdjacentToPlayer(player.playerId, cell)) {
    return badRequest(res, 'Target cell is not adjacent to any cell you own');
  }

  const challengeId = game.createChallenge(player.playerId, cell);
  res.json({ success: true, message: 'Challenge created', challengeId, cell: { cellId: cell.cellId, x: cell.x, y: cell.y } });
};

/** Step 2: roll for the cell. The turn passes whether or not the claim succeeds. */
export const startChallenge = (req, res) => {
  if (game.getWinner()) return gameOver(res);
  const player = game.findPlayer(req.params.playerId);
  if (!player) return notFound(res, 'Player');
  if (!isPlayersTurn(player.playerId)) return res.status(403).json({ success: false, message: 'Not your turn' });

  const { challengeId } = req.body;
  if (typeof challengeId !== 'string') return badRequest(res, 'challengeId required');
  const challenge = game.pendingChallenges.get(challengeId);
  if (!challenge) return notFound(res, 'Challenge');
  if (challenge.playerId !== player.playerId) {
    return res.status(403).json({ success: false, message: 'Challenge does not belong to player' });
  }
  const cell = game.findCellById(challenge.cellId);

  // A free cell is always won; an owned one only by rolling at or below its stored value
  const attempt = game.rollDie();
  const success = cell.claimValue === null || attempt <= cell.claimValue;
  if (success) {
    const previous = cell.owner && game.findPlayer(cell.owner);
    if (previous) previous.claimedCells = previous.claimedCells.filter(id => id !== cell.cellId);
    cell.owner = player.playerId;
    cell.color = player.color;
    cell.claimValue = attempt;
    player.claimedCells.push(cell.cellId);
    if (!game.getWinner() && game.WINNING_CELLS.has(`${cell.x},${cell.y}`)) game.setWinner(player.playerId);
  }

  game.pendingChallenges.delete(challengeId);
  const nextPlayer = game.advanceTurn();
  res.json({
    success,
    attempt,
    message: success ? 'Claim succeeded' : 'Claim failed',
    cell: success ? cell : null,
    nextPlayer,
    winner: game.getWinner(),
  });
};

export const resetGame = (req, res) => {
  game.resetGame();
  res.json({ success: true, message: 'Game reset', winner: null, cells: game.cells });
};
