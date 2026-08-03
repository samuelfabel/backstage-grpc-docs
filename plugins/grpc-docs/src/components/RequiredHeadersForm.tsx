import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import type { GrpcHeaderSpec } from '@samuelfabel/plugin-grpc-docs-common';

export interface RequiredHeadersFormProps {
  headers: GrpcHeaderSpec[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

export function RequiredHeadersForm(props: RequiredHeadersFormProps) {
  const { headers, values, onChange } = props;
  if (headers.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }} data-testid="grpc-docs-headers">
      <Typography variant="subtitle2">Headers</Typography>
      {headers.map(header => {
        const value = values[header.name] ?? header.default ?? '';
        const hasEnum = Boolean(header.enum?.length);
        return (
          <TextField
            key={header.name}
            label={`${header.name}${header.required ? ' *' : ''}`}
            value={value}
            select={hasEnum}
            size="small"
            variant="outlined"
            fullWidth
            helperText={header.type ? `type: ${header.type}` : undefined}
            onChange={event =>
              onChange({ ...values, [header.name]: event.target.value })
            }
          >
            {hasEnum &&
              header.enum!.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
          </TextField>
        );
      })}
    </div>
  );
}

export function headersToMetadata(
  specs: GrpcHeaderSpec[],
  values: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const spec of specs) {
    const value = (values[spec.name] ?? spec.default ?? '').trim();
    if (value) {
      result[spec.name] = value;
    }
  }
  return result;
}
