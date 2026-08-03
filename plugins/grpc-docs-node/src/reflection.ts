import * as grpc from '@grpc/grpc-js';
import { GrpcReflection } from 'grpc-js-reflection-client';
import { createCredentials } from './credentials';
import type {
  ChannelSecurity,
  DescriptorTree,
  MethodDescriptor,
  ServiceDescriptor,
} from './types';

const REFLECTION_SERVICE_PREFIXES = [
  'grpc.reflection.v1.',
  'grpc.reflection.v1alpha.',
];

export function isReflectionService(name: string): boolean {
  return REFLECTION_SERVICE_PREFIXES.some(prefix => name.startsWith(prefix));
}

export function createReflectionClient(
  target: string,
  security: ChannelSecurity = 'insecure',
  channelOptions?: grpc.ChannelOptions,
): GrpcReflection {
  return new GrpcReflection(
    target,
    createCredentials(security),
    channelOptions,
  );
}

export async function listServiceNames(
  target: string,
  security: ChannelSecurity = 'insecure',
  channelOptions?: grpc.ChannelOptions,
): Promise<string[]> {
  const client = createReflectionClient(target, security, channelOptions);
  const services = await client.listServices();
  return services.filter(name => !isReflectionService(name));
}

function typeName(
  type: { fullName?: string; name?: string } | string | undefined,
): string {
  if (!type) {
    return '';
  }
  if (typeof type === 'string') {
    return type.replace(/^\./, '');
  }
  return (type.fullName ?? type.name ?? '').replace(/^\./, '');
}

function methodToDescriptor(
  serviceName: string,
  method: {
    name: string;
    requestStream?: boolean;
    responseStream?: boolean;
    requestType?: { fullName?: string; name?: string } | string;
    responseType?: { fullName?: string; name?: string } | string;
  },
): MethodDescriptor {
  return {
    name: method.name,
    path: `/${serviceName}/${method.name}`,
    requestStream: Boolean(method.requestStream),
    responseStream: Boolean(method.responseStream),
    requestType: typeName(method.requestType),
    responseType: typeName(method.responseType),
  };
}

export async function describeService(
  target: string,
  serviceName: string,
  security: ChannelSecurity = 'insecure',
  channelOptions?: grpc.ChannelOptions,
): Promise<ServiceDescriptor> {
  const client = createReflectionClient(target, security, channelOptions);
  const methods = await client.listMethods(serviceName);
  return {
    name: serviceName,
    methods: methods.map(method =>
      methodToDescriptor(
        serviceName,
        method as Parameters<typeof methodToDescriptor>[1],
      ),
    ),
  };
}

export async function describeTarget(
  target: string,
  serviceName: string | undefined,
  security: ChannelSecurity = 'insecure',
  channelOptions?: grpc.ChannelOptions,
): Promise<DescriptorTree> {
  if (serviceName) {
    return {
      services: [
        await describeService(target, serviceName, security, channelOptions),
      ],
    };
  }

  const names = await listServiceNames(target, security, channelOptions);
  const services = await Promise.all(
    names.map(name => describeService(target, name, security, channelOptions)),
  );
  return { services };
}

/** Resolve a service client constructor via reflection + package object. */
export async function resolveServiceClientConstructor(
  target: string,
  serviceName: string,
  security: ChannelSecurity = 'insecure',
  channelOptions?: grpc.ChannelOptions,
): Promise<grpc.ServiceClientConstructor> {
  const client = createReflectionClient(target, security, channelOptions);
  const descriptor = await client.getDescriptorBySymbol(serviceName);
  const packageObject = descriptor.getPackageObject({
    keepCase: false,
    enums: String,
    longs: String,
    defaults: true,
    oneofs: true,
  }) as Record<string, unknown>;

  const ctor = lookupServiceConstructor(packageObject, serviceName);
  if (!ctor) {
    throw new Error(
      `Service "${serviceName}" not found in reflected package descriptor`,
    );
  }
  return ctor;
}

function lookupServiceConstructor(
  root: Record<string, unknown>,
  serviceName: string,
): grpc.ServiceClientConstructor | undefined {
  const parts = serviceName.split('.');
  let current: unknown = root;
  for (const part of parts) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  if (typeof current === 'function') {
    return current as grpc.ServiceClientConstructor;
  }
  return undefined;
}

export function resolveClientMethodName(
  client: grpc.Client,
  methodName: string,
): string {
  const callable = client as unknown as Record<string, unknown>;
  const proto = Object.getPrototypeOf(client) as Record<string, unknown>;
  const ownKeys = new Set([
    ...Object.keys(callable),
    ...Object.keys(proto),
  ]);

  if (ownKeys.has(methodName) && typeof callable[methodName] === 'function') {
    return methodName;
  }

  const camel = methodName.charAt(0).toLowerCase() + methodName.slice(1);
  if (ownKeys.has(camel) && typeof callable[camel] === 'function') {
    return camel;
  }

  const lower = methodName.toLowerCase();
  for (const key of ownKeys) {
    if (key.toLowerCase() === lower && typeof callable[key] === 'function') {
      return key;
    }
  }

  throw new Error(
    `Method "${methodName}" not found on gRPC client (tried original and camelCase)`,
  );
}
