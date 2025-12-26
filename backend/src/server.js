import http from 'http';
import { env } from './config/env.js';
import { buildRouter } from './routes/index.js';
import { sendJson, withRequestContext } from './http/http-utils.js';

const router = buildRouter();

const server = http.createServer(
  withRequestContext(async (req, res, requestId) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const match = router.match(req.method, url.pathname);
    if (!match) {
      return sendJson(res, 404, { error: 'not_found' }, requestId);
    }
    req.params = match.params;
    return match.route.handler(req, res, requestId);
  })
);

server.listen(env.port, () => {
  console.log(`API listening on ${env.port}`);
});
