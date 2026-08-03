import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import { createMetadataRow, type MetadataRow } from '../lib/metadataRows';

export interface MetadataEditorProps {
  rows: MetadataRow[];
  onChange: (rows: MetadataRow[]) => void;
  /** Section title. Defaults to "Additional headers". */
  title?: string;
}

/**
 * Free-form key/value editor for gRPC metadata (headers beyond the annotated ones).
 */
export function MetadataEditor(props: MetadataEditorProps) {
  const { rows, onChange, title = 'Additional headers' } = props;

  const updateRow = (id: string, patch: Partial<MetadataRow>) => {
    onChange(rows.map(row => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeRow = (id: string) => {
    onChange(rows.filter(row => row.id !== id));
  };

  return (
    <div style={{ display: 'grid', gap: 8 }} data-testid="grpc-docs-metadata-editor">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Typography variant="subtitle2">{title}</Typography>
          <Tooltip title="Optional — add any metadata key not listed above.">
            <InfoOutlinedIcon
              fontSize="small"
              color="action"
              style={{ cursor: 'help' }}
              aria-label="Additional headers help"
            />
          </Tooltip>
        </div>
        <IconButton
          size="small"
          onClick={() => onChange([...rows, createMetadataRow()])}
          aria-label="Add header"
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </div>

      {rows.map(row => (
        <div
          key={row.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr auto',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            variant="outlined"
            value={row.key}
            onChange={e => updateRow(row.id, { key: e.target.value })}
            placeholder="key"
            inputProps={{ 'aria-label': 'metadata key' }}
          />
          <TextField
            size="small"
            variant="outlined"
            value={row.value}
            onChange={e => updateRow(row.id, { value: e.target.value })}
            placeholder="value"
            inputProps={{ 'aria-label': 'metadata value' }}
          />
          <IconButton
            size="small"
            onClick={() => removeRow(row.id)}
            aria-label={`Remove metadata ${row.key || 'row'}`}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </div>
      ))}
    </div>
  );
}
