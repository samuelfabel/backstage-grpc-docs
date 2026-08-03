import { parseEnvironments } from './parseEnvironments';

describe('parseEnvironments', () => {
  it('parses a valid environments block with security', () => {
    const envs = parseEnvironments(`
      - name: dev
        target: grpc-dev.internal:443
        security: insecure
      - name: prod
        target: grpc.internal:443
        security: ssl
    `);
    expect(envs).toEqual([
      {
        name: 'dev',
        target: 'grpc-dev.internal:443',
        security: 'insecure',
      },
      { name: 'prod', target: 'grpc.internal:443', security: 'ssl' },
    ]);
  });

  it('skips invalid entries and ignores unknown security', () => {
    const envs = parseEnvironments(`
      - name: staging
        target: grpc-staging.internal:443
        security: weird
      - name: broken
      - target: no-name.internal:443
    `);
    expect(envs).toEqual([
      { name: 'staging', target: 'grpc-staging.internal:443' },
    ]);
  });

  it('returns empty for missing or invalid YAML', () => {
    expect(parseEnvironments(undefined)).toEqual([]);
    expect(parseEnvironments('')).toEqual([]);
    expect(parseEnvironments('not: [valid')).toEqual([]);
    expect(parseEnvironments('name: only-object')).toEqual([]);
  });
});
