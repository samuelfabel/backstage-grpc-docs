/**
 * TypeScript reference for the local Express host.
 * Runtime entry is `start.cjs` → `standalone.cjs` (compiled dist, no nodeTransform).
 *
 *   yarn workspace @samuelfabel/plugin-grpc-docs-backend start
 */
import express from 'express';
import type { LoggerService } from '@backstage/backend-plugin-api';
import { createRouter } from '../src/router';

function createDevLogger(): LoggerService {
  const log =
    (level: 'info' | 'warn' | 'error' | 'debug') =>
    (message: string, meta?: object) => {
      // eslint-disable-next-line no-console
      console[level](meta ? `${message} ${JSON.stringify(meta)}` : message);
    };

  const logger: LoggerService = {
    info: log('info'),
    warn: log('warn'),
    error: log('error'),
    debug: log('debug'),
    child() {
      return createDevLogger();
    },
  };
  return logger;
}

const port = Number(process.env.PORT ?? 7007);
const app = express();
const logger = createDevLogger();

// Dev-only CORS — real Backstage backends handle this at the app layer.
app.use((req, res, next) => {
  const origin = req.headers.origin || 'http://localhost:3000';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] ||
      'Content-Type, Authorization',
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  );
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.use('/api/grpc-docs', createRouter({ logger }));

app.listen(port, () => {
  logger.info(`grpc-docs backend listening on http://localhost:${port}`);
  logger.info('health: GET  /api/grpc-docs/health');
  logger.info('call:   POST /api/grpc-docs/call/unary');
});
