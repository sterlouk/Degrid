import { createHash, timingSafeEqual } from 'node:crypto';
import { verifySeatToken } from '../services/gameState.js';

const bearerToken = (req) => {
  const header = req.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

/** Only the client holding this seat's token may act as `:playerId`. */
export const requireSeat = (req, res, next) => {
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ success: false, message: 'Join this seat first' });
  if (!verifySeatToken(req.params.playerId, token)) {
    return res.status(403).json({ success: false, message: 'You do not control this player' });
  }
  next();
};

const digest = (value) => createHash('sha256').update(value).digest();

/**
 * Game-wide admin actions require ADMIN_TOKEN. Without one configured they are
 * disabled, so a forgotten env var fails closed instead of open.
 */
export const requireAdmin = (req, res, next) => {
  const configured = process.env.ADMIN_TOKEN;
  if (!configured) return res.status(403).json({ success: false, message: 'Admin actions are disabled (ADMIN_TOKEN not set)' });
  const token = bearerToken(req);
  if (!token || !timingSafeEqual(digest(token), digest(configured))) {
    return res.status(403).json({ success: false, message: 'Admin token required' });
  }
  next();
};
