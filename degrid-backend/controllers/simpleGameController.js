import express from 'express';
import simpleData from '../services/simpleGameData.js';
import { randomInt } from '../utils/helpers.js';

// Controller functions for the simple in-memory game

export const listPlayers = (req, res) => {
  return res.json({ success: true, players: simpleData.players });
};

export const getPlayer = (req, res) => {
  const { playerId } = req.params;
  const player = simpleData.findPlayer(playerId);
  if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
  return res.json({ success: true, player });
};

export const updatePlayer = (req, res) => {
  const { playerId } = req.params;
  const player = simpleData.findPlayer(playerId);
  if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
  const { color, description } = req.body;
  if (color) player.color = color;
  if (description !== undefined) player.description = description;
  // update owned cells color
  for (const cid of player.claimedCells) {
    const c = simpleData.findCellById(cid);
    if (c) c.color = player.color;
  }
  return res.json({ success: true, player });
};

// Description CRUD
export const getDescription = (req, res) => {
  const { playerId } = req.params;
  const player = simpleData.findPlayer(playerId);
  if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
  return res.json({ success: true, description: player.description || '' });
};

export const postDescription = (req, res) => {
  const { playerId } = req.params;
  const { description } = req.body;
  const player = simpleData.findPlayer(playerId);
  if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
  if (!description) return res.status(400).json({ success: false, message: 'Description required' });
  if (player.description) return res.status(409).json({ success: false, message: 'Description already exists; use PUT to update' });
  player.description = description;
  return res.status(201).json({ success: true, description: player.description });
};

export const putDescription = (req, res) => {
  const { playerId } = req.params;
  const { description } = req.body;
  const player = simpleData.findPlayer(playerId);
  if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
  if (description === undefined) return res.status(400).json({ success: false, message: 'Description required' });
  player.description = description;
  return res.json({ success: true, description: player.description });
};

export const deleteDescription = (req, res) => {
  const { playerId } = req.params;
  const player = simpleData.findPlayer(playerId);
  if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
  player.description = '';
  return res.json({ success: true, message: 'Description removed' });
};

export const getGrid = (req, res) => {
  const winner = simpleData.getWinner ? simpleData.getWinner() : simpleData.winner;
  return res.json({ success: true, gridSize: 10, cells: simpleData.cells, winner });
};

export const resetGame = (req, res) => {
  try{
    if (simpleData.resetGame) simpleData.resetGame();
    const winner = simpleData.getWinner ? simpleData.getWinner() : simpleData.winner;
    return res.json({ success: true, message: 'Game reset', winner, cells: simpleData.cells });
  }catch(e){
    return res.status(500).json({ success: false, message: 'Failed to reset game', error: e?.message });
  }
}

export const getCell = (req, res) => {
  const { cellId } = req.params;
  const cell = simpleData.findCellById(cellId);
  if (!cell) return res.status(404).json({ success: false, message: 'Cell not found' });
  return res.json({ success: true, cell });
};

// Step 1: request a challenge for coordinates (checks adjacency and availability)
export const requestClaim = (req, res) => {
  // if a winner exists, the game is over and no further requests are allowed
  const existingWinnerReq = simpleData.getWinner ? simpleData.getWinner() : simpleData.winner;
  if (existingWinnerReq) return res.status(403).json({ success: false, message: `Game over: player ${existingWinnerReq} has already won` });
  const { playerId } = req.params;
  // enforce turn-based play: only allow request if it's the player's turn
  const currentPlayerId = simpleData.getCurrentPlayerId && simpleData.getCurrentPlayerId();
  if (currentPlayerId && parseInt(playerId) !== parseInt(currentPlayerId)) {
    return res.status(403).json({ success: false, message: 'Not your turn' });
  }
  const { x, y } = req.body;
  const player = simpleData.findPlayer(playerId);
  if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
  if (typeof x !== 'number' || typeof y !== 'number') return res.status(400).json({ success: false, message: 'Invalid coordinates' });
  const cell = simpleData.findCellByXY(x,y);
  // debug: log request and cell ownership to help track spurious "You already own this cell" reports
  try {
    console.log(`[requestClaim] player=${playerId} x=${x} y=${y} cellOwner=${cell ? cell.owner : 'none'}`)
    console.log(`[requestClaim] player.claimedCells=`, simpleData.findPlayer(playerId)?.claimedCells || [])
    if (cell) console.log('[requestClaim] cellObj=', JSON.stringify({cellId:cell.cellId, owner:cell.owner, "cell-owner":cell['cell-owner'], challengeId:cell.challengeId, claimValue:cell.claimValue}))
  } catch(e){}
  if (!cell) return res.status(404).json({ success: false, message: 'Cell not found' });
  // normalize owner detection (some code uses `owner`, others `cell-owner`) and compare numerically
  let ownerId = null;
  if (cell) {
    if (cell.owner !== undefined && cell.owner !== null) ownerId = Number(cell.owner);
    else if (cell['cell-owner'] !== undefined && cell['cell-owner'] !== null) ownerId = Number(cell['cell-owner']);
  }
  if (ownerId === Number(playerId)) {
    return res.status(400).json({ success: false, message: 'You already own this cell', cell, player: simpleData.findPlayer(playerId), ownerId });
  }
  // adjacency check: only required if the cell already has an owner
  if (cell.owner) {
    const adjacent = simpleData.isAdjacentToPlayer(playerId, cell);
    if (!adjacent) return res.json({ success: false, message: 'Target cell is not adjacent to any owned cell' });
  }
  // create challenge and return id (frontend will call start-challenge)
  const challengeId = simpleData.createChallenge(playerId, cell);
  return res.json({ success: true, message: 'Challenge created', challengeId, cell: { cellId: cell.cellId, x: cell.x, y: cell.y } });
};

// Step 2: start mock challenge and possibly transfer ownership
export const startChallenge = (req, res) => {
  // if a winner exists, the game is over and no further challenges are allowed
  const existingWinnerStart = simpleData.getWinner ? simpleData.getWinner() : simpleData.winner;
  if (existingWinnerStart) return res.status(403).json({ success: false, message: `Game over: player ${existingWinnerStart} has already won` });
  const { playerId } = req.params;
  const { challengeId } = req.body;
  const player = simpleData.findPlayer(playerId);
  if (!player) return res.status(404).json({ success: false, message: 'Player not found' });
  if (!challengeId) return res.status(400).json({ success: false, message: 'challengeId required' });
  const challenge = simpleData.pendingChallenges.get(challengeId);
  if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found or expired' });
  if (challenge.playerId !== parseInt(playerId)) return res.status(403).json({ success: false, message: 'Challenge does not belong to player' });
  const cell = simpleData.findCellById(challenge.cellId);
  if (!cell) return res.status(404).json({ success: false, message: 'Cell not found' });
  // Challenge semantics per spec:
  // - Generate attempt (1-100).
  // - If the cell has no stored claimValue (first acquisition), the attempt succeeds and we store attempt as claimValue.
  // - Otherwise the attempt succeeds only if attempt <= existing claimValue. On success transfer ownership and replace claimValue with attempt.
  const attempt = randomInt(1,100);
  let success = false;
  if (cell.claimValue === null || cell.claimValue === undefined) {
    // first acquisition
    success = true;
  } else {
    success = attempt <= cell.claimValue;
  }
  if (success) {
    // transfer ownership: remove from previous owner claimedCells
    if (cell.owner) {
      const prev = simpleData.findPlayer(cell.owner);
      if (prev) prev.claimedCells = prev.claimedCells.filter(id => id !== cell.cellId);
    }
    cell.owner = parseInt(playerId);
    cell['cell-owner'] = parseInt(playerId);
    cell.color = player.color;
    player.claimedCells.push(cell.cellId);
    // replace stored claim value with the new attempt
    cell.claimValue = attempt;
    // check for winning condition: first player to acquire any of the center 4 cells
    try {
      const existingWinner = simpleData.getWinner ? simpleData.getWinner() : simpleData.winner;
      const winningSet = new Set(['4,4','5,4','4,5','5,5']);
      const coordKey = `${cell.x},${cell.y}`;
      if (!existingWinner && winningSet.has(coordKey)) {
        if (simpleData.setWinner) simpleData.setWinner(playerId);
      }
    } catch (e) {
      // defensive: ignore if winner helpers missing
    }
  }
  // remove pending challenge
  simpleData.removeChallenge(challengeId);
  // advance turn regardless of success so moves are consumed
  if (simpleData.advanceTurn) simpleData.advanceTurn();
  // return also who is the next player to help the frontend
  const nextPlayer = simpleData.getCurrentPlayerId ? simpleData.getCurrentPlayerId() : null;
  const winner = simpleData.getWinner ? simpleData.getWinner() : simpleData.winner;
  return res.json({ success, attempt, message: success ? 'Claim succeeded' : 'Claim failed', cell: success ? cell : null, nextPlayer, winner });
};

export const getTurn = (req, res) => {
  const current = simpleData.getCurrentPlayerId ? simpleData.getCurrentPlayerId() : null;
  return res.json({ success: true, currentPlayerId: current, turnOrder: simpleData.turnOrder || simpleData.players.map(p => p.playerId) });
};

export default {
  listPlayers, getPlayer, updatePlayer, getGrid, getCell, requestClaim, startChallenge,
  getDescription, postDescription, putDescription, deleteDescription,
  getTurn, resetGame
};
