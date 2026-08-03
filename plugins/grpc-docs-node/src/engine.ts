import { describeTarget, listServiceNames } from './reflection';
import { callUnary } from './unary';
import type {
  DescribeRequest,
  DescriptorTree,
  ListServicesRequest,
  UnaryCallRequest,
  UnaryCallResponse,
} from './types';

/**
 * Backstage-agnostic gRPC engine.
 *
 * JSON in, JSON out. Discovers contracts via server reflection and issues
 * real HTTP/2 gRPC calls. No catalog, identity, or permission awareness.
 */
export class GrpcEngine {
  listServices(request: ListServicesRequest): Promise<string[]> {
    return listServiceNames(
      request.target,
      request.security,
      request.channelOptions,
    );
  }

  describe(request: DescribeRequest): Promise<DescriptorTree> {
    return describeTarget(
      request.target,
      request.service,
      request.security,
      request.channelOptions,
    );
  }

  callUnary(request: UnaryCallRequest): Promise<UnaryCallResponse> {
    return callUnary(request);
  }
}
