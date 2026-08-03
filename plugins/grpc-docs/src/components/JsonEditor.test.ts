import { unknownFieldDiagnostics } from './JsonEditor';

describe('unknownFieldDiagnostics', () => {
  it('flags keys that are not in the schema', () => {
    const doc = '{\n  "name": "world",\n  "tralala": true\n}';
    const diagnostics = unknownFieldDiagnostics(doc, ['name']);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.message).toContain('tralala');
    expect(doc.slice(diagnostics[0]!.from, diagnostics[0]!.to)).toBe(
      '"tralala"',
    );
  });

  it('returns empty when all keys are known', () => {
    expect(
      unknownFieldDiagnostics('{ "name": "world" }', ['name']),
    ).toEqual([]);
  });

  it('skips invalid JSON', () => {
    expect(unknownFieldDiagnostics('{', ['name'])).toEqual([]);
  });
});
