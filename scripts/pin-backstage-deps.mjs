import fs from 'node:fs';

const pins = {
  '@backstage/cli': '^0.33.0',
  '@backstage/cli-defaults': '^0.1.0',
  '@backstage/backend-plugin-api': '^1.9.0',
  '@backstage/backend-test-utils': '^1.3.0',
  '@backstage/catalog-model': '^1.9.0',
  '@backstage/core-components': '^0.17.0',
  '@backstage/core-plugin-api': '^1.12.0',
  '@backstage/dev-utils': '^1.1.0',
  '@backstage/test-utils': '^1.7.0',
  '@backstage/plugin-api-docs': '^0.12.0',
  '@backstage/plugin-catalog-react': '^1.15.0',
};

const files = [
  'plugins/grpc-docs/package.json',
  'plugins/grpc-docs-backend/package.json',
  'plugins/grpc-docs-common/package.json',
  'plugins/grpc-docs-node/package.json',
];

for (const file of files) {
  const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const deps = pkg[section];
    if (!deps) continue;
    for (const [name, version] of Object.entries(deps)) {
      if (version === 'backstage:^' && pins[name]) {
        deps[name] = pins[name];
      }
    }
  }
  fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  console.log('pinned', file);
}
