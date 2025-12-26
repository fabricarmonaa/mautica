import { randomUUID } from 'crypto';

export const readJson = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) {
    return {};
  }
  return JSON.parse(raw);
};

export const sendJson = (res, statusCode, payload, requestId) => {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'X-Request-Id': requestId
  });
  res.end(body);
};

export const withRequestContext = (handler) => async (req, res) => {
  const requestId = randomUUID();
  req.requestId = requestId;
  try {
    await handler(req, res, requestId);
  } catch (error) {
    sendJson(res, 500, { error: 'internal_error', message: error.message }, requestId);
  }
};
