import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(
  path.join(process.cwd(), 'plugins/grpc-docs/package.json'),
);
const pkgDir = path.dirname(require.resolve('@backstage/dev-utils/package.json'));
const renderPath = path.join(pkgDir, 'dist/devApp/render.esm.js');
const text = fs.readFileSync(renderPath, 'utf8');
const markers = ['createApp(', 'configLoader', 'SignInPage', 'guest', 'app.title'];
for (const marker of markers) {
  const idx = text.indexOf(marker);
  console.log('\n===', marker, 'idx=', idx);
  if (idx >= 0) {
    console.log(text.slice(idx, idx + 500));
  }
}
