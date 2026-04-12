#!/usr/bin/env node
// Regression test for #1070: verifies SSR + client pages build and render
// correctly on Next.js 16 Turbopack production build.
// Covers: @sodax/sdk, @sodax/types, @sodax/wallet-sdk-core (SSR)
//         + @sodax/wallet-sdk-react, @sodax/dapp-kit providers (client)

import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

let failed = false;
const fail = (msg) => {
  console.error(`FAIL: ${msg}`);
  failed = true;
};
const ok = (msg) => console.log(`OK: ${msg}`);

// --- Phase 1: Static checks on prerendered HTML ---

// SSR page: check exact Stacks encoded values in prerendered HTML
{
  const EXPECTED = {
    encoded: '0x05160000000000000000000000000000000000000000',
    encodedContract: '0x0616c030e21338c86199889c382f1cda75d7adf4a9b91261737365742d6d616e616765722d696d706c',
    serialized: '0x05165a5b2928a02cf4fc972544c6ea9a69fb9f9a0e3d',
    sdk: 'ok',
  };

  const paths = ['.next/server/app/index.html', '.next/server/app/page.html'];
  let html;
  let used;
  for (const path of paths) {
    try {
      html = readFileSync(path, 'utf8');
      used = path;
      break;
    } catch {}
  }

  if (!html) {
    fail(`ssr: could not find prerendered HTML in ${paths.join(', ')}`);
  } else {
    for (const [key, expected] of Object.entries(EXPECTED)) {
      if (html.includes(expected)) {
        ok(`ssr ${key}: ${expected.slice(0, 40)}${expected.length > 40 ? '...' : ''}`);
      } else {
        fail(`ssr ${key}: expected value not found in ${used}`);
      }
    }
  }
}

// Client page: confirm providers built without Turbopack crash
{
  const paths = ['.next/server/app/client.html', '.next/server/app/client/index.html'];
  let html;
  let used;
  for (const path of paths) {
    try {
      html = readFileSync(path, 'utf8');
      used = path;
      break;
    } catch {}
  }

  if (!html) {
    fail('client page not found — Turbopack build may have crashed');
  } else {
    const markers = ['sdk-exports', 'wallet-core-exports', 'providers'];
    for (const marker of markers) {
      if (html.includes(`data-testid="${marker}"`)) {
        ok(`client ${marker}: rendered`);
      } else {
        fail(`client ${marker}: data-testid not found in ${used}`);
      }
    }
  }
}

if (failed) {
  console.error('\nverify-build: FAILED (static checks)');
  process.exit(1);
}

// --- Phase 2: Runtime check — start server, fetch pages, verify JS renders ---

console.log('\nStarting runtime verification...');

const PORT = 3099;
const server = spawn('npx', ['next', 'start', '--port', String(PORT)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, NODE_ENV: 'production' },
});

let serverOutput = '';
server.stdout.on('data', (d) => { serverOutput += d.toString(); });
server.stderr.on('data', (d) => { serverOutput += d.toString(); });

// Wait for server ready, then run checks
const timeout = setTimeout(() => {
  fail('server did not start within 30s');
  console.error('Server output:\n', serverOutput);
  server.kill();
  process.exit(1);
}, 30_000);

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(`http://localhost:${PORT}/`);
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return false;
}

async function fetchAndCheck(path, checks) {
  const url = `http://localhost:${PORT}${path}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) {
    fail(`${path}: HTTP ${res.status}`);
    return;
  }
  const html = await res.text();

  for (const { name, test } of checks) {
    if (test(html)) {
      ok(`runtime ${path} ${name}`);
    } else {
      fail(`runtime ${path} ${name}`);
    }
  }
}

async function runRuntimeChecks() {
  try {
    const ready = await waitForServer();
    clearTimeout(timeout);

    if (!ready) {
      fail('server never became ready');
      return;
    }

    // SSR page: values should be in initial HTML (server-rendered)
    await fetchAndCheck('/', [
      { name: 'stacks-encoded', test: (h) => h.includes('0x05160000000000000000000000000000000000000000') },
      { name: 'sdk-ready', test: (h) => h.includes('data-testid="sdk"') && h.includes('>ok</') },
    ]);

    // Client page: provider markers should be in HTML shell
    // (values are "loading..." in SSR, filled by JS — but page must not crash)
    await fetchAndCheck('/client', [
      { name: 'page-rendered', test: (h) => h.includes('data-testid="providers"') },
      { name: 'no-error-boundary', test: (h) => !h.includes('Application error') },
      { name: 'no-hydration-error', test: (h) => !h.includes('Hydration failed') },
      { name: 'provider-shell', test: (h) => h.includes('sodax next16') },
    ]);
  } finally {
    server.kill();
  }

  if (failed) {
    console.error('Server output:\n', serverOutput);
    console.error('\nverify-build: FAILED');
    process.exit(1);
  }
  console.log('\nverify-build: OK — SSR values correct, client providers built, runtime OK');
}

runRuntimeChecks();
