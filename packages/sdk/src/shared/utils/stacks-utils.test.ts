import { describe, it, expect } from 'vitest';
import { loadStacksTransactions, serializeAddressData } from './stacks-utils.js';
import { encodeAddress } from './shared-utils.js';

// Differential test suite for issue #1070.
//
// The fix replaces an `await import('@stacks/transactions')` lazy chain in
// `encodeAddress('stacks', …)` with a synchronous path that calls
// `c32check.c32addressDecode` directly + writes 22 bytes Clarity
// StandardPrincipal. Both `c32check` and `@stacks/transactions` resolve to
// the same `c32addressDecode` implementation (the latter literally re-exports
// the former in `wire/create.js → createAddress`), so the byte output MUST
// match for every valid Stacks address.
//
// These tests assert that match against the real `@stacks/transactions`
// module loaded at runtime via `loadStacksTransactions()`. If they ever
// diverge (e.g. someone bumps c32check or @stacks/transactions to a major
// version with breaking changes), CI fails immediately.

// Stacks principals — both standard (user accounts) and contract (tokens, asset
// managers). The SDK pipes both shapes through `encodeAddress('stacks', …)`,
// so coverage MUST include both. Standard reference values cover all 4 version
// bytes (mainnet/testnet × p2pkh/p2sh) plus edge-case hash160s.
const ADDRESSES = [
  // ── Standard principals ─────────────────────────────────────────────
  // Real account from manual verification + UI cross-check
  'SP1D5PA98M0PF9Z4Q4N2CDTMTD7XSZ6GE7QQG5XBX',
  // Mainnet p2pkh (version 0x16) edge cases
  'SP000000000000000000002Q6VF78', // hash160 = 0x00…00
  'SP3ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZW9P3P0G', // hash160 = 0xFF…FF
  'SPG40R40M30E209185GR38E1W8124GK2GTTY80D', // hash160 = 0x0102…14
  // Mainnet p2sh (version 0x14)
  'SMG40R40M30E209185GR38E1W8124GK2GFRDWHB',
  // Testnet p2pkh (version 0x1a)
  'ST000000000000000000002AMW42H',
  'STG40R40M30E209185GR38E1W8124GK2HKSRMTB',
  // Testnet p2sh (version 0x15)
  'SNG40R40M30E209185GR38E1W8124GK2J31H22Y',

  // ── Contract principals ─────────────────────────────────────────────
  // Real Sodax-deployed contracts on mainnet (from spokeChainConfig.stacks)
  'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0.bnusd',
  'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0.soda',
  'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0.asset-manager-state',
  'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0.connection-v3',
  // Real third-party tokens used by Sodax
  'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token',
  'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx',
  // Native STX wrapper (testnet-version address used as marker on mainnet)
  'ST000000000000000000002AMW42H.nativetoken',
  // Edge: shortest possible contract name (1 char)
  'SP000000000000000000002Q6VF78.x',
  // Edge: maximum protocol-allowed contract name length (40 chars). The
  // serializer accepts up to 128 bytes; this case pins the spec boundary.
  'SP000000000000000000002Q6VF78.abcdefghij0123456789abcdefghij0123456789',

  // ── Edge cases (consistency with @stacks/transactions matters even
  //    for malformed/non-canonical input — these were near-miss bugs) ──
  // Mixed case: c32check normalizes after the leading 'S' check
  'Sp1D5pA98M0pF9z4Q4n2CdTmTd7xSz6gE7qQg5xBx',
  // Multi-dot: matches Hiro's split('.')[1] truncation behaviour
  'SP3031RGK734636C8KGW2Y76TEQBTVX59Q472EQH0.foo.bar',
] as const;

describe('Stacks address serialization (issue #1070)', () => {
  it('serializeAddressData matches @stacks/transactions byte-for-byte', async () => {
    const m = await loadStacksTransactions();
    for (const addr of ADDRESSES) {
      const ours = serializeAddressData(addr);
      const theirs = `0x${m.serializeCV(m.Cl.principal(addr))}`;
      expect(ours, `mismatch for ${addr}`).toBe(theirs);
    }
  });

  it('encodeAddress("stacks", …) matches @stacks/transactions byte-for-byte', async () => {
    const m = await loadStacksTransactions();
    for (const addr of ADDRESSES) {
      const ours = encodeAddress('stacks', addr);
      const theirs = `0x${m.serializeCV(m.Cl.principal(addr))}`;
      expect(ours, `mismatch for ${addr}`).toBe(theirs);
    }
  });

  it('serializeAddressData is fully synchronous (no preload required)', () => {
    // Critical: must NOT throw when called in the same tick as SDK import.
    // This is the regression that bit Node ESM consumers in the first
    // lazy-load attempt (PR #1074, pre-fix).
    const result = serializeAddressData('SP1D5PA98M0PF9Z4Q4N2CDTMTD7XSZ6GE7QQG5XBX');
    expect(result).toBe('0x05165a5b2928a02cf4fc972544c6ea9a69fb9f9a0e3d');
  });

  it('rejects invalid Stacks addresses', () => {
    // Wrong leading char ('X' instead of 'S')
    expect(() => serializeAddressData('XP000000000000000000002Q6VF78')).toThrow();
    // Bad checksum (last char flipped)
    expect(() => serializeAddressData('SP000000000000000000002Q6VF79')).toThrow();
    // Too short to be a valid Stacks address (< 5 chars)
    expect(() => serializeAddressData('SP1')).toThrow();
    // Too long to fit a 20-byte hash160 + checksum after c32 decode
    expect(() => serializeAddressData(`SP${'1'.repeat(60)}`)).toThrow();
    // Empty contract name after dot
    expect(() => serializeAddressData('SP000000000000000000002Q6VF78.')).toThrow();
  });

  it('rejects oversized contract names', () => {
    // 129-byte name exceeds the 128-byte sanity guardrail
    const longName = 'a'.repeat(129);
    expect(() => serializeAddressData(`SP000000000000000000002Q6VF78.${longName}`)).toThrow(
      /contract name too long/,
    );
  });

  it('loadStacksTransactions still resolves the package for async tx-signing paths', async () => {
    const m = await loadStacksTransactions();
    expect(typeof m.Cl).toBe('object');
    expect(typeof m.serializeCV).toBe('function');
  });
});
