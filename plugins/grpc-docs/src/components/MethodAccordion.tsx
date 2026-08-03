import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Chip from '@material-ui/core/Chip';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import type {
  ChannelSecurity,
  DescriptorTree,
  GrpcOperation,
  MethodDescriptor,
} from '@backstage-community/plugin-grpc-docs-common';
import { findOperation } from '@backstage-community/plugin-grpc-docs-common';
import { TryItPanel } from './TryItPanel';

export interface MethodAccordionProps {
  tree: DescriptorTree;
  definition: string;
  operations: GrpcOperation[];
  target: string;
  security: ChannelSecurity;
}

function methodBadges(method: MethodDescriptor) {
  const badges: string[] = [];
  if (method.requestStream) {
    badges.push('client-stream');
  }
  if (method.responseStream) {
    badges.push('server-stream');
  }
  if (!method.requestStream && !method.responseStream) {
    badges.push('unary');
  }
  return badges;
}

export function MethodAccordion(props: MethodAccordionProps) {
  const { tree, definition, operations, target, security } = props;

  return (
    <div data-testid="grpc-docs-method-accordion">
      {tree.services.map(service => (
        <div key={service.name} style={{ marginBottom: 16 }}>
          <Typography variant="h6" style={{ marginBottom: 4 }}>
            {service.name}
          </Typography>
          {service.description && (
            <Typography
              variant="body2"
              color="textSecondary"
              style={{ marginBottom: 8 }}
            >
              {service.description}
            </Typography>
          )}
          {service.methods.map(method => {
            const operation = findOperation(
              operations,
              service.name,
              method.name,
            );
            return (
              <Accordion
                key={`${service.name}/${method.name}`}
                defaultExpanded={false}
                style={{ marginBottom: 8 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                      width: '100%',
                      paddingRight: 8,
                    }}
                  >
                    <Typography style={{ fontFamily: 'monospace' }}>
                      {method.name}
                    </Typography>
                    {methodBadges(method).map(badge => (
                      <Chip key={badge} size="small" label={badge} />
                    ))}
                    <Typography variant="caption" color="textSecondary">
                      {method.requestType || '?'} → {method.responseType || '?'}
                    </Typography>
                    {method.description && (
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        style={{ flex: 1, minWidth: 120 }}
                      >
                        {method.description}
                      </Typography>
                    )}
                  </div>
                </AccordionSummary>
                <AccordionDetails>
                  <div style={{ width: '100%' }}>
                    <TryItPanel
                      service={service.name}
                      method={method}
                      definition={definition}
                      operation={operation}
                      target={target}
                      security={security}
                    />
                  </div>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </div>
      ))}
    </div>
  );
}
