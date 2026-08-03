import {
  vs,
  vscDarkPlus,
} from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * Prism `vs` maps `property` to bright red (#ff0000) when using inline styles —
 * the nicer `.language-json .token.property` rules are ignored. Override to
 * real VS Code Light+ / Dark+ JSON colors.
 */
export const vscodeLightPrism = {
  ...vs,
  'code[class*="language-"]': {
    ...(vs['code[class*="language-"]'] as object),
    color: '#000000',
    background: '#ffffff',
    fontFamily: 'Consolas, "Courier New", monospace',
  },
  'pre[class*="language-"]': {
    ...(vs['pre[class*="language-"]'] as object),
    color: '#000000',
    background: '#ffffff',
    fontFamily: 'Consolas, "Courier New", monospace',
  },
  property: { color: '#0451a5' },
  string: { color: '#a31515' },
  number: { color: '#098658' },
  boolean: { color: '#0000ff' },
  null: { color: '#0000ff' },
  keyword: { color: '#0000ff' },
  punctuation: { color: '#000000' },
  operator: { color: '#000000' },
  '.language-json .token.property': { color: '#0451a5' },
  '.language-json .token.number': { color: '#098658' },
  '.language-json .token.boolean': { color: '#0000ff' },
};

export const vscodeDarkPrism = {
  ...vscDarkPlus,
  'code[class*="language-"]': {
    ...(vscDarkPlus['code[class*="language-"]'] as object),
    color: '#d4d4d4',
    background: '#1e1e1e',
    fontFamily: 'Consolas, "Courier New", monospace',
  },
  'pre[class*="language-"]': {
    ...(vscDarkPlus['pre[class*="language-"]'] as object),
    color: '#d4d4d4',
    background: '#1e1e1e',
    fontFamily: 'Consolas, "Courier New", monospace',
  },
  property: { color: '#9cdcfe' },
  string: { color: '#ce9178' },
  number: { color: '#b5cea8' },
  boolean: { color: '#569cd6' },
  null: { color: '#569cd6' },
  keyword: { color: '#569cd6' },
  punctuation: { color: '#d4d4d4' },
  operator: { color: '#d4d4d4' },
};
