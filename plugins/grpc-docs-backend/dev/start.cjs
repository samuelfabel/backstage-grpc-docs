/* eslint-disable no-console */
/**
 * Local playground host — runs compiled dist (no nodeTransform).
 *
 *   yarn workspace @samuel.fabel/plugin-grpc-docs-backend start
 *
 * Rebuild first if sources changed:
 *   yarn workspace @samuel.fabel/plugin-grpc-docs-node build
 *   yarn workspace @samuel.fabel/plugin-grpc-docs-backend build
 */
const Module = require('node:module');
const fs = require('node:fs');
const path = require('node:path');

const aliases = {
  '@samuel.fabel/plugin-grpc-docs-node': path.resolve(
    __dirname,
    '../../grpc-docs-node/dist/index.cjs.js',
  ),
  '@samuel.fabel/plugin-grpc-docs-common': path.resolve(
    __dirname,
    '../../grpc-docs-common/dist/index.cjs.js',
  ),
};

for (const [name, file] of Object.entries(aliases)) {
  if (!fs.existsSync(file)) {
    console.error(
      `[grpc-docs-backend] missing ${file}\n` +
        `Build workspace packages first:\n` +
        `  yarn workspace ${name} build`,
    );
    process.exit(1);
  }
}

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (Object.prototype.hasOwnProperty.call(aliases, request)) {
    return aliases[request];
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

require('./standalone.cjs');
