import type * as grpc from '@grpc/grpc-js';
import type {
  ChannelSecurity,
  DescribeRequest as CommonDescribeRequest,
  ListServicesRequest as CommonListServicesRequest,
  UnaryCallRequest as CommonUnaryCallRequest,
} from '@samuelfabel/plugin-grpc-docs-common';

export type {
  ChannelSecurity,
  DescriptorTree,
  GrpcMetadata,
  MethodDescriptor,
  ServiceDescriptor,
  UnaryCallResponse,
} from '@samuelfabel/plugin-grpc-docs-common';

export interface ChannelOptions {
  security?: ChannelSecurity;
  /** Extra @grpc/grpc-js channel options. */
  channelOptions?: grpc.ChannelOptions;
}

export interface UnaryCallRequest extends CommonUnaryCallRequest {
  channelOptions?: grpc.ChannelOptions;
}

export interface ListServicesRequest extends CommonListServicesRequest {
  channelOptions?: grpc.ChannelOptions;
}

export interface DescribeRequest extends CommonDescribeRequest {
  channelOptions?: grpc.ChannelOptions;
}
