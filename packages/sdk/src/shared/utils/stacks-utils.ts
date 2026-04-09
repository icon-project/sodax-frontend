import { c32addressDecode } from 'c32check';
import type { Hex } from 'viem';

// `c32check` is the same package `@stacks/transactions` uses internally for
// address decoding (see @stacks/transactions/wire/create.js → createAddress →
// c32addressDecode). Importing it directly lets us serialize Stacks addresses
// to Clarity StandardPrincipal bytes synchronously, without pulling
// `@stacks/transactions`, which has a Next.js 16 Turbopack scope-hoisting
// cycle (issue #1070).
//
// `c32check` itself is small (no Stacks SDK transitive deps) and bundlers
// handle it cleanly. The version is locked to **exactly** 2.0.0 (no caret)
// — exactly what @stacks/transactions@7.3.1 depends on — so pnpm dedupes
// both consumers to the same instance and the differential test in
// stacks-utils.test.ts (which compares output against the real
// @stacks/transactions module via loadStacksTransactions) is meaningful.
//
// IMPORTANT: do NOT relax this pin to ^2.0.0. If a future @stacks/transactions
// release bumps c32check to a major version with breaking encoding behavior,
// we want CI to fail loudly via the differential test rather than silently
// resolve to a different package version. Run `pnpm why c32check` after any
// @stacks/transactions bump to verify both consumers still resolve to the
// same version.

// Lazy loader for the full @stacks/transactions module. Still required for
// real on-chain operations (tx signing, contract reads, post-conditions) in
// StacksSpokeProvider/Service. Address encoding does NOT need this anymore.
//
// We cache the *promise*, not the resolved module, so two concurrent
// first-callers share a single in-flight import() instead of both entering
// the conditional branch and racing on assignment.
let _stacksTxPromise: Promise<typeof import('@stacks/transactions')> | undefined;

export function loadStacksTransactions(): Promise<typeof import('@stacks/transactions')> {
  if (!_stacksTxPromise) {
    _stacksTxPromise = import('@stacks/transactions');
  }
  return _stacksTxPromise;
}

export async function waitForStacksTransaction(txid: string, rpc_url: string): Promise<boolean> {
  const url = `${rpc_url}/extended/v1/tx/${txid}`;

  for (let i = 1; i <= 5; i++) {
    const result = await (await fetch(url)).json();
    console.log('Waiting for transaction to be processed trying again', i);
    if (result.tx_status === 'success') {
      return true;
    }
    if (result.tx_status === 'abort_by_response') {
      console.log('Transaction aborted by response');
      return false;
    }

    if (result.tx_status === 'abort_by_post_condition') {
      console.log('Transaction aborted by post condition');
      return false;
    }

    await sleep(2 * i);
  }
  return false;
}

/**
 * Synchronously serialize a Stacks principal as Clarity bytes, matching
 * `serializeCV(Cl.principal(address))` from @stacks/transactions byte-for-byte.
 *
 * Handles BOTH principal types — Stacks tokens are contract principals
 * (e.g. `SP3031…Q472EQH0.bnusd`), while user accounts are standard principals
 * (`SP1D5PA98…`). The SDK passes both shapes through `encodeAddress('stacks',
 * …)` (token address, asset-manager contract, user wallet, …), so we must
 * dispatch correctly.
 *
 * StandardPrincipal (no `.` in input) — 22 bytes:
 *   [0x05]              ClarityType.PrincipalStandard
 *   [version]           1 byte (0x16 mainnet / 0x1a testnet, etc.)
 *   [hash160]           20 bytes
 *
 * ContractPrincipal (`address.name` in input) — 22 + 1 + N bytes:
 *   [0x06]              ClarityType.PrincipalContract
 *   [version]           1 byte
 *   [hash160]           20 bytes
 *   [name_length]       1 byte (UTF-8 byte length of contract name; Stacks
 *                       caps contract names at 40 bytes per spec)
 *   [name_bytes]        UTF-8 bytes of contract name
 *
 * The c32 address decode delegates to `c32check.c32addressDecode` — exactly
 * what @stacks/transactions calls internally — so encoded bytes match
 * byte-for-byte. The differential test in `stacks-utils.test.ts` enforces
 * this for both principal shapes.
 */
export function serializeAddressData(address: string): Hex {
  if (!address.includes('.')) {
    // StandardPrincipal
    const [version, hash160Hex] = c32addressDecode(address);
    const versionHex = version.toString(16).padStart(2, '0');
    return `0x05${versionHex}${hash160Hex}` as Hex;
  }

  // ContractPrincipal. Match @stacks/transactions exactly:
  //   wire/helpers.js parsePrincipalString does
  //     `const [address, contractName] = principalString.split('.')`
  // which silently drops any segments after the second dot. We replicate
  // that here so byte output stays consistent for malformed input too.
  const parts = address.split('.');
  const c32Addr = parts[0] as string;
  const contractName = parts[1] as string;

  if (contractName.length === 0) {
    throw new Error(`Invalid Stacks contract identifier (empty name): ${address}`);
  }

  const [version, hash160Hex] = c32addressDecode(c32Addr);
  const versionHex = version.toString(16).padStart(2, '0');

  // UTF-8 byte length of contract name. Stacks contract names are ASCII per
  // spec (`^[a-zA-Z]([a-zA-Z0-9]|[-_])*$`, max 40 chars), but we use the
  // UTF-8 byte length to mirror @stacks/transactions LP-string encoding
  // exactly.
  //
  // The 128-byte ceiling here is intentionally LOOSER than the 40-char
  // protocol cap. @stacks/transactions' Cl.principal does NOT validate
  // contract name length at serialization time — it just emits the bytes —
  // so tightening this to 40 would diverge from the differential test
  // reference. Treat 128 as a sanity guardrail (still fits in the 1-byte
  // length prefix); the protocol cap is enforced on-chain by the Stacks
  // node, not by us.
  const nameBytes = new TextEncoder().encode(contractName);
  if (nameBytes.length > 128) {
    throw new Error(`Stacks contract name too long: ${nameBytes.length} bytes`);
  }
  const lenHex = nameBytes.length.toString(16).padStart(2, '0');
  const nameHex = Buffer.from(nameBytes).toString('hex');

  return `0x06${versionHex}${hash160Hex}${lenHex}${nameHex}` as Hex;
}

async function sleep(s: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 1000 * s);
  });
}
