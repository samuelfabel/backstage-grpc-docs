import { createMetadataRow, rowsToMetadata } from './metadataRows';

describe('rowsToMetadata', () => {
  it('skips empty keys and keeps values as-is', () => {
    const rows = [
      createMetadataRow('authorization', 'Bearer t'),
      createMetadataRow('  ', 'ignored'),
      createMetadataRow('x-request-id', 'abc'),
    ];
    expect(rowsToMetadata(rows)).toEqual({
      authorization: 'Bearer t',
      'x-request-id': 'abc',
    });
  });

  it('aggregates duplicate keys into arrays', () => {
    const rows = [
      createMetadataRow('x-custom', 'one'),
      createMetadataRow('x-custom', 'two'),
      createMetadataRow('x-custom', 'three'),
    ];
    expect(rowsToMetadata(rows)).toEqual({
      'x-custom': ['one', 'two', 'three'],
    });
  });
});
