# Contributing to grpc-docs

## Requirements

- Node.js 20, 22, or 24
- [Corepack](https://nodejs.org/api/corepack.html) (ships with Node) for Yarn 4

## Setup

```bash
corepack enable
yarn install
yarn fix
yarn build
yarn test
yarn lint
```

## Scripts

| Command | Purpose |
|---|---|
| `yarn fix` | `backstage-cli repo fix --publish` — sync package metadata |
| `yarn build` | Build all packages via Backstage CLI |
| `yarn test` | Jest via `backstage-cli repo test` |
| `yarn lint` | ESLint via Backstage CLI |

## Workspace layout

- `plugins/grpc-docs` — frontend plugin
- `plugins/grpc-docs-backend` — backend plugin
- `plugins/grpc-docs-common` — isomorphic shared code
- `plugins/grpc-docs-node` — gRPC engine (no Backstage imports)

Keep `backstage.pluginId` as `grpc-docs` and keep `pluginPackages` arrays aligned when adding packages (`yarn fix` helps).

## Pull requests

- Prefer small, focused changes
- Add Jest tests for new logic in `common` / `node`
- Update docs under [`docs/`](./docs/) when design or user-facing behavior changes
- Use Changesets (`yarn changeset`) for publishable changes

## Code of conduct

Follow the [Backstage Community Code of Conduct](https://github.com/backstage/backstage/blob/master/CODE_OF_CONDUCT.md).
