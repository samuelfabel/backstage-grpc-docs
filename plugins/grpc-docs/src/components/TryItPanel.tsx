import { useCallback, useMemo, useRef, useState } from 'react';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { useTheme } from '@material-ui/core/styles';
import { Progress, WarningPanel } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import type {
  ChannelSecurity,
  GrpcOperation,
  MethodDescriptor,
} from '@samuel.fabel/plugin-grpc-docs-common';
import { GrpcDocsApiError, grpcDocsApiRef } from '../api/GrpcDocsApi';
import { formatGrpcStatus } from '../lib/grpcStatus';
import { rowsToMetadata, type MetadataRow } from '../lib/metadataRows';
import {
  formatMessageSchema,
  getMessageSchema,
  stubFromMessageSchema,
} from '../lib/protoSchema';
import { CodePreview } from './CodePreview';
import { ExamplesSelect } from './ExamplesSelect';
import { beautifyJson, JsonEditor } from './JsonEditor';
import { MetadataEditor } from './MetadataEditor';
import { MethodDocs } from './MethodDocs';
import {
  headersToMetadata,
  RequiredHeadersForm,
} from './RequiredHeadersForm';

export interface TryItPanelProps {
  service: string;
  method: MethodDescriptor;
  definition: string;
  operation?: GrpcOperation;
  target: string;
  security: ChannelSecurity;
}

interface CallResult {
  ok: boolean;
  statusLabel: string;
  body: string;
}

function isUnary(method: MethodDescriptor): boolean {
  return !method.requestStream && !method.responseStream;
}

function errorToCallResult(error: unknown): CallResult {
  if (error instanceof GrpcDocsApiError) {
    const code =
      typeof error.body.code === 'string' || typeof error.body.code === 'number'
        ? error.body.code
        : 'UNKNOWN';
    return {
      ok: false,
      statusLabel: formatGrpcStatus(code),
      body: JSON.stringify(error.body, null, 2),
    };
  }
  const message = error instanceof Error ? error.message : String(error);
  return {
    ok: false,
    statusLabel: formatGrpcStatus('UNKNOWN'),
    body: JSON.stringify({ code: 'UNKNOWN', message, details: [] }, null, 2),
  };
}

export function TryItPanel(props: TryItPanelProps) {
  const { service, method, definition, operation, target, security } = props;
  const grpcDocsApi = useApi(grpcDocsApiRef);
  const theme = useTheme();
  const abortRef = useRef<AbortController | null>(null);

  const examples = useMemo(
    () => operation?.examples ?? [],
    [operation?.examples],
  );
  const errorExamples = useMemo(
    () => operation?.errorExamples ?? [],
    [operation?.errorExamples],
  );
  const headerSpecs = operation?.headers ?? [];
  const requestSchema = useMemo(
    () => getMessageSchema(definition, method.requestType),
    [definition, method.requestType],
  );

  const defaultPayload = useMemo(() => {
    if (examples[0]) {
      return JSON.stringify(examples[0].value, null, 2);
    }
    return JSON.stringify(stubFromMessageSchema(requestSchema), null, 2);
  }, [examples, requestSchema]);

  const [trying, setTrying] = useState(false);
  const [exampleName, setExampleName] = useState(examples[0]?.name ?? '');
  const [payloadText, setPayloadText] = useState(defaultPayload);
  const [baseline, setBaseline] = useState(defaultPayload);
  const [headerValues, setHeaderValues] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      for (const header of headerSpecs) {
        initial[header.name] = header.default ?? header.enum?.[0] ?? '';
      }
      return initial;
    },
  );
  const [extraHeaders, setExtraHeaders] = useState<MetadataRow[]>([]);
  const [showSchema, setShowSchema] = useState(false);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const [callResult, setCallResult] = useState<CallResult | null>(null);
  const [calling, setCalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [beautifyError, setBeautifyError] = useState<string | null>(null);

  const applyExample = useCallback(
    (name: string) => {
      const example = examples.find(item => item.name === name) ?? examples[0];
      if (!example) {
        return;
      }
      const text = JSON.stringify(example.value, null, 2);
      setExampleName(example.name);
      setPayloadText(text);
      setBaseline(text);
      setBeautifyError(null);
    },
    [examples],
  );

  const onTryIt = () => {
    setTrying(true);
    setError(null);
    setCallResult(null);
    if (examples.length > 0) {
      applyExample(exampleName || examples[0].name);
    } else {
      setPayloadText(defaultPayload);
      setBaseline(defaultPayload);
    }
  };

  const exitTryIt = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setCalling(false);
    setTrying(false);
    setError(null);
    setCallResult(null);
  };

  const onBeautify = () => {
    try {
      setPayloadText(beautifyJson(payloadText));
      setBeautifyError(null);
    } catch (e) {
      setBeautifyError(e instanceof Error ? e.message : String(e));
    }
  };

  const onReset = () => {
    setPayloadText(baseline);
    setBeautifyError(null);
    setError(null);
  };

  const onCancelRequest = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setCalling(false);
  };

  const onExecute = async () => {
    if (!isUnary(method)) {
      setError('Streaming methods are not supported yet');
      return;
    }
    if (syntaxError) {
      setError(`Fix request body before execute: ${syntaxError}`);
      return;
    }
    for (const header of headerSpecs) {
      if (header.required) {
        const value = (headerValues[header.name] ?? '').trim();
        if (!value) {
          setError(`Missing required header: ${header.name}`);
          return;
        }
      }
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(payloadText) as Record<string, unknown>;
      if (
        typeof payload !== 'object' ||
        payload === null ||
        Array.isArray(payload)
      ) {
        throw new Error('Payload must be a JSON object');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setCalling(true);
    setError(null);
    setCallResult(null);
    try {
      const result = await grpcDocsApi.callUnary(
        {
          target,
          service,
          method: method.name,
          payload,
          security,
          metadata: {
            ...headersToMetadata(headerSpecs, headerValues),
            ...rowsToMetadata(extraHeaders),
          },
        },
        { signal: controller.signal },
      );
      setCallResult({
        ok: true,
        statusLabel: formatGrpcStatus('OK'),
        body: JSON.stringify(result.payload, null, 2),
      });
    } catch (e) {
      if (controller.signal.aborted) {
        setCallResult({
          ok: false,
          statusLabel: formatGrpcStatus('CANCELLED'),
          body: JSON.stringify(
            {
              code: 'CANCELLED',
              message: 'Request cancelled',
              details: [],
            },
            null,
            2,
          ),
        });
      } else {
        setCallResult(errorToCallResult(e));
      }
    } finally {
      setCalling(false);
      abortRef.current = null;
    }
  };

  if (!trying) {
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            color="primary"
            variant="outlined"
            size="small"
            onClick={onTryIt}
            disabled={!isUnary(method)}
          >
            Try it out
          </Button>
          {!isUnary(method) && (
            <Typography variant="caption" color="textSecondary">
              Streaming support comes in later phases
            </Typography>
          )}
        </div>
        <MethodDocs
          method={method}
          definition={definition}
          examples={examples}
          errorExamples={errorExamples}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <Button
          size="small"
          variant="outlined"
          onClick={onReset}
          disabled={calling}
        >
          Reset
        </Button>
        {!calling && (
          <Button
            size="small"
            color="primary"
            variant="contained"
            onClick={() => void onExecute()}
            disabled={!target}
          >
            Execute
          </Button>
        )}
        {/* Swagger-style: Try it out toggles to Cancel (exit). During request, Cancel aborts. */}
        <Button
          size="small"
          variant="outlined"
          onClick={calling ? onCancelRequest : exitTryIt}
          style={{
            color: theme.palette.error.main,
            borderColor: theme.palette.error.main,
          }}
        >
          Cancel
        </Button>
      </div>

      {beautifyError && (
        <WarningPanel title="Beautify" severity="warning">
          {beautifyError}
        </WarningPanel>
      )}

      <RequiredHeadersForm
        headers={headerSpecs}
        values={headerValues}
        onChange={setHeaderValues}
      />

      <MetadataEditor
        rows={extraHeaders}
        onChange={setExtraHeaders}
        title={headerSpecs.length > 0 ? 'Additional headers' : 'Headers'}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Typography variant="subtitle2">Request body</Typography>
          <ExamplesSelect
            examples={examples}
            selectedName={exampleName}
            onSelect={applyExample}
          />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <Button
            size="small"
            color="primary"
            variant={showSchema ? 'contained' : 'text'}
            aria-pressed={showSchema}
            onClick={() => setShowSchema(value => !value)}
          >
            Schema
          </Button>
          <Button size="small" color="primary" onClick={onBeautify}>
            Beautify
          </Button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showSchema ? '1fr 1fr' : '1fr',
          gap: 12,
          alignItems: 'stretch',
        }}
      >
        <JsonEditor
          value={payloadText}
          onChange={setPayloadText}
          onSyntaxErrorChange={setSyntaxError}
          completionFields={requestSchema?.fields.map(field => field.name)}
        />
        {showSchema && (
          <div data-testid="grpc-docs-request-schema">
            <CodePreview
              text={formatMessageSchema(requestSchema)}
              language="protobuf"
              minHeight={220}
            />
          </div>
        )}
      </div>

      {calling && <Progress />}
      {error && (
        <WarningPanel title="Execute" severity="error">
          {error}
        </WarningPanel>
      )}

      {callResult && (
        <div data-testid="grpc-docs-server-response">
          <Typography variant="subtitle2">Server response</Typography>
          <div
            style={{
              marginTop: 8,
              padding: '8px 12px',
              borderRadius: 4,
              border: `1px solid ${
                callResult.ok
                  ? theme.palette.success.main
                  : theme.palette.error.main
              }`,
              backgroundColor: callResult.ok
                ? 'rgba(76, 175, 80, 0.08)'
                : 'rgba(244, 67, 54, 0.08)',
            }}
          >
            <Typography
              variant="body2"
              style={{
                fontWeight: 600,
                color: callResult.ok
                  ? theme.palette.success.main
                  : theme.palette.error.main,
              }}
            >
              {callResult.statusLabel}
            </Typography>
            {!callResult.ok && (
              <Typography
                variant="caption"
                color="textSecondary"
                display="block"
                style={{ marginTop: 4 }}
              >
                Call failed — details below (google.rpc.Status shape)
              </Typography>
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            <CodePreview text={callResult.body} language="json" />
          </div>
        </div>
      )}
    </div>
  );
}
