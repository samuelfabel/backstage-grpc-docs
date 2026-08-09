import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';

/**
 * grpc-docs backend plugin.
 *
 * Register in your Backstage backend:
 *
 * ```ts
 * backend.add(import('@samuel.fabel/plugin-grpc-docs-backend'));
 * ```
 */
export const grpcDocsPlugin = createBackendPlugin({
  pluginId: 'grpc-docs',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
      },
      async init({ logger, httpRouter }) {
        httpRouter.use(
          createRouter({
            logger: logger.child({ plugin: 'grpc-docs' }),
          }),
        );
        // Local / early playground: allow unauthenticated. Tighten with
        // grpcDocs.targetAccess (+ default auth) in a later phase.
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
        httpRouter.addAuthPolicy({
          path: '/call',
          allow: 'unauthenticated',
        });

      },
    });
  },
});
