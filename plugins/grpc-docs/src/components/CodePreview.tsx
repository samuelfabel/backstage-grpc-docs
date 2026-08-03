import { useTheme } from '@material-ui/core/styles';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  vscodeDarkPrism,
  vscodeLightPrism,
} from '../lib/prismVscodeStyles';

export interface CodePreviewProps {
  text: string;
  language: 'json' | 'protobuf';
  /** Match an adjacent editor height (e.g. schema split). */
  minHeight?: number;
}

/**
 * Compact read-only preview with real VS Code Light+/Dark+ JSON colors.
 */
export function CodePreview(props: CodePreviewProps) {
  const { text, language, minHeight } = props;
  const theme = useTheme();
  const dark = theme.palette.type === 'dark';

  return (
    <div
      data-testid={`grpc-docs-code-preview-${language}`}
      style={{
        borderRadius: 4,
        overflow: 'hidden',
        border: `1px solid ${dark ? '#3c3c3c' : '#e5e5e5'}`,
        height: minHeight,
        minHeight,
        boxSizing: 'border-box',
      }}
    >
      <SyntaxHighlighter
        language={language === 'protobuf' ? 'protobuf' : 'json'}
        style={dark ? vscodeDarkPrism : vscodeLightPrism}
        customStyle={{
          margin: 0,
          padding: '12px 14px',
          fontSize: 13,
          lineHeight: '20px',
          background: dark ? '#1e1e1e' : '#ffffff',
          height: minHeight ? '100%' : undefined,
          minHeight: minHeight ? '100%' : undefined,
          boxSizing: 'border-box',
          overflow: 'auto',
        }}
      >
        {text}
      </SyntaxHighlighter>
    </div>
  );
}
