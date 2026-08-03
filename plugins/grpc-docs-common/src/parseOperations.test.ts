import { findOperation, parseOperations } from './parseOperations';

describe('parseOperations', () => {
  it('parses operations with examples, responses, errors and headers', () => {
    const ops = parseOperations(`
      - rpc: helloworld.Greeter/SayHello
        headers:
          - name: authorization
            required: true
            type: string
            default: "Bearer "
          - name: x-tenant
            required: true
            enum: [acme, contoso]
        examples:
          - name: basic
            summary: Hello padrão
            value:
              name: world
            response:
              message: Hello world
          - name: empty-name
            value:
              name: ""
        errorExamples:
          - name: invalid-argument
            code: INVALID_ARGUMENT
            summary: name obrigatório
            value:
              code: 3
              message: bad request
          - name: numeric
            code: 16
            value:
              code: 16
              message: unauthenticated
    `);

    expect(ops).toHaveLength(1);
    expect(ops[0]?.rpc).toBe('helloworld.Greeter/SayHello');
    expect(ops[0]?.headers).toEqual([
      {
        name: 'authorization',
        required: true,
        type: 'string',
        default: 'Bearer ',
      },
      {
        name: 'x-tenant',
        required: true,
        enum: ['acme', 'contoso'],
      },
    ]);
    expect(ops[0]?.examples).toEqual([
      {
        name: 'basic',
        summary: 'Hello padrão',
        value: { name: 'world' },
        response: { message: 'Hello world' },
      },
      { name: 'empty-name', value: { name: '' } },
    ]);
    expect(ops[0]?.errorExamples).toEqual([
      {
        name: 'invalid-argument',
        code: 'INVALID_ARGUMENT',
        summary: 'name obrigatório',
        value: { code: 3, message: 'bad request' },
      },
      {
        name: 'numeric',
        code: 16,
        value: { code: 16, message: 'unauthenticated' },
      },
    ]);
  });

  it('skips invalid operations and finds by service/method', () => {
    const ops = parseOperations(`
      - rpc: /pkg.Svc/Method
        examples:
          - name: ok
            value: { a: 1 }
      - rpc:
      - examples: []
    `);
    expect(ops).toHaveLength(1);
    expect(findOperation(ops, 'pkg.Svc', 'Method')?.rpc).toBe('pkg.Svc/Method');
    expect(findOperation(ops, 'other.Svc', 'Method')).toBeUndefined();
  });

  it('returns empty for missing or invalid YAML', () => {
    expect(parseOperations(undefined)).toEqual([]);
    expect(parseOperations('')).toEqual([]);
    expect(parseOperations('not: [valid')).toEqual([]);
  });
});
