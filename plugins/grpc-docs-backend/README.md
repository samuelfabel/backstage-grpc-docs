# @samuelfabel/plugin-grpc-docs-backend

Backend plugin (`pluginId: grpc-docs`).

## Install into a Backstage app

```bash
yarn --cwd packages/backend add @samuelfabel/plugin-grpc-docs-backend
```

```ts
backend.add(import('@samuelfabel/plugin-grpc-docs-backend'));
```

See [examples/app-wiring.md](../../examples/app-wiring.md).

## Local playground (this workspace)

```bash
yarn workspace @samuelfabel/plugin-grpc-docs-backend start
```

Runs a minimal Express host on `http://localhost:7007` mounting the real
router at `/api/grpc-docs` (same paths the frontend discovers). Uses compiled
`dist/` (not `nodeTransform`) so it works reliably under Yarn PnP on Windows.

If sources changed, rebuild first:

```bash
yarn workspace @samuelfabel/plugin-grpc-docs-node build
yarn workspace @samuelfabel/plugin-grpc-docs-backend build
```

In a real Backstage app use the plugin registration above, not this host.

HTTP contract: [docs/api.md](../../docs/api.md).
