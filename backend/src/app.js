import http from 'node:http';
import { loadEnv } from './config/env.js';
import { createRouter } from './interfaces/routers/router.js';
import { createContextMiddleware } from './infrastructure/http/contextMiddleware.js';
import { jsonParser } from './infrastructure/http/jsonParser.js';
import { errorHandler } from './infrastructure/http/errorHandler.js';

loadEnv();
const router = createRouter();

const server = http.createServer(async (req, res) => {
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', async () => {
    const bodyRaw = Buffer.concat(chunks).toString();
    try {
      const context = createContextMiddleware(req, res, bodyRaw);
      await jsonParser(context);
      await router.handle(context);
    } catch (error) {
      errorHandler(res, error);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
