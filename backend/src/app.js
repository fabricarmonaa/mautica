import http from 'node:http';
import { loadEnv } from './config/env.js';
import { createRouter } from './interfaces/routers/router.js';
import { createContextMiddleware } from './infrastructure/http/contextMiddleware.js';
import { jsonParser } from './infrastructure/http/jsonParser.js';
import { errorHandler } from './infrastructure/http/errorHandler.js';
import { ensureBootstrapAdmin } from './bootstrap.js';

loadEnv();
const router = createRouter();
const PORT = process.env.PORT || 3000;

async function start() {
  await ensureBootstrapAdmin();

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

  server.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start API', err);
  process.exit(1);
});
