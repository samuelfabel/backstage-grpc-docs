import * as grpc from '@grpc/grpc-js';
import { createCredentials } from './credentials';
import { fromGrpcMetadata, toGrpcMetadata } from './metadata';
import {
  resolveClientMethodName,
  resolveServiceClientConstructor,
} from './reflection';
import type { UnaryCallRequest, UnaryCallResponse } from './types';

type UnaryClientMethod = (
  request: Record<string, unknown>,
  metadata: grpc.Metadata,
  options: grpc.CallOptions,
  callback: grpc.requestCallback<Record<string, unknown>>,
) => grpc.ClientUnaryCall;

export async function callUnary(
  request: UnaryCallRequest,
): Promise<UnaryCallResponse> {
  const security = request.security ?? 'insecure';
  const ServiceClient = await resolveServiceClientConstructor(
    request.target,
    request.service,
    security,
    request.channelOptions,
  );

  const client = new ServiceClient(
    request.target,
    createCredentials(security),
    request.channelOptions,
  );

  try {
    const methodKey = resolveClientMethodName(client, request.method);
    const method = (client as unknown as Record<string, UnaryClientMethod>)[
      methodKey
    ];

    if (typeof method !== 'function') {
      throw new Error(
        `Resolved method "${methodKey}" is not callable on service "${request.service}"`,
      );
    }

    const metadata = toGrpcMetadata(request.metadata);
    const callOptions: grpc.CallOptions = {};
    if (request.timeoutMs !== undefined) {
      callOptions.deadline = Date.now() + request.timeoutMs;
    }

    return await new Promise<UnaryCallResponse>((resolve, reject) => {
      let payload: Record<string, unknown> | undefined;
      let trailing = new grpc.Metadata();
      let gotResponse = false;
      let gotStatus = false;
      let settled = false;

      const finish = (err?: Error | null) => {
        if (settled) {
          return;
        }
        if (err) {
          settled = true;
          reject(err);
          return;
        }
        if (!gotResponse || !gotStatus) {
          return;
        }
        settled = true;
        resolve({
          payload: payload ?? {},
          trailingMetadata: fromGrpcMetadata(trailing),
        });
      };

      const call = method.call(
        client,
        request.payload,
        metadata,
        callOptions,
        (err, response) => {
          if (err) {
            finish(err);
            return;
          }
          payload = (response ?? {}) as Record<string, unknown>;
          gotResponse = true;
          finish();
        },
      );
      call.on('status', status => {
        trailing = status.metadata;
        gotStatus = true;
        finish();
      });
    });
  } finally {
    client.close();
  }
}
