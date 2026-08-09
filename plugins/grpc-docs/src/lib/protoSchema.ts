import protobuf from 'protobufjs';
import type {
  DescriptorTree,
  MethodDescriptor,
  ServiceDescriptor,
} from '@samuel.fabel/plugin-grpc-docs-common';

// keepCase + alternateCommentMode so `//` and block comments become .comment
const PARSE_OPTIONS: protobuf.IParseOptions = {
  keepCase: true,
  alternateCommentMode: true,
};

export interface FieldSchema {
  name: string;
  type: string;
  id: number;
  repeated: boolean;
  optional: boolean;
  /** Present when `type` resolves to a protobuf enum (ordered names). */
  enumValues?: string[];
  /** Proto leading/trailing comment for this field. */
  description?: string;
}

export interface MessageSchema {
  name: string;
  fields: FieldSchema[];
  /** Proto leading/trailing comment for this message. */
  description?: string;
}

function trimComment(comment: string | null | undefined): string | undefined {
  if (typeof comment !== 'string') {
    return undefined;
  }
  const trimmed = comment.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Build a Swagger-like method tree from `spec.definition` (no reflection).
 */
export function parseDescriptorFromProto(definition: string): DescriptorTree {
  if (!definition.trim()) {
    return { services: [] };
  }

  try {
    const { root } = protobuf.parse(definition, PARSE_OPTIONS);
    const services: ServiceDescriptor[] = [];

    const visit = (ns: protobuf.Namespace) => {
      for (const nested of ns.nestedArray ?? []) {
        if (nested instanceof protobuf.Service) {
          const serviceName = nested.fullName.replace(/^\./, '');
          const methods: MethodDescriptor[] = nested.methodsArray.map(
            method => {
              const descriptor: MethodDescriptor = {
                name: method.name,
                path: `/${serviceName}/${method.name}`,
                requestStream: Boolean(method.requestStream),
                responseStream: Boolean(method.responseStream),
                requestType: method.requestType,
                responseType: method.responseType,
              };
              const description = trimComment(method.comment);
              if (description) {
                descriptor.description = description;
              }
              return descriptor;
            },
          );
          const service: ServiceDescriptor = { name: serviceName, methods };
          const description = trimComment(nested.comment);
          if (description) {
            service.description = description;
          }
          services.push(service);
        } else if (nested instanceof protobuf.Namespace) {
          visit(nested);
        }
      }
    };

    visit(root);
    return { services };
  } catch {
    return { services: [] };
  }
}

/**
 * Parse a `.proto` definition and return a simplified request message schema.
 */
export function getMessageSchema(
  definition: string,
  messageTypeName: string,
): MessageSchema | undefined {
  if (!definition.trim() || !messageTypeName.trim()) {
    return undefined;
  }

  try {
    const parsed = protobuf.parse(definition, PARSE_OPTIONS);
    const root = parsed.root;
    const typeName = messageTypeName.replace(/^\./, '');
    const type =
      (root.lookupTypeOrEnum(typeName) as protobuf.Type | null) ??
      tryLookupShortName(root, typeName);

    if (!type || !(type instanceof protobuf.Type)) {
      return undefined;
    }

    const schema: MessageSchema = {
      name: type.fullName.replace(/^\./, ''),
      fields: type.fieldsArray.map(field => {
        const fieldSchema: FieldSchema = {
          name: field.name,
          type: field.type,
          id: field.id,
          repeated: Boolean(field.repeated),
          optional: Boolean(field.optional || field.partOf),
        };
        const enumValues = resolveEnumValues(root, field);
        if (enumValues?.length) {
          fieldSchema.enumValues = enumValues;
        }
        const description = trimComment(field.comment);
        if (description) {
          fieldSchema.description = description;
        }
        return fieldSchema;
      }),
    };
    const description = trimComment(type.comment);
    if (description) {
      schema.description = description;
    }
    return schema;
  } catch {
    return undefined;
  }
}

function resolveEnumValues(
  root: protobuf.Root,
  field: protobuf.Field,
): string[] | undefined {
  try {
    const resolved = field.resolve();
    const resolvedType = resolved.resolvedType;
    if (resolvedType instanceof protobuf.Enum) {
      return enumNames(resolvedType);
    }
  } catch {
    // fall through to lookup by type name
  }

  try {
    const found = root.lookupEnum(field.type);
    if (found) {
      return enumNames(found);
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function enumNames(enumType: protobuf.Enum): string[] {
  return Object.keys(enumType.values).filter(key => Number.isNaN(Number(key)));
}

function tryLookupShortName(
  root: protobuf.Root,
  fullName: string,
): protobuf.Type | null {
  const short = fullName.includes('.')
    ? fullName.slice(fullName.lastIndexOf('.') + 1)
    : fullName;
  try {
    const found = root.lookupType(short);
    return found ?? null;
  } catch {
    return null;
  }
}

/** Swagger-like sample value for a single field (scalars / enum). */
export function stubValueForField(field: FieldSchema): unknown {
  if (field.enumValues?.length) {
    return field.enumValues[0];
  }
  switch (field.type) {
    case 'string':
    case 'bytes':
      return 'string';
    case 'bool':
      return true;
    case 'double':
    case 'float':
    case 'int32':
    case 'int64':
    case 'uint32':
    case 'uint64':
    case 'sint32':
    case 'sint64':
    case 'fixed32':
    case 'fixed64':
    case 'sfixed32':
    case 'sfixed64':
      return 0;
    default:
      return {};
  }
}

/**
 * Build a Swagger-style JSON example from message fields:
 * string → `"string"`, number → `0`, bool → `true`, enum → first value,
 * repeated → one-element array with that sample.
 */
export function stubFromMessageSchema(
  schema?: MessageSchema,
): Record<string, unknown> {
  if (!schema) {
    return {};
  }
  const stub: Record<string, unknown> = {};
  for (const field of schema.fields) {
    const sample = stubValueForField(field);
    stub[field.name] = field.repeated ? [sample] : sample;
  }
  return stub;
}

function formatProtoCommentLines(description: string, indent: string): string[] {
  return description.split(/\r?\n/).map(line => `${indent}// ${line}`);
}

export function formatMessageSchema(schema?: MessageSchema): string {
  if (!schema) {
    return '// Request schema unavailable';
  }
  const shortName = schema.name.split('.').pop();
  const lines: string[] = [];
  if (schema.description) {
    lines.push(...formatProtoCommentLines(schema.description, ''));
  }
  lines.push(`message ${shortName} {`);
  for (const field of schema.fields) {
    if (field.description) {
      lines.push(...formatProtoCommentLines(field.description, '  '));
    }
    const prefix = field.repeated ? 'repeated ' : '';
    lines.push(`  ${prefix}${field.type} ${field.name} = ${field.id};`);
  }
  lines.push('}');
  return lines.join('\n');
}
