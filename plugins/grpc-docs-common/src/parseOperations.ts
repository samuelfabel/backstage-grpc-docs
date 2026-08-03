import yaml from 'yaml';
import type {
  GrpcErrorExample,
  GrpcExample,
  GrpcHeaderSpec,
  GrpcOperation,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseExample(value: unknown): GrpcExample | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  if (typeof value.name !== 'string' || !value.name.trim()) {
    return undefined;
  }
  if (!isRecord(value.value)) {
    return undefined;
  }
  const example: GrpcExample = {
    name: value.name.trim(),
    value: value.value,
  };
  if (typeof value.summary === 'string') {
    example.summary = value.summary;
  }
  if (isRecord(value.response)) {
    example.response = value.response;
  }
  return example;
}

function parseErrorExample(value: unknown): GrpcErrorExample | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  if (typeof value.name !== 'string' || !value.name.trim()) {
    return undefined;
  }
  if (
    typeof value.code !== 'string' &&
    typeof value.code !== 'number'
  ) {
    return undefined;
  }
  if (!isRecord(value.value)) {
    return undefined;
  }
  return {
    name: value.name.trim(),
    code: value.code,
    ...(typeof value.summary === 'string' ? { summary: value.summary } : {}),
    value: value.value,
  };
}

function parseHeader(value: unknown): GrpcHeaderSpec | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  if (typeof value.name !== 'string' || !value.name.trim()) {
    return undefined;
  }
  const header: GrpcHeaderSpec = { name: value.name.trim() };
  if (typeof value.required === 'boolean') {
    header.required = value.required;
  }
  if (typeof value.type === 'string') {
    header.type = value.type;
  }
  if (typeof value.default === 'string') {
    header.default = value.default;
  }
  if (
    Array.isArray(value.enum) &&
    value.enum.every((item): item is string => typeof item === 'string')
  ) {
    header.enum = value.enum;
  }
  return header;
}

function parseOperation(value: unknown): GrpcOperation | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  if (typeof value.rpc !== 'string' || !value.rpc.trim()) {
    return undefined;
  }
  const rpc = value.rpc.trim().replace(/^\//, '');
  const operation: GrpcOperation = { rpc };

  if (Array.isArray(value.headers)) {
    const headers = value.headers
      .map(parseHeader)
      .filter((h): h is GrpcHeaderSpec => Boolean(h));
    if (headers.length > 0) {
      operation.headers = headers;
    }
  }

  if (Array.isArray(value.examples)) {
    const examples = value.examples
      .map(parseExample)
      .filter((e): e is GrpcExample => Boolean(e));
    if (examples.length > 0) {
      operation.examples = examples;
    }
  }

  if (Array.isArray(value.errorExamples)) {
    const errorExamples = value.errorExamples
      .map(parseErrorExample)
      .filter((e): e is GrpcErrorExample => Boolean(e));
    if (errorExamples.length > 0) {
      operation.errorExamples = errorExamples;
    }
  }

  return operation;
}

/**
 * Parse `grpc-docs.io/operations` annotation YAML into per-RPC playground config.
 */
export function parseOperations(annotation?: string): GrpcOperation[] {
  if (!annotation?.trim()) {
    return [];
  }

  try {
    const parsed: unknown = yaml.parse(annotation);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map(parseOperation)
      .filter((op): op is GrpcOperation => Boolean(op));
  } catch {
    return [];
  }
}

/** Find operation config for `service/method` (with or without leading slash). */
export function findOperation(
  operations: GrpcOperation[],
  service: string,
  method: string,
): GrpcOperation | undefined {
  const key = `${service}/${method}`.replace(/^\//, '');
  return operations.find(op => op.rpc.replace(/^\//, '') === key);
}
