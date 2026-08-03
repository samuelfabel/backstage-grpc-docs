import { useMemo, useState } from 'react';
import Typography from '@material-ui/core/Typography';
import { WarningPanel } from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  GRPC_DOCS_ENVIRONMENTS_ANNOTATION,
  GRPC_DOCS_OPERATIONS_ANNOTATION,
  parseEnvironments,
  parseOperations,
} from '@backstage-community/plugin-grpc-docs-common';
import { parseDescriptorFromProto } from '../lib/protoSchema';
import { resolveEnvironment } from '../lib/resolveTarget';
import { MethodAccordion } from './MethodAccordion';
import { PlaygroundMenu } from './PlaygroundMenu';

export interface GrpcDocsWidgetProps {
  /** Proto source from `spec.definition`. */
  definition: string;
}

/**
 * Swagger-style playground widget for `spec.type: grpc`.
 * Methods come from the local proto definition (like OpenAPI paths), not reflection.
 */
export function GrpcDocsWidget(props: GrpcDocsWidgetProps) {
  const { definition } = props;
  const { entity } = useEntity();

  const environments = useMemo(
    () =>
      parseEnvironments(
        entity.metadata.annotations?.[GRPC_DOCS_ENVIRONMENTS_ANNOTATION],
      ),
    [entity.metadata.annotations],
  );

  const operations = useMemo(
    () =>
      parseOperations(
        entity.metadata.annotations?.[GRPC_DOCS_OPERATIONS_ANNOTATION],
      ),
    [entity.metadata.annotations],
  );

  const tree = useMemo(
    () => parseDescriptorFromProto(definition),
    [definition],
  );

  const [envName, setEnvName] = useState(() => environments[0]?.name ?? '');
  const [customTarget, setCustomTarget] = useState('');

  const resolved = resolveEnvironment({
    environments,
    selectedName: envName,
    customTarget,
  });

  const parseFailed = Boolean(definition.trim()) && tree.services.length === 0;

  const envLabel =
    resolved.name != null
      ? `${resolved.name} · ${resolved.target}`
      : resolved.target || 'no target';

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        <Typography
          variant="caption"
          color="textSecondary"
          style={{ fontFamily: 'monospace' }}
          data-testid="grpc-docs-active-environment"
        >
          {envLabel}
          {resolved.security ? ` · ${resolved.security}` : ''}
        </Typography>
        <PlaygroundMenu
          definition={definition}
          environments={environments}
          selectedName={envName}
          onSelectName={setEnvName}
          customTarget={customTarget}
          onCustomTargetChange={setCustomTarget}
        />
      </div>

      {parseFailed && (
        <WarningPanel title="grpc-docs" severity="warning">
          Could not parse services from the proto definition.
        </WarningPanel>
      )}

      {tree.services.length > 0 && (
        <MethodAccordion
          tree={tree}
          definition={definition}
          operations={operations}
          target={resolved.target}
          security={resolved.security}
        />
      )}
    </div>
  );
}
