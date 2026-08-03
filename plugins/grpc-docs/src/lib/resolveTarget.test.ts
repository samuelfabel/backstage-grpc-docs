import { resolveEnvironment, resolveTarget } from './resolveTarget';

describe('resolveEnvironment', () => {
  it('uses custom target with insecure when no environments', () => {
    expect(
      resolveEnvironment({
        environments: [],
        selectedName: '',
        customTarget: ' 127.0.0.1:50051 ',
      }),
    ).toEqual({
      target: '127.0.0.1:50051',
      security: 'insecure',
    });
  });

  it('resolves selected environment security', () => {
    expect(
      resolveEnvironment({
        environments: [
          {
            name: 'local',
            target: '127.0.0.1:50051',
            security: 'insecure',
          },
          {
            name: 'staging',
            target: 'grpc-staging.internal:443',
            security: 'ssl',
          },
        ],
        selectedName: 'staging',
        customTarget: '',
      }),
    ).toEqual({
      name: 'staging',
      target: 'grpc-staging.internal:443',
      security: 'ssl',
    });
  });

  it('defaults security to insecure when omitted', () => {
    expect(
      resolveEnvironment({
        environments: [{ name: 'dev', target: 'host:1' }],
        selectedName: 'dev',
        customTarget: '',
      }).security,
    ).toBe('insecure');
  });

  it('falls back to the first environment when name is unknown', () => {
    expect(
      resolveEnvironment({
        environments: [{ name: 'dev', target: 'grpc-dev.internal:443' }],
        selectedName: 'missing',
        customTarget: '',
      }),
    ).toEqual({
      name: 'dev',
      target: 'grpc-dev.internal:443',
      security: 'insecure',
    });
  });
});

describe('resolveTarget', () => {
  it('uses custom target when no environments exist', () => {
    expect(
      resolveTarget({
        environments: [],
        selectedName: '',
        customTarget: ' 127.0.0.1:50051 ',
      }),
    ).toBe('127.0.0.1:50051');
  });

  it('resolves by environment name', () => {
    expect(
      resolveTarget({
        environments: [
          { name: 'dev', target: 'grpc-dev.internal:443' },
          { name: 'prod', target: 'grpc.internal:443' },
        ],
        selectedName: 'prod',
        customTarget: '',
      }),
    ).toBe('grpc.internal:443');
  });
});
