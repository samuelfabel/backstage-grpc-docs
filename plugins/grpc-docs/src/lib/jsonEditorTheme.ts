import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';

/**
 * VS Code Light+ — matches the default “Light+” JSON colors.
 */
export const vscodeLightTheme = createTheme({
  theme: 'light',
  settings: {
    background: '#ffffff',
    foreground: '#000000',
    caret: '#000000',
    selection: '#add6ff',
    selectionMatch: '#add6ff66',
    lineHighlight: '#f3f3f3',
    gutterBackground: '#ffffff',
    gutterForeground: '#237893',
    fontFamily: 'Consolas, "Courier New", monospace',
  },
  styles: [
    { tag: t.propertyName, color: '#0451a5' },
    { tag: t.string, color: '#a31515' },
    { tag: t.number, color: '#098658' },
    { tag: [t.bool, t.null], color: '#0000ff' },
    { tag: [t.bracket, t.squareBracket, t.brace, t.punctuation, t.separator], color: '#000000' },
    { tag: t.comment, color: '#008000' },
    { tag: t.invalid, color: '#cd3131' },
  ],
});

/**
 * VS Code Dark+ — matches the default “Dark+” JSON colors from the screenshot.
 */
export const vscodeDarkTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    caret: '#aeafad',
    selection: '#264f78',
    selectionMatch: '#264f7866',
    lineHighlight: '#2a2a2a',
    gutterBackground: '#1e1e1e',
    gutterForeground: '#858585',
    fontFamily: 'Consolas, "Courier New", monospace',
  },
  styles: [
    { tag: t.propertyName, color: '#9cdcfe' },
    { tag: t.string, color: '#ce9178' },
    { tag: t.number, color: '#b5cea8' },
    { tag: [t.bool, t.null], color: '#569cd6' },
    { tag: [t.bracket, t.squareBracket, t.brace], color: '#ffd700' },
    { tag: [t.punctuation, t.separator], color: '#d4d4d4' },
    { tag: t.comment, color: '#6a9955' },
    { tag: t.invalid, color: '#f44747' },
  ],
});

export function jsonEditorTheme(dark: boolean) {
  return dark ? vscodeDarkTheme : vscodeLightTheme;
}
