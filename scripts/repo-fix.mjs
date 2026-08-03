/**
 * Wrapper around `backstage-cli repo fix --publish` that keeps
 * repository.directory POSIX-style (forward slashes).
 *
 * On Windows, backstage-cli writes backslashes via path.join; npm and
 * Linux CI expect forward slashes, so `yarn fix --check` would otherwise
 * fail on ubuntu runners after a Windows `yarn fix`.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const check = process.argv.includes('--check');

function pluginPackageJsonPaths() {
  const pluginsDir = path.join(root, 'plugins');
  return fs
    .readdirSync(pluginsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => path.join(pluginsDir, d.name, 'package.json'))
    .filter(p => fs.existsSync(p));
}

function snapshot() {
  return Object.fromEntries(
    pluginPackageJsonPaths().map(p => [p, fs.readFileSync(p, 'utf8')]),
  );
}

function normalizeRepoDirectories() {
  for (const pkgPath of pluginPackageJsonPaths()) {
    const text = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(text);
    const dir = pkg.repository?.directory;
    if (typeof dir !== 'string') continue;
    // Parsed value uses real backslashes; also collapse accidental `//` from
    // earlier naive file-level replacements.
    const normalized = dir.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
    if (normalized === dir && !text.includes('\\\\')) continue;
    const next = text.replace(
      /"directory"\s*:\s*"[^"]*"/,
      `"directory": "${normalized}"`,
    );
    if (next !== text) {
      fs.writeFileSync(pkgPath, next);
    }
  }
}

const before = snapshot();

const result = spawnSync(
  'yarn',
  ['backstage-cli', 'repo', 'fix', '--publish'],
  { stdio: 'inherit', shell: true, cwd: root },
);

if (result.status !== 0 && result.status !== null) {
  process.exit(result.status);
}

normalizeRepoDirectories();

if (check) {
  const after = snapshot();
  const changed = Object.keys(before).filter(p => before[p] !== after[p]);
  for (const [pkgPath, content] of Object.entries(before)) {
    fs.writeFileSync(pkgPath, content);
  }
  if (changed.length > 0) {
    console.error(
      "The following packages are out of sync, run 'yarn fix' to fix them:",
    );
    for (const pkgPath of changed) {
      const pkg = JSON.parse(before[pkgPath]);
      console.error(`  ${pkg.name ?? pkgPath}`);
    }
    process.exit(1);
  }
}
