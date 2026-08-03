import * as grpc from '@grpc/grpc-js';
import type { ChannelSecurity } from './types';

export function createCredentials(
  security: ChannelSecurity = 'insecure',
): grpc.ChannelCredentials {
  if (security === 'ssl') {
    return grpc.ChannelCredentials.createSsl();
  }
  return grpc.ChannelCredentials.createInsecure();
}
