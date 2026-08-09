import { useMemo, useState } from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import Typography from '@material-ui/core/Typography';
import type {
  GrpcErrorExample,
  GrpcExample,
  MethodDescriptor,
} from '@samuel.fabel/plugin-grpc-docs-common';
import {
  formatMessageSchema,
  getMessageSchema,
  stubFromMessageSchema,
} from '../lib/protoSchema';
import {
  defaultGrpcErrorExample,
  formatGrpcStatus,
} from '../lib/grpcStatus';
import { CodePreview } from './CodePreview';
import { ExamplesSelect } from './ExamplesSelect';

export interface MethodDocsProps {
  method: MethodDescriptor;
  definition: string;
  examples: GrpcExample[];
  errorExamples: GrpcErrorExample[];
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/**
 * Swagger-like Example Value / Schema docs for request, success, and gRPC errors.
 */
export function MethodDocs(props: MethodDocsProps) {
  const { method, definition, examples, errorExamples } = props;
  const [exampleName, setExampleName] = useState(examples[0]?.name ?? '');
  const [requestTab, setRequestTab] = useState(0);
  const [responseTab, setResponseTab] = useState(0);

  const requestSchema = useMemo(
    () => getMessageSchema(definition, method.requestType),
    [definition, method.requestType],
  );
  const responseSchema = useMemo(
    () => getMessageSchema(definition, method.responseType),
    [definition, method.responseType],
  );

  const selectedExample =
    examples.find(item => item.name === exampleName) ?? examples[0];

  const requestExample = selectedExample
    ? selectedExample.value
    : stubFromMessageSchema(requestSchema);

  const responseExample =
    selectedExample?.response ?? stubFromMessageSchema(responseSchema);

  const errors: GrpcErrorExample[] =
    errorExamples.length > 0
      ? errorExamples
      : [
          {
            name: 'invalid-argument',
            code: 'INVALID_ARGUMENT',
            summary: 'google.rpc.Status (default shape)',
            value: defaultGrpcErrorExample(),
          },
        ];

  return (
    <div style={{ display: 'grid', gap: 16 }} data-testid="grpc-docs-method-docs">
      <div>
        <Typography variant="subtitle2">Request body</Typography>
        <Typography variant="caption" color="textSecondary" display="block">
          {method.requestType || 'unknown'}
        </Typography>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <Tabs
            value={requestTab}
            onChange={(_, value) => setRequestTab(Number(value))}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Example Value" />
            <Tab label="Schema" />
          </Tabs>
          {requestTab === 0 && (
            <ExamplesSelect
              examples={examples}
              selectedName={selectedExample?.name ?? ''}
              onSelect={setExampleName}
            />
          )}
        </div>
        {requestTab === 0 ? (
          <CodePreview text={pretty(requestExample)} language="json" />
        ) : (
          <CodePreview
            text={formatMessageSchema(requestSchema)}
            language="protobuf"
          />
        )}
      </div>

      <div>
        <Typography variant="subtitle2">Responses</Typography>
        <Typography variant="body2" style={{ marginTop: 8, fontWeight: 500 }}>
          OK (0)
        </Typography>
        <Typography variant="caption" color="textSecondary" display="block">
          {method.responseType || 'unknown'}
        </Typography>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <Tabs
            value={responseTab}
            onChange={(_, value) => setResponseTab(Number(value))}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="Example Value" />
            <Tab label="Schema" />
          </Tabs>
          {responseTab === 0 && (
            <ExamplesSelect
              examples={examples}
              selectedName={selectedExample?.name ?? ''}
              onSelect={setExampleName}
            />
          )}
        </div>
        {responseTab === 0 ? (
          <CodePreview text={pretty(responseExample)} language="json" />
        ) : (
          <CodePreview
            text={formatMessageSchema(responseSchema)}
            language="protobuf"
          />
        )}

        {errors.map(error => (
          <div key={error.name} style={{ marginTop: 16 }}>
            <Typography variant="body2" style={{ fontWeight: 500 }}>
              {formatGrpcStatus(error.code)}
              {error.summary ? ` — ${error.summary}` : ''}
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block">
              {error.name} · google.rpc.Status
            </Typography>
            <CodePreview text={pretty(error.value)} language="json" />
          </div>
        ))}
      </div>
    </div>
  );
}
