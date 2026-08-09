# @samuel.fabel/plugin-grpc-docs-node

Node library with the gRPC call engine (JSON in/out, reflection helpers, unary). No Backstage dependencies.

```ts
import { GrpcEngine } from '@samuel.fabel/plugin-grpc-docs-node';
```

Local demo server (helloworld.Greeter on `:50051`):

```bash
yarn workspace @samuel.fabel/plugin-grpc-docs-node start:hello
```

See [examples/hello-world-grpc-server/README.md](../../examples/hello-world-grpc-server/README.md).
