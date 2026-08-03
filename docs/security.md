# Security

## Channel security (`insecure` / `ssl`)

Configured **per environment** on the API entity (`grpc-docs.io/environments`), not in the UI and not as a global toggle. See [Annotations](./annotations.md).

| Value | Behavior |
| --- | --- |
| `insecure` (default) | `createInsecure()` |
| `ssl` | `createSsl()` — TLS using OS / Node trust roots |

Custom CA files, mTLS client certificates, and “skip verify” are out of scope for the initial release.

## Target access (platform config)

gRPC playgrounds often reach real internal services. Authorization must **not** live on the API entity: anyone who can edit `catalog-info.yaml` could grant themselves access.

**Deny by default** on the call `target`. Rules belong in Backstage config (`app-config.yaml`), owned by platform operators:

```yaml
grpcDocs:
  targetAccess:
    - match:
        type: wildcard
        value: '*.dev.internal'
      allow:
        - group:default/engineering
    - match:
        type: dns
        value: grpc-staging.internal
      allow:
        - group:default/payments-team
    - match:
        type: regex
        value: '^grpc(-[a-z]+)?\.prod\.internal:443$'
      allow:
        - group:default/payments-oncall
        - group:default/platform-admins
    - match:
        type: ip
        value: '10.0.4.20'
      allow:
        - user:default/alice
    - match:
        type: cidr
        value: '10.8.0.0/16'
      allow:
        - group:default/platform-admins
```

| `match.type` | Matches | Example `value` |
| --- | --- | --- |
| `wildcard` | Hostname with `*` / `?` | `*.dev.internal` |
| `dns` | Exact hostname (case-insensitive) | `grpc.internal` |
| `regex` | Regex on `host` or `host:port` | `^grpc-.*\.internal:443$` |
| `ip` | Literal IPv4/IPv6 | `10.0.4.20` |
| `cidr` | IPv4/IPv6 network | `10.8.0.0/16` |

Intended backend gate (on `/call/unary` and future stream endpoints):

1. Read `target` from the request (never trust the UI alone).
2. Evaluate `grpcDocs.targetAccess` in order; first matching rule wins.
3. No match, or identity not in `allow` → **403**.
4. Only then invoke the engine.

The schema is declared in [`plugins/grpc-docs-backend/config.d.ts`](../plugins/grpc-docs-backend/config.d.ts). **Runtime enforcement is planned** (see [Roadmap](./roadmap.md)); until then, treat playground targets as trusted lab / ACL’d network only.

The frontend may filter the environment selector for UX; the hard guarantee is the backend gate. The Node engine has no notion of identity.
