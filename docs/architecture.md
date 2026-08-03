# Architecture

## Design principle

Two layers, coupled differently:

| Layer | Responsibility | Coupling |
| --- | --- | --- |
| **Shell** | Catalog integration, `ApiDefinitionWidget`, React playground, permissions | Fully Backstage |
| **Engine** | JSON ↔ protobuf, reflection, unary (and later streaming) calls | Node library with **no** Backstage imports (`plugin-grpc-docs-node`) |

The shell makes the product feel native. The engine stays testable in isolation and reusable outside Backstage if needed.

## Native Definition tab (not a custom route)

gRPC APIs use the catalog’s existing `spec.type: grpc` (same descriptor format family as `openapi` / `asyncapi`). This plugin registers an [`ApiDefinitionWidget`](https://backstage.io/docs/features/software-catalog/descriptor-format#spectype-required-2) for that type via `@backstage/plugin-api-docs`.

Users open a Component → APIs → a gRPC API → **Definition** and get the playground in the same place Swagger UI appears for OpenAPI. No extra sidebar route.

## Concept mapping (Swagger → grpc-docs)

| Swagger UI | grpc-docs |
| --- | --- |
| `servers` | Annotation `grpc-docs.io/environments` (`name`, `target`, `security`) |
| HTTP headers | gRPC metadata; required headers via `grpc-docs.io/operations` |
| Request JSON body | CodeMirror JSON editor; per-RPC examples in `operations` |
| Endpoint list | Accordion service → method |
| Try it out + schema | Try it out, Schema side-by-side, Beautify / Reset / Execute / Cancel |
| Response examples | Success examples + `errorExamples` (`google.rpc.Status` shape) |

The browser never speaks binary protobuf. JSON in, JSON out — the backend talks real gRPC (HTTP/2) to the target, in the spirit of `grpcurl`.

## Packages

```
plugins/
├── grpc-docs/            # @backstage-community/plugin-grpc-docs           frontend-plugin
├── grpc-docs-backend/    # @backstage-community/plugin-grpc-docs-backend   backend-plugin
├── grpc-docs-common/     # @backstage-community/plugin-grpc-docs-common    common-library
└── grpc-docs-node/       # @backstage-community/plugin-grpc-docs-node      node-library (engine)
```

npm scope: `@backstage-community/*`. `pluginId`: `grpc-docs`.

Home repository: [`samuelfabel/backstage-grpc-docs`](https://github.com/samuelfabel/backstage-grpc-docs). The layout matches a [community-plugins](https://github.com/backstage/community-plugins) workspace so it can move upstream as `workspaces/grpc-docs` later if desired.

## Proto source of truth

The method tree and schemas come from the API entity’s `spec.definition` (parsed in the frontend with protobufjs). There is no separate descriptor store in the backend. See [Catalog entities & annotations](./annotations.md).

## Out of scope (v1)

- **gRPC-web** — the proxy always uses native gRPC over HTTP/2. gRPC-web would only matter if services were fronted for browsers (e.g. Envoy); revisit only if there is concrete demand.
- **Custom CA / mTLS** — `security: ssl` uses system trust roots via `createSsl()`. Extend later if needed.
- **Streaming UI** — planned; see [Roadmap](./roadmap.md).
