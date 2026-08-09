import type {
  ChannelSecurity,
  GrpcEnvironment,
} from '@samuel.fabel/plugin-grpc-docs-common';

export interface ResolvedEnvironment {
  target: string;
  security: ChannelSecurity;
  name?: string;
}

/** Resolve the effective gRPC target + security from selector state. */
export function resolveEnvironment(options: {
  environments: GrpcEnvironment[];
  selectedName: string;
  customTarget: string;
}): ResolvedEnvironment {
  const { environments, selectedName, customTarget } = options;
  if (environments.length === 0) {
    return {
      target: customTarget.trim(),
      security: 'insecure',
    };
  }
  const match =
    environments.find(env => env.name === selectedName) ?? environments[0];
  return {
    name: match?.name,
    target: match?.target.trim() ?? '',
    security: match?.security ?? 'insecure',
  };
}

/** @deprecated Prefer {@link resolveEnvironment}. */
export function resolveTarget(options: {
  environments: GrpcEnvironment[];
  selectedName: string;
  customTarget: string;
}): string {
  return resolveEnvironment(options).target;
}
