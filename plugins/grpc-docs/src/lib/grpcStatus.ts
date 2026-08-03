/** Canonical gRPC status codes (google.rpc.Code). */
export const GRPC_STATUS_CODES: Record<string, number> = {
  OK: 0,
  CANCELLED: 1,
  UNKNOWN: 2,
  INVALID_ARGUMENT: 3,
  DEADLINE_EXCEEDED: 4,
  NOT_FOUND: 5,
  ALREADY_EXISTS: 6,
  PERMISSION_DENIED: 7,
  RESOURCE_EXHAUSTED: 8,
  FAILED_PRECONDITION: 9,
  ABORTED: 10,
  OUT_OF_RANGE: 11,
  UNIMPLEMENTED: 12,
  INTERNAL: 13,
  UNAVAILABLE: 14,
  DATA_LOSS: 15,
  UNAUTHENTICATED: 16,
};

const CODE_TO_NAME = Object.fromEntries(
  Object.entries(GRPC_STATUS_CODES).map(([name, code]) => [code, name]),
) as Record<number, string>;

export function formatGrpcStatus(code: string | number): string {
  if (typeof code === 'number') {
    const name = CODE_TO_NAME[code];
    return name ? `${name} (${code})` : String(code);
  }
  const trimmed = code.trim().toUpperCase();
  const numeric = GRPC_STATUS_CODES[trimmed];
  if (numeric !== undefined) {
    return `${trimmed} (${numeric})`;
  }
  return code;
}

/** Default `google.rpc.Status` shape shown when no errorExamples are annotated. */
export function defaultGrpcErrorExample(): Record<string, unknown> {
  return {
    code: 3,
    message: 'INVALID_ARGUMENT: name must not be empty',
    details: [
      {
        '@type': 'type.googleapis.com/google.rpc.BadRequest',
        fieldViolations: [
          {
            field: 'name',
            description: 'must not be empty',
          },
        ],
      },
    ],
  };
}
