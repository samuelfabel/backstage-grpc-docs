import { status as grpcStatus } from '@grpc/grpc-js';
import { GrpcEngine } from '../engine';
import { startHelloServer, type HelloServer } from './helpers/testServer';

describe('GrpcEngine unary + reflection', () => {
  let server: HelloServer;
  const engine = new GrpcEngine();

  beforeAll(async () => {
    server = await startHelloServer();
  });

  afterAll(async () => {
    await server.stop();
  });

  it('lists services via reflection (excluding reflection itself)', async () => {
    const services = await engine.listServices({ target: server.target });
    expect(services).toEqual(['helloworld.Greeter']);
  });

  it('describes service methods via reflection', async () => {
    const tree = await engine.describe({
      target: server.target,
      service: 'helloworld.Greeter',
    });

    expect(tree.services).toHaveLength(1);
    expect(tree.services[0]?.name).toBe('helloworld.Greeter');
    expect(tree.services[0]?.methods.map(m => m.name).sort()).toEqual([
      'SayBye',
      'SayHello',
    ]);

    const sayHello = tree.services[0]?.methods.find(m => m.name === 'SayHello');
    expect(sayHello?.requestStream).toBe(false);
    expect(sayHello?.responseStream).toBe(false);
    expect(sayHello?.path).toBe('/helloworld.Greeter/SayHello');
  });

  it('performs a unary call with JSON payload', async () => {
    const response = await engine.callUnary({
      target: server.target,
      service: 'helloworld.Greeter',
      method: 'SayHello',
      payload: { name: 'grpc-docs' },
      timeoutMs: 5_000,
    });

    expect(response.payload).toEqual({ message: 'Hello, grpc-docs' });
  });

  it('accepts camelCase method names', async () => {
    const response = await engine.callUnary({
      target: server.target,
      service: 'helloworld.Greeter',
      method: 'sayHello',
      payload: { name: 'world' },
      timeoutMs: 5_000,
    });

    expect(response.payload).toEqual({ message: 'Hello, world' });
  });

  it('calls SayBye', async () => {
    const response = await engine.callUnary({
      target: server.target,
      service: 'helloworld.Greeter',
      method: 'SayBye',
      payload: { farewell: 'friend' },
      timeoutMs: 5_000,
    });

    expect(response.payload).toEqual({ farewell: 'Bye, friend' });
  });

  it('maps INVALID_ARGUMENT for empty name', async () => {
    await expect(
      engine.callUnary({
        target: server.target,
        service: 'helloworld.Greeter',
        method: 'SayHello',
        payload: { name: '' },
        timeoutMs: 5_000,
      }),
    ).rejects.toMatchObject({
      code: grpcStatus.INVALID_ARGUMENT,
    });
  });
});

describe('HelloServer requireAuth', () => {
  let server: HelloServer;
  const engine = new GrpcEngine();

  beforeAll(async () => {
    server = await startHelloServer({ requireAuth: true });
  });

  afterAll(async () => {
    await server.stop();
  });

  it('rejects SayHello without bearer token', async () => {
    await expect(
      engine.callUnary({
        target: server.target,
        service: 'helloworld.Greeter',
        method: 'SayHello',
        payload: { name: 'world' },
        timeoutMs: 5_000,
      }),
    ).rejects.toMatchObject({
      code: grpcStatus.UNAUTHENTICATED,
    });
  });

  it('accepts SayHello with bearer metadata', async () => {
    const response = await engine.callUnary({
      target: server.target,
      service: 'helloworld.Greeter',
      method: 'SayHello',
      payload: { name: 'world' },
      metadata: { authorization: 'Bearer test-token' },
      timeoutMs: 5_000,
    });

    expect(response.payload).toEqual({ message: 'Hello, world' });
  });
});
