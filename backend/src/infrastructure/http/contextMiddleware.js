import { verifyToken } from '../security/jwt.js';

export function createContextMiddleware(req, res, rawBody) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const headers = req.headers;
  const method = req.method || 'GET';
  const auth = headers['authorization'];
  const token = auth?.startsWith('Bearer ')
    ? auth.slice('Bearer '.length)
    : undefined;
  const user = token ? verifyToken(token) : null;

  return {
    req,
    res,
    url,
    method,
    headers,
    rawBody,
    body: null,
    user,
    params: {},
    locals: {},
    query: url.searchParams
  };
}
