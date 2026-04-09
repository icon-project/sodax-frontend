// Regression tests for #1070:
//   1. Sync encodeAddress('stacks', …) works in Node ESM with no preload race.
//   2. Async loadStacksTransactions() actually resolves @stacks/transactions
//      with the exports StacksSpokeService / StacksSpokeProvider depend on.
//
// Run: pnpm exec tsx src/test-stacks-encode.ts

import { encodeAddress, loadStacksTransactions, serializeAddressData } from '@sodax/sdk';
import { STACKS_MAINNET_CHAIN_ID } from '@sodax/types';

let failed = false;
const fail = (msg: string) => {
  console.error(`FAIL: ${msg}`);
  failed = true;
};

// --- 1. Sync path (encodeAddress + serializeAddressData) ----------------
{
  const addr = 'SP1D5PA98M0PF9Z4Q4N2CDTMTD7XSZ6GE7QQG5XBX';
  const expected = '0x05165a5b2928a02cf4fc972544c6ea9a69fb9f9a0e3d';

  const enc = encodeAddress(STACKS_MAINNET_CHAIN_ID, addr);
  const ser = serializeAddressData(addr);

  console.log(`sync encodeAddress       : ${enc}`);
  console.log(`sync serializeAddressData: ${ser}`);

  if (enc !== expected) fail(`encodeAddress mismatch (got ${enc})`);
  if (ser !== expected) fail(`serializeAddressData mismatch (got ${ser})`);
  if (enc !== ser) fail('encodeAddress vs serializeAddressData mismatch');
}

// --- 2. Async lazy load path (StacksSpokeService / Provider deps) ----------
{
  const m = await loadStacksTransactions();

  // Exports actually consumed by SDK Stacks paths:
  //   StacksSpokeProvider:  Cl, parseContractId, fetchCallReadOnlyFunction
  //   StacksSpokeService:   Cl, noneCV, parseContractId, PostConditionMode, someCV, uintCV
  const required = [
    'Cl',
    'noneCV',
    'someCV',
    'uintCV',
    'parseContractId',
    'PostConditionMode',
    'fetchCallReadOnlyFunction',
    'serializeCV',
  ] as const;

  for (const name of required) {
    // biome-ignore lint/suspicious/noExplicitAny: dynamic export check
    if ((m as any)[name] === undefined) fail(`loadStacksTransactions missing export: ${name}`);
  }

  // Smoke check the returned module is functional:
  const cv = m.Cl.principal('SP1D5PA98M0PF9Z4Q4N2CDTMTD7XSZ6GE7QQG5XBX');
  const hex = `0x${m.serializeCV(cv)}`;
  console.log(`async @stacks/transactions: ${hex}`);
  if (hex !== '0x05165a5b2928a02cf4fc972544c6ea9a69fb9f9a0e3d') {
    fail(`async serializeCV mismatch (got ${hex})`);
  }

  // Cache hit should return the same module reference
  const m2 = await loadStacksTransactions();
  if (m !== m2) fail('loadStacksTransactions did not return cached module on second call');
}

if (failed) {
  console.error('\n❌ test-stacks-encode: FAILED');
  process.exit(1);
}
console.log('\n✅ test-stacks-encode: all checks passed (sync + lazy paths)');
