#!/usr/bin/env node
// Asserts that the SSR-prerendered page successfully ran the lazy stacks
// code path inside @sodax/sdk. Fails build if not. See issue #1070.

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

if (html.includes('FAILED')) {
  console.error('verify-build: BROKEN — page reported FAILED.');
  console.error(html.match(/FAILED[^"]*/)?.[0] ?? '');
  process.exit(1);
}

// Stacks principal `SP000000000000000000002Q6VF78` serialized via Cl.principal()
// + serializeCV() always begins with `0x0516` (Clarity StandardPrincipal version 0x05,
// type 0x16 = principal). Use this as the runtime success signature.
const hexMatch = html.match(/0x05[0-9a-f]{40,}/i);
if (!hexMatch) {
  console.error(`verify-build: BROKEN — no Stacks principal hex found in ${used}`);
  console.error('  Expected pattern: 0x05XX... (Cl.principal serialized)');
  process.exit(1);
}

console.log(`verify-build: OK — lazy stacks path works at Turbopack SSR prerender.`);
console.log(`  ${used}: encoded ${hexMatch[0]}`);
