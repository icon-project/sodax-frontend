#!/usr/bin/env node
// Regression test for #1070: verifies SSR page renders correct Stacks
// encoded addresses and client page builds without crash after
// Next.js 16 Turbopack production build.

import { readFileSync, existsSync } from 'node:fs';

let failed = false;
const fail = (msg) => {
  console.error(`FAIL: ${msg}`);
  failed = true;
};
const ok = (msg) => console.log(`OK: ${msg}`);

// Expected values from SSR page (server component renders synchronously)
const EXPECTED = {
  encoded: '0x05160000000000000000000000000000000000000000',
  encodedContract: '0x0616c030e21338c86199889c382f1cda75d7adf4a9b91261737365742d6d616e616765722d696d706c',
  encodedAddressOnly: '0x0516c030e21338c86199889c382f1cda75d7adf4a9b9',
  serialized: '0x05165a5b2928a02cf4fc972544c6ea9a69fb9f9a0e3d',
  sdk: 'ok',
  provider: 'ok',
};

// --- SSR page: check exact values in prerendered HTML ---
{
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

// --- Client page: confirm it built without Turbopack crash ---
// Client component renders via useEffect, so prerendered HTML only has
// "loading..." — we just verify the page was built successfully.
{
  const paths = ['.next/server/app/client.html', '.next/server/app/client/index.html'];
  const exists = paths.some(p => existsSync(p));
  if (exists) {
    ok('client page built successfully');
  } else {
    fail('client page not found — Turbopack build may have crashed');
  }
}

if (failed) {
  console.error('\nverify-build: FAILED');
  process.exit(1);
}
console.log('\nverify-build: OK — SSR values correct, client page built');
