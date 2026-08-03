import { formatGrpcStatus } from './grpcStatus';

describe('formatGrpcStatus', () => {
  it('formats numeric and named codes', () => {
    expect(formatGrpcStatus(3)).toBe('INVALID_ARGUMENT (3)');
    expect(formatGrpcStatus('UNAUTHENTICATED')).toBe('UNAUTHENTICATED (16)');
    expect(formatGrpcStatus('custom')).toBe('custom');
  });
});
