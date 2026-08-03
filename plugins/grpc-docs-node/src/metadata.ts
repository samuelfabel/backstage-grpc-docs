import * as grpc from '@grpc/grpc-js';
import type { GrpcMetadata } from './types';

export function toGrpcMetadata(input?: GrpcMetadata): grpc.Metadata {
  const metadata = new grpc.Metadata();
  if (!input) {
    return metadata;
  }
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        metadata.add(key, item);
      }
    } else {
      metadata.set(key, value);
    }
  }
  return metadata;
}

export function fromGrpcMetadata(metadata: grpc.Metadata): GrpcMetadata {
  const result: GrpcMetadata = {};
  const map = metadata.getMap();
  for (const [key, value] of Object.entries(map)) {
    result[key] = Buffer.isBuffer(value) ? value.toString('utf8') : value;
  }
  return result;
}
