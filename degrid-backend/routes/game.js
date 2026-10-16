import express from 'express';
import * as controller from '../controllers/gameController.js';
import { requireAdmin, requireSeat } from '../middleware/auth.js';

const router = express.Router();

// Public reads
router.get('/players', controller.listPlayers);
router.get('/players/turn', controller.getTurn);
router.get('/players/:playerId', controller.getPlayer);
router.get('/players/:playerId/description', controller.getDescription);
router.get('/grid', controller.getGrid);
router.get('/cells/:cellId', controller.getCell);

// Claim a seat: returns the token that authorizes acting as this player
router.post('/players/:playerId/join', controller.joinSeat);

// Actions on behalf of a player require that player's seat token
router.put('/players/:playerId', requireSeat, controller.updatePlayer);
router.post('/players/:playerId/description', requireSeat, controller.postDescription);
router.put('/players/:playerId/description', requireSeat, controller.putDescription);
router.delete('/players/:playerId/description', requireSeat, controller.deleteDescription);
router.post('/players/:playerId/request', requireSeat, controller.requestClaim);
router.post('/players/:playerId/challenge', requireSeat, controller.startChallenge);

// Game-wide reset requires ADMIN_TOKEN
router.post('/game/reset', requireAdmin, controller.resetGame);

export default router;
