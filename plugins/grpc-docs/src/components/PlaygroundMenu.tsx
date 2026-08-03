import { useState, type ReactNode } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import CloseIcon from '@material-ui/icons/Close';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import type { GrpcEnvironment } from '@backstage-community/plugin-grpc-docs-common';
import { CodePreview } from './CodePreview';
import { EnvironmentSelector } from './EnvironmentSelector';

export interface PlaygroundMenuProps {
  definition: string;
  environments: GrpcEnvironment[];
  selectedName: string;
  onSelectName: (name: string) => void;
  customTarget: string;
  onCustomTargetChange: (target: string) => void;
}

function ClosableDialogTitle(props: {
  children: ReactNode;
  onClose: () => void;
}) {
  const { children, onClose } = props;
  return (
    <DialogTitle
      disableTypography
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}
    >
      <span style={{ fontSize: '1.25rem', fontWeight: 500 }}>{children}</span>
      <IconButton
        aria-label="Close"
        size="small"
        onClick={onClose}
        data-testid="grpc-docs-dialog-close"
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </DialogTitle>
  );
}

/**
 * Overflow menu: Environment + View definition (Swagger-style ⋮).
 */
export function PlaygroundMenu(props: PlaygroundMenuProps) {
  const {
    definition,
    environments,
    selectedName,
    onSelectName,
    customTarget,
    onCustomTargetChange,
  } = props;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [definitionOpen, setDefinitionOpen] = useState(false);
  const [environmentOpen, setEnvironmentOpen] = useState(false);

  return (
    <>
      <IconButton
        aria-label="More actions"
        size="small"
        onClick={event => setAnchorEl(event.currentTarget)}
        data-testid="grpc-docs-playground-menu"
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        keepMounted
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setEnvironmentOpen(true);
          }}
        >
          Environment
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            setDefinitionOpen(true);
          }}
        >
          View definition
        </MenuItem>
      </Menu>

      <Dialog
        open={environmentOpen}
        onClose={() => setEnvironmentOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <ClosableDialogTitle onClose={() => setEnvironmentOpen(false)}>
          Environment
        </ClosableDialogTitle>
        <DialogContent style={{ paddingBottom: 24 }}>
          <EnvironmentSelector
            environments={environments}
            selectedName={selectedName}
            onSelectName={onSelectName}
            customTarget={customTarget}
            onCustomTargetChange={onCustomTargetChange}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={definitionOpen}
        onClose={() => setDefinitionOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <ClosableDialogTitle onClose={() => setDefinitionOpen(false)}>
          Proto definition
        </ClosableDialogTitle>
        <DialogContent>
          <CodePreview text={definition} language="protobuf" />
        </DialogContent>
      </Dialog>
    </>
  );
}
