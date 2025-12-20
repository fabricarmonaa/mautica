import { verifyToken } from '../utils/auth.js';
import { sendJson } from './http-utils.js';

const rateState = new Map();

export const rateLimit = ({ windowMs = 60000, max = 120 }) => (handler) => async (req, res, requestId) => {
  const key = `${req.socket.remoteAddress}:${req.headers['x-tenant-id'] || 'public'}`;
  const now = Date.now();
  const entry = rateState.get(key) || { count: 0, start: now };
  if (now - entry.start > windowMs) {
    entry.count = 0;
    entry.start = now;
  }
  entry.count += 1;
  rateState.set(key, entry);
  if (entry.count > max) {
    return sendJson(res, 429, { error: 'rate_limited' }, requestId);
  }
  return handler(req, res, requestId);
};

export const requireAuth = (allowedRoles = []) => (handler) => async (req, res, requestId) => {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');
  if (!token) {
    return sendJson(res, 401, { error: 'missing_token' }, requestId);
  }
  try {
    const payload = verifyToken(token);
    if (allowedRoles.length && !allowedRoles.includes(payload.role)) {
      return sendJson(res, 403, { error: 'forbidden' }, requestId);
    }
    req.auth = payload;
    return handler(req, res, requestId);
  } catch (error) {
    return sendJson(res, 401, { error: 'invalid_token' }, requestId);
  }
};
