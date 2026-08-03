/* eslint-disable no-console */
const express = require('express');
const { createRouter } = require('../dist/router.cjs.js');

function createDevLogger() {
  const log = level => (message, meta) => {
    console[level](meta ? `${message} ${JSON.stringify(meta)}` : message);
  };
  const logger = {
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

const port = Number(process.env.PORT || 7007);
const app = express();
const logger = createDevLogger();

// Dev-only: frontend (e.g. :3000) calls this host (:7007) cross-origin.
// A real Backstage backend already applies CORS at the app layer.
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

// Dev-only stub so createDevApp Guest sign-in works without a full auth backend.
// Discovery points auth at backend.baseUrl (:7007) via app-config.yaml.
function guestIdentityResponse() {
  return {
    providerInfo: {},
    profile: {
      email: 'guest@example.com',
      displayName: 'Guest',
    },
    backstageIdentity: {
      // Unsigned placeholder — local playground only; not verified by this host.
      token:
        'eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyOmRlZmF1bHQvZ3Vlc3QiLCJlbnQiOlsidXNlcjpkZWZhdWx0L2d1ZXN0Il19.',
      expiresInSeconds: 60 * 60 * 24,
      identity: {
        type: 'user',
        userEntityRef: 'user:default/guest',
        ownershipEntityRefs: ['user:default/guest'],
      },
    },
  };
}

app.get('/api/auth/guest/refresh', (_req, res) => {
  res.json(guestIdentityResponse());
});
app.get('/api/auth/guest/start', (_req, res) => {
  res.json(guestIdentityResponse());
});
app.post('/api/auth/guest/start', (_req, res) => {
  res.json(guestIdentityResponse());
});

app.listen(port, () => {
  logger.info(`grpc-docs backend listening on http://localhost:${port}`);
  logger.info('health: GET  /api/grpc-docs/health');
  logger.info('call:   POST /api/grpc-docs/call/unary');
  logger.info('guest:  GET  /api/auth/guest/refresh (dev stub)');
});
