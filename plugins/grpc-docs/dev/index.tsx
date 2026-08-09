import { type ApiEntity } from '@backstage/catalog-model';
import { Content, Header, Page } from '@backstage/core-components';
import { createDevApp } from '@backstage/dev-utils';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import {
  GRPC_DOCS_ENVIRONMENTS_ANNOTATION,
  GRPC_DOCS_OPERATIONS_ANNOTATION,
} from '@samuel.fabel/plugin-grpc-docs-common';
import { GrpcDocsWidget, grpcDocsPlugin } from '../src';

const definition = `syntax = "proto3";

package helloworld;

// Greeter offers simple hello/goodbye RPCs for demos.
service Greeter {
  // Say hello to the world
  rpc SayHello (HelloRequest) returns (HelloReply);
  // Say goodbye to the world
  rpc SayBye (ByeRequest) returns (ByeReply);
}

// HelloRequest is the input to SayHello.
message HelloRequest {
  // The name to greet.
  string name = 1;
}

// HelloReply is returned by SayHello.
message HelloReply {
  // Greeting message for the caller.
  string message = 1;
}

message ByeRequest {
  string farewell = 1; // Optional farewell text
}

message ByeReply {
  string farewell = 1;
}
`;

const entity: ApiEntity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'API',
  metadata: {
    name: 'hello-world-grpc',
    annotations: {
      [GRPC_DOCS_ENVIRONMENTS_ANNOTATION]: `
- name: local
  target: 127.0.0.1:50051
  security: insecure
- name: staging
  target: grpc-staging.internal:443
  security: ssl
`,
      [GRPC_DOCS_OPERATIONS_ANNOTATION]: `
- rpc: helloworld.Greeter/SayHello
  headers:
    - name: authorization
      required: true
      type: string
      default: "Bearer "
  examples:
    - name: basic
      summary: Hello padrão
      value:
        name: world
      response:
        message: Hello world
    - name: empty-name
      summary: Nome vazio
      value:
        name: ""
  errorExamples:
    - name: invalid-argument
      code: INVALID_ARGUMENT
      summary: name obrigatório
      value:
        code: 3
        message: "INVALID_ARGUMENT: name must not be empty"
        details:
          - "@type": type.googleapis.com/google.rpc.BadRequest
            fieldViolations:
              - field: name
                description: must not be empty
    - name: unauthenticated
      code: UNAUTHENTICATED
      summary: token ausente ou inválido
      value:
        code: 16
        message: "UNAUTHENTICATED: missing bearer token"
        details: []
`,
    },
  },
  spec: {
    type: 'grpc',
    lifecycle: 'experimental',
    owner: 'guests',
    definition,
  },
};

createDevApp()
  .registerPlugin(grpcDocsPlugin)
  .addPage({
    path: '/grpc-docs',
    title: 'gRPC',
    element: (
      <Page themeId="tool">
        <Header title="grpc-docs" subtitle="Dev playground for spec.type: grpc" />
        <Content>
          <EntityProvider entity={entity}>
            <GrpcDocsWidget definition={definition} />
          </EntityProvider>
        </Content>
      </Page>
    ),
  })
  .render();
