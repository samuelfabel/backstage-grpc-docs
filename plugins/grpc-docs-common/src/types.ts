/** How the channel authenticates to the target. */
export type ChannelSecurity = 'insecure' | 'ssl';

export interface GrpcMetadata {
  [key: string]: string | string[];
}

export interface MethodDescriptor {
  name: string;
  path: string;
  requestStream: boolean;
  responseStream: boolean;
  requestType: string;
  responseType: string;
  /** Proto leading/trailing comment for this RPC (SourceCodeInfo-style). */
  description?: string;
}

export interface ServiceDescriptor {
  /** Fully-qualified service name, e.g. `helloworld.Greeter`. */
  name: string;
  methods: MethodDescriptor[];
  /** Proto leading/trailing comment for this service. */
  description?: string;
}

export interface DescriptorTree {
  services: ServiceDescriptor[];
}

export interface UnaryCallRequest {
  /** `host:port` of the gRPC server. */
  target: string;
  /** Fully-qualified service name, e.g. `helloworld.Greeter`. */
  service: string;
  /** Method name as declared in the proto (e.g. `SayHello`). */
  method: string;
  /** Request body as proto3 JSON. */
  payload: Record<string, unknown>;
  metadata?: GrpcMetadata;
  security?: ChannelSecurity;
  /** Relative timeout in milliseconds. */
  timeoutMs?: number;
}

export interface UnaryCallResponse {
  payload: Record<string, unknown>;
  trailingMetadata?: GrpcMetadata;
}

export interface ListServicesRequest {
  target: string;
  security?: ChannelSecurity;
}

export interface DescribeRequest {
  target: string;
  /** If omitted, every non-reflection service is described. */
  service?: string;
  security?: ChannelSecurity;
}

export interface GrpcEnvironment {
  name: string;
  target: string;
  /** Channel credentials for this environment. Defaults to `insecure`. */
  security?: ChannelSecurity;
}

export interface GrpcExample {
  name: string;
  summary?: string;
  /** Request body as proto3 JSON. */
  value: Record<string, unknown>;
  /** Optional success response body for this example. */
  response?: Record<string, unknown>;
}

/**
 * Documented gRPC error for an RPC — mirrors OpenAPI response examples,
 * using status codes + a `google.rpc.Status`-shaped payload.
 */
export interface GrpcErrorExample {
  name: string;
  /** Status name (`INVALID_ARGUMENT`) or numeric code (`3`). */
  code: string | number;
  summary?: string;
  /** Error payload, typically `google.rpc.Status` JSON. */
  value: Record<string, unknown>;
}

export interface GrpcHeaderSpec {
  name: string;
  required?: boolean;
  type?: string;
  default?: string;
  enum?: string[];
}

export interface GrpcOperation {
  /** Fully-qualified RPC path, e.g. `helloworld.Greeter/SayHello`. */
  rpc: string;
  headers?: GrpcHeaderSpec[];
  examples?: GrpcExample[];
  errorExamples?: GrpcErrorExample[];
}
