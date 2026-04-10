#!/usr/bin/env node
// Regression test for #1070: verifies SSR + client pages build and render
// correctly on Next.js 16 Turbopack production build.
// Covers: @sodax/sdk, @sodax/types, @sodax/wallet-sdk-core (SSR)
//         + @sodax/wallet-sdk-react, @sodax/dapp-kit providers (client)

import { readFileSync, existsSync } from 'node:fs';

let failed = false;
const fail = (msg) => {
  console.error(`FAIL: ${msg}`);
  failed = true;
};
const ok = (msg) => console.log(`OK: ${msg}`);

// --- SSR page: check exact Stacks encoded values in prerendered HTML ---
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

// --- Client page: confirm providers built without Turbopack crash ---
// Client page wraps SodaxProvider + SodaxWalletProvider + QueryClientProvider.
// Values render via useEffect, so prerendered HTML has "loading..." placeholders.
// We verify the page built and contains the provider test markers.
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
    // Verify page structure rendered (providers didn't crash SSR prerender)
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
  console.error('\nverify-build: FAILED');
  process.exit(1);
}
console.log('\nverify-build: OK — SSR values correct, client providers built');
