#!/usr/bin/env node
/**
 * Verifies tsup stub for @stacks/connect-ui covers every named import that
 * @stacks/connect actually makes from it (#1070).
 *
 * If @stacks/connect upgrades and starts importing new named exports from
 * @stacks/connect-ui that our noop stub doesn't provide, the bundled output
 * would silently reference `undefined` and fail at runtime. This script
 * catches that at build time.
 *
 * Run as part of `pnpm build` (before tsup) in @sodax/libs.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Must stay in sync with the stub in packages/libs/tsup.config.ts
const STUB_EXPORTS = new Set([
  'getInstalledProviders',
  'getProviderFromId',
  'getSelectedProviderId',
  'getProvider',
  'clearSelectedProviderId',
  'setSelectedProviderId',
  'defineCustomElements',
  'isProviderSelected',
]);

function resolvePackageDir(pkgName) {
  // Walk up from script dir looking for node_modules/<pkgName>
  let cur = __dirname;
  for (let i = 0; i < 10; i++) {
    const candidate = join(cur, 'node_modules', pkgName);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return null;
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (/\.(m?js|cjs)$/.test(name)) out.push(p);
  }
  return out;
}

const pkgDir = resolvePackageDir('@stacks/connect');
if (!pkgDir) {
  console.error('verify-stacks-connect-ui-stub: @stacks/connect not installed — skipping');
  process.exit(0);
}

const distDir = join(pkgDir, 'dist');
if (!existsSync(distDir)) {
  console.error(`verify-stacks-connect-ui-stub: ${distDir} not found — skipping`);
  process.exit(0);
}

// Match: import { a, b as c } from '@stacks/connect-ui'
// Also:   from "@stacks/connect-ui"
const namedImportRe = /import\s*\{([^}]+)\}\s*from\s*["']@stacks\/connect-ui["']/g;

const missing = new Set();
const found = new Set();
for (const file of walk(distDir)) {
  const src = readFileSync(file, 'utf8');
  let m;
  while ((m = namedImportRe.exec(src)) !== null) {
    const names = m[1]
      .split(',')
      .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
      .filter(Boolean);
    for (const n of names) {
      found.add(n);
      if (!STUB_EXPORTS.has(n)) missing.add(n);
    }
  }
}

if (missing.size > 0) {
  console.error(
    'verify-stacks-connect-ui-stub: FAILED — @stacks/connect imports these from @stacks/connect-ui but the stub does not cover them:',
  );
  for (const n of missing) console.error(`  - ${n}`);
  console.error('\nAdd them to the stub in packages/libs/tsup.config.ts AND to STUB_EXPORTS in this script.');
  process.exit(1);
}

console.log(`verify-stacks-connect-ui-stub: OK (${found.size} named imports covered)`);
