#!/usr/bin/env node
// Regression gate for #1070: boots `next start` on a production build and
// asserts the `/` route renders without an SSR crash.
import { spawn } from 'node:child_process';

const PORT = 3099;
const TIMEOUT_MS = 30_000;

let failed = false;
const ok = (msg) => console.log(`OK: ${msg}`);
const fail = (msg) => {
  console.error(`FAIL: ${msg}`);
  failed = true;
};

const server = spawn('npx', ['next', 'start', '--port', String(PORT)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, NODE_ENV: 'production' },
});

let serverOutput = '';
server.stdout.on('data', (d) => { serverOutput += d.toString(); });
server.stderr.on('data', (d) => { serverOutput += d.toString(); });
server.on('error', () => {}); // suppress ECONNRESET from kill()
server.on('close', (code) => {
  if (!server.killed) {
    console.error(`server exited unexpectedly with code ${code}\n${serverOutput}`);
    process.exit(1);
  }
});

async function waitForServer() {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      await fetch(`http://localhost:${PORT}/`);
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return false;
}

async function run() {
  try {
    if (!(await waitForServer())) {
      fail('server never became ready');
      return;
    }

    const res = await fetch(`http://localhost:${PORT}/`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) {
      fail(`GET /: HTTP ${res.status}`);
      return;
    }
    const html = await res.text();

    const checks = [
      // @sodax/libs/stacks/core loaded clean in SSR and produced the encoded hex
      ['stacks-ssr', (h) => h.includes('0x05160000000000000000000000000000000000000000')],
      // new SDK.Sodax() constructed without throwing in SSR
      ['sdk-ready', (h) => h.includes('data-testid="sdk"') && h.includes('>ok</')],
      // Client bundle mounted (ClientWalletSection emits this marker)
      ['client-mounted', (h) => h.includes('data-testid="wallet-section"')],
      // No SSR crash bubbled into the HTML
      ['no-ssr-crash', (h) => !h.includes('Application error') && !h.includes('window is not defined')],
    ];

    for (const [name, test] of checks) {
      if (test(html)) ok(name);
      else fail(name);
    }
  } finally {
    server.kill();
  }

  if (failed) {
    console.error(`\nServer output:\n${serverOutput}\nverify-build: FAILED`);
    process.exit(1);
  }
  console.log('\nverify-build: OK');
  process.exit(0);
}

run();
