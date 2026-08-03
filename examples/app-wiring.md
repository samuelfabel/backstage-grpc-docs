# Wiring grpc-docs into a Backstage app

## Backend (`packages/backend/src/index.ts`)

```ts
backend.add(import('@backstage-community/plugin-grpc-docs-backend'));
```

## Frontend APIs (`packages/app/src/apis.tsx`)

```tsx
import { ApiEntity } from '@backstage/catalog-model';
import {
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
  type AnyApiFactory,
} from '@backstage/core-plugin-api';
import {
  apiDocsConfigRef,
  defaultDefinitionWidgets,
} from '@backstage/plugin-api-docs';
import {
  grpcApiWidget,
  GrpcDocsClient,
  grpcDocsApiRef,
} from '@backstage-community/plugin-grpc-docs';

export const apis: AnyApiFactory[] = [
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
  createApiFactory({
    api: apiDocsConfigRef,
    deps: {},
    factory: () => {
      const definitionWidgets = [...defaultDefinitionWidgets(), grpcApiWidget];
      return {
        getApiDefinitionWidget: (apiEntity: ApiEntity) =>
          definitionWidgets.find(d => d.type === apiEntity.spec.type),
      };
    },
  }),
];
```

API entities with `spec.type: grpc` then render the playground in the Definition tab.

Entity annotations and proto loading: [docs/annotations.md](../docs/annotations.md).  
Optional target ACL (deny by default) in `app-config.yaml` under `grpcDocs.targetAccess`: [docs/security.md](../docs/security.md).
