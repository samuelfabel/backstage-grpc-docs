import {
  createApiRef,
  type DiscoveryApi,
  type FetchApi,
  type IdentityApi,
} from '@backstage/core-plugin-api';
import type { UnaryCallRequest, UnaryCallResponse } from './types';

export const grpcDocsApiRef = createApiRef<GrpcDocsApi>({
  id: 'plugin.grpc-docs.service',
});

export interface CallOptions {
  signal?: AbortSignal;
}

/** Structured API failure for the playground Response panel. */
export class GrpcDocsApiError extends Error {
  readonly httpStatus?: number;
  readonly body: Record<string, unknown>;

  constructor(options: {
    message: string;
    httpStatus?: number;
    body?: Record<string, unknown>;
  }) {
    super(options.message);
    this.name = 'GrpcDocsApiError';
    this.httpStatus = options.httpStatus;
    this.body = options.body ?? { message: options.message };
  }
}

export interface GrpcDocsApi {
  callUnary(
    request: UnaryCallRequest,
    options?: CallOptions,
  ): Promise<UnaryCallResponse>;
}

export class GrpcDocsClient implements GrpcDocsApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;
  private readonly identityApi: IdentityApi;

  constructor(options: {
    discoveryApi: DiscoveryApi;
    fetchApi: FetchApi;
    identityApi: IdentityApi;
  }) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
    this.identityApi = options.identityApi;
  }

  async callUnary(
    request: UnaryCallRequest,
    options?: CallOptions,
  ): Promise<UnaryCallResponse> {
    return this.post<UnaryCallResponse>('/call/unary', request, options);
  }

  private async post<T>(
    path: string,
    body: unknown,
    options?: CallOptions,
  ): Promise<T> {
    const baseUrl = await this.discoveryApi.getBaseUrl('grpc-docs');
    const url = `${baseUrl}${path}`;
    const { token } = await this.identityApi.getCredentials();

    let response: Response;
    try {
      response = await this.fetchApi.fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        signal: options?.signal,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const network =
        /failed to fetch|networkerror|load failed/i.test(message) ||
        message.startsWith('Failed to fetch');
      throw new GrpcDocsApiError({
        message: network
          ? `Could not reach grpc-docs backend (${url}). Is the backend plugin running?`
          : message,
        body: {
          code: 'UNAVAILABLE',
          message: network
            ? 'Could not reach grpc-docs backend'
            : message,
          details: [
            { reason: 'NETWORK', url, method: 'POST', cause: message },
          ],
        },
      });
    }

    if (!response.ok) {
      let detail = response.statusText || `HTTP ${response.status}`;
      let errorBody: Record<string, unknown> = {
        code: response.status >= 500 ? 'UNAVAILABLE' : 'INVALID_ARGUMENT',
        message: detail,
      };
      try {
        const parsed = (await response.json()) as { error?: string };
        if (parsed.error) {
          detail = parsed.error;
          errorBody = {
            code: inferGrpcCodeName(parsed.error),
            message: parsed.error,
            details: [],
          };
        }
      } catch {
        // keep statusText
      }
      throw new GrpcDocsApiError({
        message: detail,
        httpStatus: response.status,
        body: errorBody,
      });
    }

    return (await response.json()) as T;
  }
}

function inferGrpcCodeName(message: string): string {
  const match = message.match(
    /\b(CANCELLED|UNKNOWN|INVALID_ARGUMENT|DEADLINE_EXCEEDED|NOT_FOUND|ALREADY_EXISTS|PERMISSION_DENIED|RESOURCE_EXHAUSTED|FAILED_PRECONDITION|ABORTED|OUT_OF_RANGE|UNIMPLEMENTED|INTERNAL|UNAVAILABLE|DATA_LOSS|UNAUTHENTICATED)\b/i,
  );
  return match?.[1]?.toUpperCase() ?? 'UNKNOWN';
}
