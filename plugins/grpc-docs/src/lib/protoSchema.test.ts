import {
  formatMessageSchema,
  getMessageSchema,
  parseDescriptorFromProto,
  stubFromMessageSchema,
} from './protoSchema';

const helloWorld = `syntax = "proto3";

package helloworld;

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
}

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}
`;

const documentedProto = `syntax = "proto3";

package helloworld;

// Greeter offers simple hello/goodbye RPCs for demos.
service Greeter {
  // Say hello to the world
  rpc SayHello (HelloRequest) returns (HelloReply);
  /** Say goodbye to the world */
  rpc SayBye (ByeRequest) returns (ByeReply);
}

// HelloRequest is the input to SayHello.
message HelloRequest {
  // The name to greet.
  string name = 1;
}

message ByeRequest {
  string farewell = 1; // Optional farewell text
}

message ByeReply {
  string farewell = 1;
}

message HelloReply {
  string message = 1;
}
`;

const richProto = `syntax = "proto3";

package demo;

enum Status {
  STATUS_UNSPECIFIED = 0;
  ACTIVE = 1;
}

message Sample {
  string name = 1;
  int32 count = 2;
  bool enabled = 3;
  Status status = 4;
  repeated string tags = 5;
}
`;

describe('parseDescriptorFromProto', () => {
  it('lists services and methods from the local proto', () => {
    const tree = parseDescriptorFromProto(helloWorld);
    expect(tree.services).toEqual([
      {
        name: 'helloworld.Greeter',
        methods: [
          {
            name: 'SayHello',
            path: '/helloworld.Greeter/SayHello',
            requestStream: false,
            responseStream: false,
            requestType: 'HelloRequest',
            responseType: 'HelloReply',
          },
        ],
      },
    ]);
  });

  it('captures // leading comments on services and RPCs', () => {
    const tree = parseDescriptorFromProto(documentedProto);
    const service = tree.services[0];
    expect(service?.description).toBe(
      'Greeter offers simple hello/goodbye RPCs for demos.',
    );
    expect(service?.methods.find(m => m.name === 'SayHello')?.description).toBe(
      'Say hello to the world',
    );
  });

  it('captures /** */ leading comments on RPCs', () => {
    const tree = parseDescriptorFromProto(documentedProto);
    expect(
      tree.services[0]?.methods.find(m => m.name === 'SayBye')?.description,
    ).toBe('Say goodbye to the world');
  });

  it('returns empty tree for invalid proto', () => {
    expect(parseDescriptorFromProto('not a proto')).toEqual({ services: [] });
    expect(parseDescriptorFromProto('')).toEqual({ services: [] });
  });
});

describe('getMessageSchema comments', () => {
  it('captures leading field comments and message comments', () => {
    const schema = getMessageSchema(documentedProto, 'HelloRequest');
    expect(schema?.description).toBe('HelloRequest is the input to SayHello.');
    expect(schema?.fields.find(f => f.name === 'name')?.description).toBe(
      'The name to greet.',
    );
  });

  it('captures trailing field comments', () => {
    const schema = getMessageSchema(documentedProto, 'ByeRequest');
    expect(schema?.fields.find(f => f.name === 'farewell')?.description).toBe(
      'Optional farewell text',
    );
  });
});

describe('formatMessageSchema', () => {
  it('emits proto-style leading comments for message and fields', () => {
    const schema = getMessageSchema(documentedProto, 'HelloRequest');
    expect(formatMessageSchema(schema)).toBe(
      [
        '// HelloRequest is the input to SayHello.',
        'message HelloRequest {',
        '  // The name to greet.',
        '  string name = 1;',
        '}',
      ].join('\n'),
    );
  });
});

describe('stubFromMessageSchema', () => {
  it('uses Swagger-like defaults (string, 0, true, first enum)', () => {
    const schema = getMessageSchema(richProto, 'Sample');
    expect(stubFromMessageSchema(schema)).toEqual({
      name: 'string',
      count: 0,
      enabled: true,
      status: 'STATUS_UNSPECIFIED',
      tags: ['string'],
    });
  });
});
