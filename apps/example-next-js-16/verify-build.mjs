#!/usr/bin/env node
// Asserts that BOTH stacks code paths succeeded at SSR prerender time:
//
//   sync : encodeAddress('stacks', …)        — dependency-free Clarity serialize
//   async: await loadStacksTransactions()    — Turbopack-bundled dynamic import
//
// Either path failing fails the build. See issue #1070.

import { readFileSync } from 'node:fs';

const candidates = [
  '.next/server/app/index.html',
  '.next/server/app/page.html',
];

let html;
let used;
for (const path of candidates) {
  try {
    html = readFileSync(path, 'utf8');
    used = path;
    break;
  } catch {}
}

if (!html) {
  console.error('verify-build: could not find prerendered HTML in', candidates);
  process.exit(1);
}

const fail = (msg) => {
  console.error(`verify-build: BROKEN — ${msg}`);
  process.exit(1);
};

if (html.includes('SYNC_FAILED')) {
  fail(`sync encodeAddress threw: ${html.match(/SYNC_FAILED[^<"]*/)?.[0] ?? '?'}`);
}
if (html.includes('ASYNC_FAILED')) {
  fail(`lazy loadStacksTransactions failed: ${html.match(/ASYNC_FAILED[^<"]*/)?.[0] ?? '?'}`);
}

// Reference value for SP000000000000000000002Q6VF78 (Clarity StandardPrincipal,
// type byte 0x05, mainnet version 0x16, 20 zero bytes hash160).
const expected = '0x05160000000000000000000000000000000000000000';

// Each path renders into its own <p data-testid="…"> tag. Match independently
// so a missing tag doesn't get masked by the other being correct.
// React SSR inserts a `<!-- -->` text-node separator between adjacent JSX
// children, so the hex marker is not strictly between the opening tag and the
// next `<`. Allow up to ~200 chars of intervening markup before the hex.
const syncMatch = html.match(/data-testid="sync-encoded"[\s\S]{0,200}?(0x05[0-9a-f]{40,})/i);
const asyncMatch = html.match(/data-testid="async-encoded"[\s\S]{0,200}?(0x05[0-9a-f]{40,})/i);

if (!syncMatch) fail(`sync hex marker not found in ${used}`);
if (!asyncMatch) fail(`async hex marker not found in ${used}`);

if (syncMatch[1].toLowerCase() !== expected) {
  fail(`sync hex mismatch: got ${syncMatch[1]}, expected ${expected}`);
}
if (asyncMatch[1].toLowerCase() !== expected) {
  fail(`async hex mismatch: got ${asyncMatch[1]}, expected ${expected}`);
}

console.log('verify-build: OK — both sync + async stacks paths work at Turbopack SSR prerender.');
console.log(`  ${used}`);
console.log(`    sync : ${syncMatch[1]}`);
console.log(`    async: ${asyncMatch[1]}`);
