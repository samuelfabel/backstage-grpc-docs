# Hello World gRPC server

Local `helloworld.Greeter` service used for real unary calls from the
grpc-docs playground and from `@samuel.fabel/plugin-grpc-docs-node`
tests.

## Start

```bash
yarn workspace @samuel.fabel/plugin-grpc-docs-node start:hello
```

Listens on `127.0.0.1:50051` (insecure) with gRPC reflection enabled — same
target as `examples/catalog-info-samples/hello-world-grpc-api.yaml`.

| Env | Default | Meaning |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Bind address |
| `PORT` | `50051` | Bind port |
| `REQUIRE_AUTH` | off | Set to `1` so `SayHello` requires `authorization: Bearer …` |

## RPCs

- `helloworld.Greeter/SayHello` — `{ "name": "world" }` → `{ "message": "Hello, world" }`
  - empty `name` → `INVALID_ARGUMENT`
  - with `REQUIRE_AUTH=1` and missing/invalid bearer → `UNAUTHENTICATED`
- `helloworld.Greeter/SayBye` — `{ "farewell": "friend" }` → `{ "farewell": "Bye, friend" }`

## Playground

1. Terminal A: `yarn workspace @samuel.fabel/plugin-grpc-docs-node start:hello`
2. Terminal B: `yarn workspace @samuel.fabel/plugin-grpc-docs-backend start`
3. Terminal C: `yarn workspace @samuel.fabel/plugin-grpc-docs start`
4. Environment **local** → Execute `SayHello` (add Bearer header if you started with `REQUIRE_AUTH=1`)
