/**
 * In-process / CLI helloworld.Greeter server with gRPC reflection.
 *
 * Used by unit tests (ephemeral port) and local playground:
 *
 *   yarn workspace @samuel.fabel/plugin-grpc-docs-node start:hello
 *
 * Default listen: 127.0.0.1:50051 (override with HOST / PORT).
 */
/* eslint-disable no-console */
/* eslint-disable @backstage/no-undeclared-imports -- @grpc/reflection is test/dev-only */
/* eslint-disable no-restricted-syntax -- standalone CJS helper; not a Backstage backend entry */

const path = require('node:path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { ReflectionService } = require('@grpc/reflection');

const PROTO_PATH = path.join(__dirname, '../fixtures/helloworld.proto');

/**
 * @typedef {object} HelloServerOptions
 * @property {string} [host]
 * @property {number} [port] 0 = ephemeral
 * @property {boolean} [requireAuth] Enforce authorization metadata on SayHello
 */

/**
 * @typedef {object} HelloServer
 * @property {string} target
 * @property {() => Promise<void>} stop
 */

/**
 * @param {HelloServerOptions} [options]
 * @returns {Promise<HelloServer>}
 */
async function startHelloServer(options = {}) {
  const host = options.host ?? '127.0.0.1';
  const port = options.port ?? 0;
  const requireAuth = options.requireAuth ?? false;

  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const proto = grpc.loadPackageDefinition(packageDefinition);
  const server = new grpc.Server();
  const reflection = new ReflectionService(packageDefinition);
  reflection.addToServer(server);

  server.addService(proto.helloworld.Greeter.service, {
    SayHello(call, callback) {
      if (requireAuth) {
        const auth = call.metadata.get('authorization')[0];
        let token = '';
        if (typeof auth === 'string') {
          token = auth;
        } else if (auth !== null && auth !== undefined) {
          token = String(auth);
        }
        if (!/^Bearer\s+\S+/i.test(token.trim())) {
          callback({
            code: grpc.status.UNAUTHENTICATED,
            message: 'missing bearer token',
          });
          return;
        }
      }

      const name = call.request?.name ?? '';
      if (!String(name).trim()) {
        callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'name must not be empty',
        });
        return;
      }

      callback(null, { message: `Hello, ${name}` });
    },

    SayBye(call, callback) {
      const farewell = call.request?.farewell ?? '';
      callback(null, {
        farewell: farewell ? `Bye, ${farewell}` : 'Bye',
      });
    },
  });

  const boundPort = await new Promise((resolve, reject) => {
    server.bindAsync(
      `${host}:${port}`,
      grpc.ServerCredentials.createInsecure(),
      (err, listenPort) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(listenPort);
      },
    );
  });

  return {
    target: `${host}:${boundPort}`,
    stop: () =>
      new Promise((resolve, reject) => {
        server.tryShutdown(shutdownErr => {
          if (shutdownErr) {
            server.forceShutdown();
            reject(shutdownErr);
            return;
          }
          resolve();
        });
      }),
  };
}

async function main() {
  const host = process.env.HOST ?? '127.0.0.1';
  const port = Number(process.env.PORT ?? 50051);
  const requireAuth = process.env.REQUIRE_AUTH === '1';

  const server = await startHelloServer({ host, port, requireAuth });
  console.log(`helloworld.Greeter listening on ${server.target} (insecure)`);
  console.log('reflection: enabled');
  console.log('rpcs: SayHello, SayBye');
  if (requireAuth) {
    console.log('SayHello requires metadata authorization: Bearer <token>');
  }

  const shutdown = async () => {
    console.log('shutting down…');
    await server.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = { startHelloServer, PROTO_PATH };

if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
