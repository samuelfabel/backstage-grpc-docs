import yaml from 'yaml';
import type { ChannelSecurity, GrpcEnvironment } from './types';

function parseSecurity(value: unknown): ChannelSecurity | undefined {
  if (value === 'insecure' || value === 'ssl') {
    return value;
  }
  return undefined;
}

function isEnvironment(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.name === 'string' &&
    record.name.trim().length > 0 &&
    typeof record.target === 'string' &&
    record.target.trim().length > 0
  );
}

/**
 * Parse `grpc-docs.io/environments` annotation YAML into environments.
 * Invalid entries are skipped; malformed YAML yields an empty list.
 */
export function parseEnvironments(annotation?: string): GrpcEnvironment[] {
  if (!annotation?.trim()) {
    return [];
  }

  try {
    const parsed: unknown = yaml.parse(annotation);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isEnvironment).map(env => {
      const security = parseSecurity(env.security);
      return {
        name: String(env.name).trim(),
        target: String(env.target).trim(),
        ...(security ? { security } : {}),
      };
    });
  } catch {
    return [];
  }
}
