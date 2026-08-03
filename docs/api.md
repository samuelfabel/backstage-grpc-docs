# HTTP API

Backend plugin id: `grpc-docs`. Discovery base URL is typically  
`{backend.baseUrl}/api/grpc-docs`.

## `GET /health`

Liveness check. Response: `{ "status": "ok" }`.

## `POST /call/unary`

Execute a unary RPC. JSON in / JSON out.

Request body:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `target` | string | yes | `host:port` |
| `service` | string | yes | Fully-qualified service, e.g. `helloworld.Greeter` |
| `method` | string | yes | Method name (`SayHello` or `sayHello`) |
| `payload` | object | yes | Request as proto3 JSON |
| `metadata` | object | no | String metadata map |
| `security` | `insecure` \| `ssl` | no | Channel credentials (default `insecure`) |
| `timeoutMs` | number | no | Deadline (default `30000`) |

Success: `{ "payload": { ... }, "trailingMetadata"?: { ... } }`.

Errors: `4xx`/`5xx` with `{ "error": "<message>" }` (gRPC failures may surface as `502`).

## Descriptor / method tree

**Not** served by the backend. The frontend builds the service/method tree and schemas from the entity `spec.definition` (local proto parse).

## Streaming (planned)

`WS /call/stream` — initial handshake with `{ service, method, target, metadata }`, then JSON messages both ways until the stream closes. See [Roadmap](./roadmap.md).

## Local standalone host

In this workspace, `yarn workspace @backstage-community/plugin-grpc-docs-backend start` runs a minimal Express app (with CORS for the `:3000` dev UI) mounting the same router. A full Backstage backend should register the plugin instead — see [examples/app-wiring.md](../examples/app-wiring.md).
