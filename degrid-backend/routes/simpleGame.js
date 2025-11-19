import express from 'express';
import controller from '../controllers/simpleGameController.js';

const router = express.Router();

// Players
router.get('/players', controller.listPlayers);
router.get('/players/turn', controller.getTurn);
router.get('/players/:playerId', controller.getPlayer);
router.put('/players/:playerId', controller.updatePlayer);
// Description CRUD for a player
router.get('/players/:playerId/description', controller.getDescription);
router.post('/players/:playerId/description', controller.postDescription);
router.put('/players/:playerId/description', controller.putDescription);
router.delete('/players/:playerId/description', controller.deleteDescription);

// Grid / cells
router.get('/grid', controller.getGrid);
router.get('/cells/:cellId', controller.getCell);

// Claim flow: request challenge, then start challenge
router.post('/players/:playerId/request', controller.requestClaim);
router.post('/players/:playerId/challenge', controller.startChallenge);

// Admin / utility: reset game to initial state
router.post('/game/reset', controller.resetGame);

export default router;
