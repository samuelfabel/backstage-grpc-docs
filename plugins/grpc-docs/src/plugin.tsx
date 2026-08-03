import {
  createApiFactory,
  createPlugin,
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import type { ApiDefinitionWidget } from '@backstage/plugin-api-docs';
import { GrpcDocsClient, grpcDocsApiRef } from './api/GrpcDocsApi';
import { GrpcDocsWidget } from './components/GrpcDocsWidget';

/**
 * Frontend plugin. Registers the API client used by the gRPC widget.
 */
export const grpcDocsPlugin = createPlugin({
  id: 'grpc-docs',
  apis: [
    createApiFactory({
      api: grpcDocsApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        identityApi: identityApiRef,
      },
      factory: ({ discoveryApi, fetchApi, identityApi }) =>
        new GrpcDocsClient({ discoveryApi, fetchApi, identityApi }),
    }),
  ],
});

/**
 * Widget for `apiDocsConfigRef` — type `grpc`.
 *
 * ```tsx
 * import {
 *   apiDocsConfigRef,
 *   defaultDefinitionWidgets,
 * } from '@backstage/plugin-api-docs';
 * import { grpcApiWidget } from '@backstage-community/plugin-grpc-docs';
 *
 * const widgets = [...defaultDefinitionWidgets(), grpcApiWidget];
 * ```
 */
export const grpcApiWidget: ApiDefinitionWidget = {
  type: 'grpc',
  title: 'gRPC',
  rawLanguage: 'protobuf',
  component: definition => <GrpcDocsWidget definition={definition} />,
};
