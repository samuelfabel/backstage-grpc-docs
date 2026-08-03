export interface MetadataRow {
  id: string;
  key: string;
  value: string;
}

let rowCounter = 0;

export function createMetadataRow(
  key = '',
  value = '',
): MetadataRow {
  rowCounter += 1;
  return {
    id: `meta-${rowCounter}`,
    key,
    value,
  };
}

/**
 * Convert editor rows into gRPC metadata. Empty keys are skipped.
 * Duplicate keys become `string[]` (order preserved).
 */
export function rowsToMetadata(
  rows: MetadataRow[],
): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};

  for (const row of rows) {
    const key = row.key.trim();
    if (!key) {
      continue;
    }

    const existing = result[key];
    if (existing === undefined) {
      result[key] = row.value;
    } else if (Array.isArray(existing)) {
      existing.push(row.value);
    } else {
      result[key] = [existing, row.value];
    }
  }

  return result;
}
