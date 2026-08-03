import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import type { GrpcEnvironment } from '@backstage-community/plugin-grpc-docs-common';

export interface EnvironmentSelectorProps {
  environments: GrpcEnvironment[];
  /** Selected environment name when using annotation list. */
  selectedName: string;
  onSelectName: (name: string) => void;
  /** Free-form target when no environments are declared. */
  customTarget: string;
  onCustomTargetChange: (target: string) => void;
}

/**
 * Compact environment picker backed by `grpc-docs.io/environments`.
 * Falls back to a host:port input when the annotation is absent.
 */
export function EnvironmentSelector(props: EnvironmentSelectorProps) {
  const {
    environments,
    selectedName,
    onSelectName,
    customTarget,
    onCustomTargetChange,
  } = props;

  if (environments.length === 0) {
    return (
      <label style={{ display: 'grid', gap: 4, maxWidth: 280 }}>
        <span style={{ fontSize: 12 }}>Target (host:port)</span>
        <input
          value={customTarget}
          onChange={e => onCustomTargetChange(e.target.value)}
          placeholder="127.0.0.1:50051"
          style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 13 }}
          data-testid="grpc-docs-custom-target"
        />
      </label>
    );
  }

  const selected =
    environments.find(env => env.name === selectedName) ?? environments[0];

  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <FormControl
        size="small"
        variant="outlined"
        style={{ minWidth: 160, maxWidth: 240 }}
        data-testid="grpc-docs-environment-select"
      >
        <InputLabel id="grpc-docs-environment-label">Environment</InputLabel>
        <Select
          labelId="grpc-docs-environment-label"
          label="Environment"
          value={selected?.name ?? ''}
          onChange={event => onSelectName(String(event.target.value))}
        >
          {environments.map(env => (
            <MenuItem key={env.name} value={env.name}>
              {env.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {selected && (
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: 12,
            opacity: 0.75,
          }}
          data-testid="grpc-docs-environment-target"
        >
          {selected.target}
          {selected.security ? ` · ${selected.security}` : ''}
        </div>
      )}
    </div>
  );
}
