# Roadmap

## Shipped (initial playground)

1. Unary engine with reflection support (for tests / tooling) and JSON I/O  
2. Frontend widget for `spec.type: grpc` (method tree from entity proto)  
3. Environments + operations annotations, metadata editor, Try it out UI  
4. Proto comment documentation in the UI  
5. Local hello gRPC server for end-to-end calls  

## Next

4. Server-streaming (WebSocket bridge, live message log)  
5. Client-streaming / bidirectional streaming  
6. Enforce `grpcDocs.targetAccess` on the backend + filter the environment selector; permission-framework integration where it fits  

## Later / demand-driven

7. gRPC-web targets (only if orgs expose services that way)  
8. Custom TLS materials (corporate CA, mTLS) beyond system trust roots  
