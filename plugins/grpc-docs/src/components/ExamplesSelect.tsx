import { useState } from 'react';
import Button from '@material-ui/core/Button';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import type { GrpcExample } from '@samuel.fabel/plugin-grpc-docs-common';

export interface ExamplesSelectProps {
  examples: GrpcExample[];
  selectedName: string;
  onSelect: (name: string) => void;
}

function exampleLabel(example: GrpcExample): string {
  return example.summary
    ? `${example.name} — ${example.summary}`
    : example.name;
}

/**
 * Compact examples menu (Swagger-style), meant next to Example Value tabs.
 */
export function ExamplesSelect(props: ExamplesSelectProps) {
  const { examples, selectedName, onSelect } = props;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  if (examples.length <= 1) {
    return null;
  }

  const selected =
    examples.find(example => example.name === selectedName) ?? examples[0];

  return (
    <div data-testid="grpc-docs-examples-select">
      <Button
        size="small"
        endIcon={<ArrowDropDownIcon />}
        onClick={event => setAnchorEl(event.currentTarget)}
        aria-haspopup="menu"
        style={{ textTransform: 'none', maxWidth: 280 }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {selected ? exampleLabel(selected) : 'Examples'}
        </span>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        keepMounted
      >
        {examples.map(example => (
          <MenuItem
            key={example.name}
            selected={example.name === selected?.name}
            onClick={() => {
              onSelect(example.name);
              setAnchorEl(null);
            }}
          >
            {exampleLabel(example)}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}
