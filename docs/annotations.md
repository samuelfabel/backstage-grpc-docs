# Catalog entities & annotations

## API entity

Use `spec.type: grpc`. The `.proto` lives in `spec.definition` — the catalog already supports the same patterns as OpenAPI:

1. **Inline text** — `definition: |` with the proto body  
   Sample: [`examples/catalog-info-samples/hello-world-grpc-api.yaml`](../examples/catalog-info-samples/hello-world-grpc-api.yaml)
2. **`$text` reference** — file or URL  
   Sample: [`hello-world-grpc-api-from-file.yaml`](../examples/catalog-info-samples/hello-world-grpc-api-from-file.yaml) → [`protos/helloworld.proto`](../examples/catalog-info-samples/protos/helloworld.proto)

Optional catalog [`links`](https://backstage.io/docs/features/software-catalog/descriptor-format#links-optional) can point humans at the proto repo; they are not resolved by the plugin.

## Proto comments (documentation)

Documentation uses **standard Protocol Buffers comments** only — leading or trailing `//` or `/* */` on services, RPCs, messages, and fields ([SourceCodeInfo](https://protobuf.dev/reference/java/api-docs/com/google/protobuf/DescriptorProtos.SourceCodeInfo.Location.html) model). No plugin-specific doc syntax.

The UI shows those comments on method rows and in Schema views (parsed with protobufjs `alternateCommentMode`).

```protobuf
// Greeter offers simple hello/goodbye RPCs for demos.
service Greeter {
  // Say hello to the world
  rpc SayHello (HelloRequest) returns (HelloReply);
}

message HelloRequest {
  // The name to greet.
  string name = 1;
}
```

## `grpc-docs.io/environments`

YAML list of environments for the playground selector (there is no gRPC equivalent of OpenAPI `servers` inside the proto itself).

| Field | Required | Description |
| --- | --- | --- |
| `name` | yes | Label in the environment selector |
| `target` | yes | `host:port` of the gRPC service |
| `security` | no | `insecure` \| `ssl` (default `insecure`). Channel is fixed by the environment — no security toggle in the UI |

```yaml
metadata:
  annotations:
    grpc-docs.io/environments: |
      - name: local
        target: 127.0.0.1:50051
        security: insecure
      - name: staging
        target: grpc-staging.internal:443
        security: ssl
```

- `insecure` — plaintext channel  
- `ssl` — TLS with the **system** trust store (`grpc.credentials.createSsl()`)

Who may call which target is **not** granted by this annotation — see [Security](./security.md).

## `grpc-docs.io/operations`

Per-RPC docs and Try-it defaults, keyed like OpenAPI paths (`service/method`).

| Field | Required | Description |
| --- | --- | --- |
| `rpc` | yes | e.g. `helloworld.Greeter/SayHello` |
| `headers` | no | Metadata specs: `name`, `required`, `type`, `default`, `enum` |
| `examples` | no | `name`, `summary`, `value` (request JSON), optional `response` |
| `errorExamples` | no | Documented errors: `code` (name or number), `summary`, `value` as [`google.rpc.Status`](https://cloud.google.com/apis/design/errors) |

```yaml
metadata:
  annotations:
    grpc-docs.io/operations: |
      - rpc: helloworld.Greeter/SayHello
        headers:
          - name: authorization
            required: true
            type: string
            default: "Bearer "
        examples:
          - name: basic
            summary: Default hello
            value:
              name: world
            response:
              message: Hello world
        errorExamples:
          - name: invalid-argument
            code: INVALID_ARGUMENT
            summary: name is required
            value:
              code: 3
              message: "INVALID_ARGUMENT: name must not be empty"
              details: []
```

Constants and parsers live in `@samuelfabel/plugin-grpc-docs-common` (`GRPC_DOCS_ENVIRONMENTS_ANNOTATION`, `GRPC_DOCS_OPERATIONS_ANNOTATION`, `parseEnvironments`, `parseOperations`).
