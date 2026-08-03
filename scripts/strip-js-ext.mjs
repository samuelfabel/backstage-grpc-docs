import fs from 'node:fs';
import path from 'node:path';

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist') {
        walk(full);
      }
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) {
      continue;
    }
    const content = fs.readFileSync(full, 'utf8');
    const next = content.replace(
      /(from\s+['"])(\.[^'"]+)\.js(['"])/g,
      '$1$2$3',
    );
    if (content !== next) {
      fs.writeFileSync(full, next);
      console.log(full);
    }
  }
}

walk('plugins');
