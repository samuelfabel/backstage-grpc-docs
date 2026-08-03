# grpc-docs

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Backstage plugin that adds a **Swagger-style gRPC playground** to the catalog **API Definition** tab for entities with `spec.type: grpc` — the same integration model OpenAPI uses via `@backstage/plugin-api-docs`.

Structured as a **community-plugins workspace**: Yarn 4, `@backstage/cli`, packages under `@backstage-community/*`.

## Features (v1)

- Native Definition-tab widget (no custom sidebar route)
- Method tree and schemas from the entity `.proto` (`spec.definition`)
- Standard protobuf comments as UI documentation
- Environments (`target` + `insecure`/`ssl`) and per-RPC examples / headers / error examples
- Try it out: JSON editor, Schema, Execute / Cancel
- Backend unary proxy (`POST /api/grpc-docs/call/unary`)

## Packages

| Package | Role | Description |
|---|---|---|
| [`@backstage-community/plugin-grpc-docs`](./plugins/grpc-docs) | `frontend-plugin` | `ApiDefinitionWidget` + playground UI |
| [`@backstage-community/plugin-grpc-docs-backend`](./plugins/grpc-docs-backend) | `backend-plugin` | HTTP proxy to the gRPC engine |
| [`@backstage-community/plugin-grpc-docs-common`](./plugins/grpc-docs-common) | `common-library` | Shared types, annotation helpers |
| [`@backstage-community/plugin-grpc-docs-node`](./plugins/grpc-docs-node) | `node-library` | Backstage-agnostic gRPC engine |

`pluginId`: **`grpc-docs`**

## Documentation

Start at **[docs/README.md](./docs/README.md)** — architecture, annotations, security, HTTP API, and roadmap.

## Install into a Backstage app

See **[examples/app-wiring.md](./examples/app-wiring.md)**.

```bash
yarn --cwd packages/backend add @backstage-community/plugin-grpc-docs-backend
yarn --cwd packages/app add @backstage-community/plugin-grpc-docs
```

Catalog samples: [`examples/catalog-info-samples/`](./examples/catalog-info-samples/).

## Develop in this workspace

```bash
corepack enable
yarn install
yarn fix
yarn build
yarn test
yarn lint
```

### Local playground (three terminals)

```bash
# 1) Demo Greeter on :50051
yarn start:hello-grpc

# 2) Backend API on :7007
yarn workspace @backstage-community/plugin-grpc-docs-backend start

# 3) Frontend widget on :3000
yarn workspace @backstage-community/plugin-grpc-docs start
```

Rebuild the backend packages if you change engine/router sources before step 2. Details: [examples/hello-world-grpc-server/README.md](./examples/hello-world-grpc-server/README.md).

This repo uses Yarn 4 with PnP (faster on Windows). `community-plugins` itself typically uses `nodeLinker: node-modules` — when dropping this workspace in, inherit that repo’s `.yarnrc.yml`.

## community-plugins

This workspace is shaped to drop into [`backstage/community-plugins`](https://github.com/backstage/community-plugins) as `workspaces/grpc-docs`. Package metadata (`backstage.role`, `pluginId`, `pluginPackages`), Changesets, and Apache-2.0 are already in place.

## License

Apache-2.0 — see [LICENSE](./LICENSE).
