import { useEffect, useMemo, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import {
  autocompletion,
  completionKeymap,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter, type Diagnostic } from '@codemirror/lint';
import { keymap, type EditorView } from '@codemirror/view';
import { useTheme } from '@material-ui/core/styles';
import { jsonEditorTheme } from '../lib/jsonEditorTheme';

export interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  minHeight?: number;
  onSyntaxErrorChange?: (error: string | null) => void;
  /** Proto field names offered as property completions + unknown-field lint. */
  completionFields?: string[];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findKeyRange(doc: string, key: string): { from: number; to: number } | null {
  const re = new RegExp(`"${escapeRegExp(key)}"\\s*:`);
  const match = re.exec(doc);
  if (!match) {
    return null;
  }
  return { from: match.index, to: match.index + key.length + 2 };
}

/** Flag root-level JSON keys that are not in the proto request schema. */
export function unknownFieldDiagnostics(
  doc: string,
  knownFields: string[],
): Diagnostic[] {
  if (knownFields.length === 0 || !doc.trim()) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(doc);
  } catch {
    return [];
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    return [];
  }

  const known = new Set(knownFields);
  const diagnostics: Diagnostic[] = [];

  for (const key of Object.keys(parsed as Record<string, unknown>)) {
    if (known.has(key)) {
      continue;
    }
    const range = findKeyRange(doc, key);
    if (!range) {
      continue;
    }
    diagnostics.push({
      from: range.from,
      to: range.to,
      severity: 'error',
      message: `Unknown field "${key}" — not in request schema`,
    });
  }

  return diagnostics;
}

function createFieldCompletions(fields: string[]) {
  return (context: CompletionContext): CompletionResult | null => {
    if (fields.length === 0) {
      return null;
    }

    const lookBehind = context.state.sliceDoc(
      Math.max(0, context.pos - 120),
      context.pos,
    );
    const inKeyPosition = /(?:\{|,)\s*"?[\w]*$/.test(lookBehind);
    if (!inKeyPosition && !context.explicit) {
      return null;
    }

    const match = context.matchBefore(/"[\w]*/);
    const bare = match ? null : context.matchBefore(/[\w]+/);
    const from = match?.from ?? bare?.from ?? context.pos;
    const alreadyQuoted = Boolean(match);

    return {
      from,
      options: fields.map(name => ({
        label: name,
        type: 'property' as const,
        detail: 'proto field',
        apply: alreadyQuoted ? `${name}"` : `"${name}"`,
        boost: 99,
      })),
      validFor: /^"?[\w]*"?$/,
    };
  };
}

function createCombinedLinter(
  fields: string[],
  onError: (message: string | null) => void,
) {
  const parseLinter = jsonParseLinter();
  return (view: EditorView): Diagnostic[] => {
    const parseDiagnostics = parseLinter(view);
    if (parseDiagnostics.length > 0) {
      onError(parseDiagnostics[0]?.message ?? 'Invalid JSON');
      return parseDiagnostics;
    }

    const schemaDiagnostics = unknownFieldDiagnostics(
      view.state.doc.toString(),
      fields,
    );
    onError(schemaDiagnostics[0]?.message ?? null);
    return schemaDiagnostics;
  };
}

export function JsonEditor(props: JsonEditorProps) {
  const {
    value,
    onChange,
    readOnly = false,
    minHeight = 220,
    onSyntaxErrorChange,
    completionFields = [],
  } = props;
  const theme = useTheme();
  const dark = theme.palette.type === 'dark';
  const onSyntaxErrorChangeRef = useRef(onSyntaxErrorChange);

  useEffect(() => {
    onSyntaxErrorChangeRef.current = onSyntaxErrorChange;
  }, [onSyntaxErrorChange]);

  const fieldsKey = completionFields.join('\0');

  const extensions = useMemo(() => {
    const fields = fieldsKey ? fieldsKey.split('\0') : [];
    const fieldCompletions = createFieldCompletions(fields);

    return [
      json(),
      linter(
        createCombinedLinter(fields, message => {
          onSyntaxErrorChangeRef.current?.(message);
        }),
        { delay: 300 },
      ),
      autocompletion({
        override: [fieldCompletions],
        activateOnTyping: true,
        icons: true,
        defaultKeymap: true,
      }),
      keymap.of(completionKeymap),
    ];
  }, [fieldsKey]);

  const editorTheme = useMemo(() => jsonEditorTheme(dark), [dark]);

  return (
    <div
      data-testid="grpc-docs-json-editor"
      style={{
        border: `1px solid ${dark ? '#3c3c3c' : '#e5e5e5'}`,
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <CodeMirror
        value={value}
        height={`${minHeight}px`}
        theme={editorTheme}
        extensions={extensions}
        editable={!readOnly}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: !readOnly,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
        }}
        onChange={readOnly ? undefined : onChange}
      />
    </div>
  );
}

export function beautifyJson(text: string): string {
  return JSON.stringify(JSON.parse(text), null, 2);
}
