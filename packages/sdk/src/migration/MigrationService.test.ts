/**
 * Tests for the MigrationService public API.
 *
 * Mirrors the SwapService.test.ts pattern from PR #1174:
 *
 *   1. A single `new Sodax()` instance backs every runtime test (`sodax.migration` is the SUT).
 *   2. Static collaborators (HubService, IntentRelayApiService, encodeAddress) are mocked at
 *      their source paths via `vi.mock` + `vi.hoisted`, since SwapService-style barrel re-exports
 *      otherwise produce a different module instance than the test-side import.
 *   3. Instance methods on `sodax.spokeService` and on the sub-services (icxMigration,
 *      bnUSDMigrationService, balnSwapService) are stubbed per-test via `vi.spyOn`.
 *   4. Each public method has a top-level `describe` with branch-level coverage:
 *      happy paths, invariant failures (rejected via Result), and error propagation
 *      from each internal collaborator.
 *
 * MigrationService is the facade over IcxMigrationService, BnUSDMigrationService, and
 * BalnSwapService — those classes have their own service-internal tests; here we only
 * verify the orchestration on top of them.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ChainKeys,
  type Address,
  type IconEoaAddress,
  type IcxTokenType,
  type IEvmWalletProvider,
  type IIconWalletProvider,
  type IStellarWalletProvider,
  type ISolanaWalletProvider,
} from '@sodax/types';

const mocks = vi.hoisted(() => ({
  // HubService static methods — both `getUserHubWalletAddress` (used by every create-intent
  // path to derive the hub-side recipient) and `getUserRouter` (used by revert flows that
  // need the user's spending router on the hub).
  getUserHubWalletAddress: vi.fn(),
  getUserRouter: vi.fn(),
  // IntentRelayApiService — every facade method (migratebnUSD / migrateIcxToSoda /
  // revertMigrateSodaToIcx / migrateBaln) goes through `relayTxAndWaitPacket`, and the
  // bnUSD flow optionally also calls `waitUntilIntentExecuted` for the hub→spoke leg.
  relayTxAndWaitPacket: vi.fn(),
  waitUntilIntentExecuted: vi.fn(),
  // encodeAddress is called for bnUSD migrate / revert paths to translate the dst address
  // into the hub's encoded form before being passed to the migration data builder.
  encodeAddress: vi.fn((_chainKey: unknown, addr: string) => `0xencoded:${addr}`),
}));

vi.mock('../shared/services/hub/HubService.js', () => ({
  HubService: {
    getUserHubWalletAddress: mocks.getUserHubWalletAddress,
    getUserRouter: mocks.getUserRouter,
  },
}));

// Preserve types and the rest of the module surface — only the network-touching helpers
// are replaced. This matches the SwapService test approach for IntentRelayApiService.
vi.mock('../shared/services/intentRelay/IntentRelayApiService.js', async () => {
  const actual = await vi.importActual<object>('../shared/services/intentRelay/IntentRelayApiService.js');
  return {
    ...actual,
    relayTxAndWaitPacket: mocks.relayTxAndWaitPacket,
    waitUntilIntentExecuted: mocks.waitUntilIntentExecuted,
  };
});

// `encodeAddress` lives in `shared-utils`. Real implementation depends on chain-specific
// codecs and we only care that the bnUSD flow forwards the dst address through it — so
// we replace it with a deterministic fake but keep every other util intact.
vi.mock('../shared/utils/shared-utils.js', async () => {
  const actual = await vi.importActual<object>('../shared/utils/shared-utils.js');
  return {
    ...actual,
    encodeAddress: mocks.encodeAddress,
  };
});

import { Sodax } from '../shared/entities/Sodax.js';
import type { IcxMigrateParams, IcxCreateRevertMigrationParams } from './IcxMigrationService.js';
import type { UnifiedBnUSDMigrateParams } from './BnUSDMigrationService.js';
import { LockupPeriod, type BalnMigrateParams } from './BalnSwapService.js';

// --- test fixtures --------------------------------------------------------

const sodax = new Sodax();

const mockEvmProvider = {
  chainType: 'EVM',
  sendTransaction: vi.fn(),
  getWalletAddress: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
} as unknown as IEvmWalletProvider;

const mockIconProvider = {
  chainType: 'ICON',
  sendTransaction: vi.fn(),
  getWalletAddress: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
} as unknown as IIconWalletProvider;

const mockStellarProvider = {
  chainType: 'STELLAR',
  getWalletAddress: vi.fn(),
  signTransaction: vi.fn(),
} as unknown as IStellarWalletProvider;

const mockSolanaProvider = {
  chainType: 'SOLANA',
  sendTransaction: vi.fn(),
  getWalletAddress: vi.fn(),
} as unknown as ISolanaWalletProvider;

// Concrete addresses pulled from the real default sodaxConfig — using real values keeps
// type guards (isAddress, isIconAddress, isLegacybnUSDToken, ...) happy without further
// stubbing. Every fixture below is built on top of these.
const evmAddress = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8' satisfies `0x${string}`;
const iconEoaAddress = 'hx742d35cc6634c0532925a3b8d4c9db96c4b4d8b6' satisfies IconEoaAddress;
const wICXAddress = 'cx3975b43d260fb8ec802cef6e60c2f4d07486f11d' satisfies IcxTokenType;
const iconBnUSDAddress = 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb';
const sonicBnUSDAddress = '0xE801CA34E19aBCbFeA12025378D19c4FBE250131';
const bscBnUSDAddress = '0x6958a4CBFe11406E2a1c1d3a71A1971aD8B3b92F'; // EVM spoke (non-hub) bnUSD
const stellarBnUSDAddress = 'CD6YBFFWMU2UJHX2NGRJ7RN76IJVTCC7MRA46DUBXNB7E6W7H7JRJ2CX';
const stellarUserAddress = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

const hubWalletAddress = '0x1111111111111111111111111111111111111111' satisfies Address;
const userRouterAddress = '0x2222222222222222222222222222222222222222' satisfies Address;
const spokeTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
const hubTxHash = '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321';

// Per-test parameter factories. Returning fresh objects from a factory rather than
// reusing module-level constants keeps tests independent if a test mutates params.
const icxMigrateParams = (): IcxMigrateParams => ({
  srcAddress: iconEoaAddress,
  srcChainKey: ChainKeys.ICON_MAINNET,
  address: wICXAddress,
  amount: 1_000_000_000_000_000_000n,
  dstAddress: evmAddress,
});

const icxRevertParams = (): IcxCreateRevertMigrationParams => ({
  srcAddress: evmAddress,
  srcChainKey: ChainKeys.SONIC_MAINNET,
  amount: 1_000_000_000_000_000_000n,
  dstAddress: iconEoaAddress,
});

const bnUSDLegacyToNewParams = (): UnifiedBnUSDMigrateParams<typeof ChainKeys.ICON_MAINNET> => ({
  srcAddress: iconEoaAddress,
  srcChainKey: ChainKeys.ICON_MAINNET,
  srcbnUSD: iconBnUSDAddress,
  dstChainKey: ChainKeys.SONIC_MAINNET,
  dstbnUSD: sonicBnUSDAddress,
  amount: 1_000_000_000_000_000_000n,
  dstAddress: evmAddress,
});

const bnUSDNewToLegacyParams = (): UnifiedBnUSDMigrateParams<typeof ChainKeys.SONIC_MAINNET> => ({
  srcAddress: evmAddress,
  srcChainKey: ChainKeys.SONIC_MAINNET,
  srcbnUSD: sonicBnUSDAddress,
  dstChainKey: ChainKeys.ICON_MAINNET,
  dstbnUSD: iconBnUSDAddress,
  amount: 1_000_000_000_000_000_000n,
  dstAddress: iconEoaAddress,
});

const bnUSDEvmSpokeParams = (): UnifiedBnUSDMigrateParams<typeof ChainKeys.BSC_MAINNET> => ({
  srcAddress: evmAddress,
  srcChainKey: ChainKeys.BSC_MAINNET,
  srcbnUSD: bscBnUSDAddress,
  dstChainKey: ChainKeys.ICON_MAINNET,
  dstbnUSD: iconBnUSDAddress,
  amount: 1_000_000_000_000_000_000n,
  dstAddress: iconEoaAddress,
});

const bnUSDStellarParams = (): UnifiedBnUSDMigrateParams<typeof ChainKeys.STELLAR_MAINNET> => ({
  srcAddress: stellarUserAddress,
  srcChainKey: ChainKeys.STELLAR_MAINNET,
  srcbnUSD: stellarBnUSDAddress,
  dstChainKey: ChainKeys.SONIC_MAINNET,
  dstbnUSD: sonicBnUSDAddress,
  amount: 1_000_000_000_000_000_000n,
  dstAddress: evmAddress,
});

const balnMigrateParams = (): BalnMigrateParams => ({
  srcAddress: iconEoaAddress,
  srcChainKey: ChainKeys.ICON_MAINNET,
  amount: 1_000_000_000_000_000_000n,
  lockupPeriod: LockupPeriod.SIX_MONTHS,
  dstAddress: evmAddress,
  stake: true,
});

// Default packet shape returned by relayTxAndWaitPacket on success. Only `dst_tx_hash`
// is read by MigrationService — the rest is shape padding to satisfy the PacketData type
// when a test wants to inspect the packet beyond MigrationService's use.
const okPacket = {
  src_tx_hash: spokeTxHash,
  status: 'executed',
  src_chain_id: 1,
  src_address: iconEoaAddress,
  dst_chain_id: 146,
  conn_sn: 1,
  dst_address: hubWalletAddress,
  dst_tx_hash: hubTxHash,
  signatures: ['0xsig'],
  payload: '0xpayload',
};

beforeEach(() => {
  // ConfigService validity predicates: every bnUSD createMigrate call hits these in the
  // pre-`try` invariant block when `unchecked` is false. The default config doesn't know
  // about every chain-token pair we use, so we steer them all to true and then override
  // per-test where we want a specific failure.
  vi.spyOn(sodax.config, 'isValidSpokeChainKey').mockReturnValue(true);

  // Default hub-wallet/user-router stubs. Tests that need a different value or to
  // exercise the rejection path use `mockResolvedValueOnce` / `mockRejectedValueOnce`
  // before invoking the SUT.
  mocks.getUserHubWalletAddress.mockResolvedValue(hubWalletAddress);
  mocks.getUserRouter.mockResolvedValue(userRouterAddress);

  // verifyTxHash is invoked by migratebnUSD; default to ok so each happy-path test
  // doesn't need to re-stub it.
  vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValue({ ok: true, value: true });
});

afterEach(() => {
  vi.restoreAllMocks();
  // restoreAllMocks strips every default we set on hoisted vi.fn()s — re-apply them.
  mocks.getUserHubWalletAddress.mockReset().mockResolvedValue(hubWalletAddress);
  mocks.getUserRouter.mockReset().mockResolvedValue(userRouterAddress);
  mocks.relayTxAndWaitPacket.mockReset();
  mocks.waitUntilIntentExecuted.mockReset();
  mocks.encodeAddress.mockReset().mockImplementation((_chainKey: unknown, addr: string) => `0xencoded:${addr}`);
});

// =========================================================================
// constructor — wiring
// =========================================================================

describe('MigrationService constructor', () => {
  it('constructs all three sub-services with the same hubProvider/config', () => {
    const svc = sodax.migration;
    expect(svc.icxMigration).toBeDefined();
    expect(svc.bnUSDMigrationService).toBeDefined();
    expect(svc.balnSwapService).toBeDefined();
    expect(svc.hubProvider).toBe(sodax.hubProvider);
    expect(svc.spoke).toBe(sodax.spokeService);
    expect(svc.relayerApiEndpoint).toBe(sodax.config.relay.relayerApiEndpoint);
  });
});

// =========================================================================
// isAllowanceValid
// =========================================================================

describe('MigrationService.isAllowanceValid — migrate', () => {
  it('returns ok:true (no allowance check) for ICX migration on Icon', async () => {
    const isAllowanceValidSpy = vi.spyOn(sodax.spokeService, 'isAllowanceValid');
    const result = await sodax.migration.isAllowanceValid(icxMigrateParams(), 'migrate');
    expect(result).toEqual({ ok: true, value: true });
    // ICX/BALN-from-Icon migrations don't require an allowance check — the spoke service
    // must NOT be touched in that branch.
    expect(isAllowanceValidSpy).not.toHaveBeenCalled();
  });

  it('returns ok:true (no allowance check) for BALN migration on Icon', async () => {
    const isAllowanceValidSpy = vi.spyOn(sodax.spokeService, 'isAllowanceValid');
    const result = await sodax.migration.isAllowanceValid(balnMigrateParams(), 'migrate');
    expect(result).toEqual({ ok: true, value: true });
    expect(isAllowanceValidSpy).not.toHaveBeenCalled();
  });

  it('delegates to spoke.isAllowanceValid for bnUSD migration on EVM spoke', async () => {
    const params = bnUSDEvmSpokeParams();
    const spy = vi.spyOn(sodax.spokeService, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

    const result = await sodax.migration.isAllowanceValid(params, 'migrate');

    expect(result).toEqual({ ok: true, value: true });
    expect(spy).toHaveBeenCalledTimes(1);
    const call = spy.mock.calls[0]?.[0];
    expect(call).toMatchObject({
      srcChainKey: ChainKeys.BSC_MAINNET,
      token: params.srcbnUSD,
      amount: params.amount,
      owner: params.srcAddress,
      // EVM spoke (non-hub) → spender is the assetManager.
      spender: sodax.config.sodaxConfig.chains[ChainKeys.BSC_MAINNET].addresses.assetManager,
    });
  });

  it('uses hub bnUSD token address as spender for bnUSD migration on Sonic (hub)', async () => {
    const params: UnifiedBnUSDMigrateParams<typeof ChainKeys.SONIC_MAINNET> = {
      ...bnUSDNewToLegacyParams(),
    };
    const spy = vi.spyOn(sodax.spokeService, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

    const result = await sodax.migration.isAllowanceValid(params, 'migrate');

    expect(result).toEqual({ ok: true, value: true });
    const call = spy.mock.calls[0]?.[0];
    expect(call).toMatchObject({
      srcChainKey: ChainKeys.SONIC_MAINNET,
      token: params.srcbnUSD,
      // Hub spender comes from supportedTokens.bnUSD.address, not the asset manager.
      spender: sodax.config.sodaxConfig.chains[ChainKeys.SONIC_MAINNET].supportedTokens.bnUSD.address,
    });
  });

  it('delegates to spoke.isAllowanceValid for bnUSD migration on Stellar (no spender)', async () => {
    const params = bnUSDStellarParams();
    const spy = vi.spyOn(sodax.spokeService, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

    const result = await sodax.migration.isAllowanceValid(params, 'migrate');

    expect(result).toEqual({ ok: true, value: true });
    const call = spy.mock.calls[0]?.[0];
    expect(call).toMatchObject({
      srcChainKey: ChainKeys.STELLAR_MAINNET,
      token: params.srcbnUSD,
      amount: params.amount,
      owner: params.srcAddress,
    });
    // Stellar trustline call must not include `spender` — that field is EVM-only.
    expect(call).not.toHaveProperty('spender');
  });

  it('returns ok:true (no allowance check) for bnUSD migrate on chains without allowance semantics (e.g. Solana)', async () => {
    // bnUSD migrate on Solana → not Icon (so not the icx/baln short-circuit), not EVM, not
    // Stellar — falls through to the default "no allowance required" return.
    const params: UnifiedBnUSDMigrateParams<typeof ChainKeys.SOLANA_MAINNET> = {
      srcAddress: 'SoLaNaSrCaDdReSs',
      srcChainKey: ChainKeys.SOLANA_MAINNET,
      srcbnUSD: '3rSPCLNEF7Quw4wX8S1NyKivELoyij8eYA2gJwBgt4V5',
      dstChainKey: ChainKeys.SONIC_MAINNET,
      dstbnUSD: sonicBnUSDAddress,
      amount: 1n,
      dstAddress: evmAddress,
    };
    const isAllowanceValidSpy = vi.spyOn(sodax.spokeService, 'isAllowanceValid');
    const result = await sodax.migration.isAllowanceValid(params, 'migrate');
    expect(result).toEqual({ ok: true, value: true });
    expect(isAllowanceValidSpy).not.toHaveBeenCalled();
  });

  it('returns ok:false when amount is 0', async () => {
    const result = await sodax.migration.isAllowanceValid({ ...icxMigrateParams(), amount: 0n }, 'migrate');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Amount must be greater than 0/);
    }
  });

  it('returns ok:false when dstAddress is empty', async () => {
    const result = await sodax.migration.isAllowanceValid(
      { ...icxMigrateParams(), dstAddress: '' as Address },
      'migrate',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/To address is required/);
    }
  });
});

describe('MigrationService.isAllowanceValid — revert', () => {
  it('delegates to spoke.isAllowanceValid for ICX revert on Sonic (hub)', async () => {
    const params = icxRevertParams();
    mocks.getUserHubWalletAddress.mockResolvedValueOnce(userRouterAddress);
    const spy = vi.spyOn(sodax.spokeService, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

    const result = await sodax.migration.isAllowanceValid(params, 'revert');

    expect(result).toEqual({ ok: true, value: true });
    const call = spy.mock.calls[0]?.[0];
    expect(call).toMatchObject({
      srcChainKey: ChainKeys.SONIC_MAINNET,
      token: sodax.hubProvider.chainConfig.addresses.sodaToken,
      amount: params.amount,
      owner: params.srcAddress,
      spender: userRouterAddress,
    });
  });

  it('uses HubService.getUserRouter to derive the spender for bnUSD revert on hub', async () => {
    // Reuse the bnUSD new-to-legacy fixture (Sonic→Icon revert). srcChainKey is hub.
    const params = bnUSDNewToLegacyParams();
    mocks.getUserRouter.mockResolvedValueOnce(userRouterAddress);
    const spy = vi.spyOn(sodax.spokeService, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

    const result = await sodax.migration.isAllowanceValid(params, 'revert');

    expect(result).toEqual({ ok: true, value: true });
    expect(mocks.getUserRouter).toHaveBeenCalledWith(params.srcAddress, sodax.hubProvider);
    // The union type doesn't expose `spender` on every variant; cast to inspect it.
    const call = spy.mock.calls[0]?.[0] as { spender?: string };
    expect(call?.spender).toBe(userRouterAddress);
  });

  it('uses assetManager as spender for bnUSD revert on EVM spoke (non-hub)', async () => {
    const params = bnUSDEvmSpokeParams();
    const spy = vi.spyOn(sodax.spokeService, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

    const result = await sodax.migration.isAllowanceValid(params, 'revert');

    expect(result).toEqual({ ok: true, value: true });
    expect(mocks.getUserRouter).not.toHaveBeenCalled();
    const call = spy.mock.calls[0]?.[0] as { spender?: string };
    expect(call?.spender).toBe(sodax.config.sodaxConfig.chains[ChainKeys.BSC_MAINNET].addresses.assetManager);
  });

  it('delegates to spoke.isAllowanceValid for bnUSD revert on Stellar', async () => {
    const params = bnUSDStellarParams();
    const spy = vi.spyOn(sodax.spokeService, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

    const result = await sodax.migration.isAllowanceValid(params, 'revert');

    expect(result).toEqual({ ok: true, value: true });
    const call = spy.mock.calls[0]?.[0];
    expect(call).not.toHaveProperty('spender');
  });

  it('returns ok:false when amount is 0', async () => {
    const result = await sodax.migration.isAllowanceValid({ ...icxRevertParams(), amount: 0n }, 'revert');
    expect(result.ok).toBe(false);
  });

  it('returns ok:false when dstAddress is empty', async () => {
    const result = await sodax.migration.isAllowanceValid(
      { ...icxRevertParams(), dstAddress: '' as IconEoaAddress },
      'revert',
    );
    expect(result.ok).toBe(false);
  });
});

describe('MigrationService.isAllowanceValid — invalid action', () => {
  it('returns ok:false with "Invalid action" for an unrecognized action string', async () => {
    // Casting to bypass the union — we want to exercise the runtime fallthrough that
    // exists explicitly to guard against bad callers passing invalid strings.
    const result = await sodax.migration.isAllowanceValid(icxMigrateParams(), 'wrong' as unknown as 'migrate');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Invalid action/);
    }
  });

  it('forwards a thrown error from spoke.isAllowanceValid as-is', async () => {
    const spokeError = new Error('SPOKE_RPC_DOWN');
    vi.spyOn(sodax.spokeService, 'isAllowanceValid').mockRejectedValueOnce(spokeError);

    const result = await sodax.migration.isAllowanceValid(bnUSDEvmSpokeParams(), 'migrate');

    expect(result).toEqual({ ok: false, error: spokeError });
  });
});

// =========================================================================
// approve
// =========================================================================

describe('MigrationService.approve — migrate', () => {
  it('approves bnUSD on EVM spoke (raw=false) — forwards walletProvider', async () => {
    const params = bnUSDEvmSpokeParams();
    const approveSpy = vi.spyOn(sodax.spokeService, 'approve').mockResolvedValueOnce({ ok: true, value: '0xapprove' });

    const result = await sodax.migration.approve({ params, raw: false, walletProvider: mockEvmProvider }, 'migrate');

    expect(result).toEqual({ ok: true, value: '0xapprove' });
    const call = approveSpy.mock.calls[0]?.[0];
    expect(call).toMatchObject({
      srcChainKey: ChainKeys.BSC_MAINNET,
      token: params.srcbnUSD,
      amount: params.amount,
      owner: params.srcAddress,
      spender: sodax.config.sodaxConfig.chains[ChainKeys.BSC_MAINNET].addresses.assetManager,
      raw: false,
      walletProvider: mockEvmProvider,
    });
  });

  it('approves bnUSD on EVM spoke (raw=true) — does not include walletProvider', async () => {
    const params = bnUSDEvmSpokeParams();
    const rawTx = { from: '0x1', to: '0x2', value: 0n, data: '0x' };
    const approveSpy = vi.spyOn(sodax.spokeService, 'approve').mockResolvedValueOnce({ ok: true, value: rawTx });

    const result = await sodax.migration.approve({ params, raw: true }, 'migrate');

    expect(result.ok).toBe(true);
    const call = approveSpy.mock.calls[0]?.[0];
    expect(call?.raw).toBe(true);
    expect(call).not.toHaveProperty('walletProvider');
  });

  it('approves bnUSD on Stellar (raw=false) — forwards Stellar walletProvider', async () => {
    const params = bnUSDStellarParams();
    const approveSpy = vi
      .spyOn(sodax.spokeService, 'approve')
      .mockResolvedValueOnce({ ok: true, value: '0xstellar-approve' });

    const result = await sodax.migration.approve(
      { params, raw: false, walletProvider: mockStellarProvider },
      'migrate',
    );

    expect(result).toEqual({ ok: true, value: '0xstellar-approve' });
    const call = approveSpy.mock.calls[0]?.[0];
    expect(call).toMatchObject({
      srcChainKey: ChainKeys.STELLAR_MAINNET,
      token: params.srcbnUSD,
      raw: false,
      walletProvider: mockStellarProvider,
    });
    // Stellar trustline params must NOT include `spender` (EVM-only).
    expect(call).not.toHaveProperty('spender');
  });

  it('approves bnUSD on Stellar (raw=true) — no walletProvider in the spoke call', async () => {
    const params = bnUSDStellarParams();
    const rawTx = { from: 'stellar1', to: 'stellar2', value: 0n, data: '0x' };
    const approveSpy = vi.spyOn(sodax.spokeService, 'approve').mockResolvedValueOnce({ ok: true, value: rawTx });

    const result = await sodax.migration.approve({ params, raw: true }, 'migrate');

    expect(result.ok).toBe(true);
    const call = approveSpy.mock.calls[0]?.[0];
    expect(call?.raw).toBe(true);
    expect(call).not.toHaveProperty('walletProvider');
  });

  it('rejects with "Invalid wallet provider" when EVM spoke params get a non-EVM provider', async () => {
    const params = bnUSDEvmSpokeParams();
    const result = await sodax.migration.approve(
      // Defeat the compile-time narrowing to test the runtime invariant.
      { params, raw: false, walletProvider: mockStellarProvider } as unknown as Parameters<
        typeof sodax.migration.approve
      >[0],
      'migrate',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Invalid wallet provider/);
    }
  });

  it('rejects with "Invalid wallet provider" when Stellar params get a non-Stellar provider', async () => {
    const params = bnUSDStellarParams();
    const result = await sodax.migration.approve(
      { params, raw: false, walletProvider: mockEvmProvider } as unknown as Parameters<
        typeof sodax.migration.approve
      >[0],
      'migrate',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Invalid wallet provider/);
    }
  });

  it('returns ok:false with "Invalid params for migrate action" when the chain is neither EVM-spoke nor Stellar', async () => {
    // A bnUSD migrate request from Solana — neither branch matches, so the trailing
    // "Invalid params for migrate action" return fires.
    const params: UnifiedBnUSDMigrateParams<typeof ChainKeys.SOLANA_MAINNET> = {
      srcAddress: 'SoLaNaSrCaDdReSs',
      srcChainKey: ChainKeys.SOLANA_MAINNET,
      srcbnUSD: '3rSPCLNEF7Quw4wX8S1NyKivELoyij8eYA2gJwBgt4V5',
      dstChainKey: ChainKeys.ICON_MAINNET,
      dstbnUSD: iconBnUSDAddress,
      amount: 1n,
      dstAddress: iconEoaAddress,
    };
    const result = await sodax.migration.approve({ params, raw: false, walletProvider: mockSolanaProvider }, 'migrate');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Invalid params for migrate action/);
    }
  });

  it('returns ok:false with "Amount must be greater than 0" when amount is 0', async () => {
    const params = { ...bnUSDEvmSpokeParams(), amount: 0n };
    const result = await sodax.migration.approve({ params, raw: false, walletProvider: mockEvmProvider }, 'migrate');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Amount must be greater than 0/);
    }
  });

  it('forwards a failure Result from spoke.approve unchanged', async () => {
    const approveError = new Error('APPROVE_REJECTED');
    vi.spyOn(sodax.spokeService, 'approve').mockResolvedValueOnce({ ok: false, error: approveError });

    const result = await sodax.migration.approve(
      { params: bnUSDEvmSpokeParams(), raw: false, walletProvider: mockEvmProvider },
      'migrate',
    );

    expect(result).toEqual({ ok: false, error: approveError });
  });
});

describe('MigrationService.approve — revert', () => {
  it('approves bnUSD revert on EVM spoke — uses assetManager as spender', async () => {
    const params = bnUSDEvmSpokeParams();
    const approveSpy = vi
      .spyOn(sodax.spokeService, 'approve')
      .mockResolvedValueOnce({ ok: true, value: '0xrevert-approve' });

    const result = await sodax.migration.approve({ params, raw: false, walletProvider: mockEvmProvider }, 'revert');

    expect(result).toEqual({ ok: true, value: '0xrevert-approve' });
    expect(mocks.getUserRouter).not.toHaveBeenCalled();
    const call = approveSpy.mock.calls[0]?.[0] as { spender?: string };
    expect(call?.spender).toBe(sodax.config.sodaxConfig.chains[ChainKeys.BSC_MAINNET].addresses.assetManager);
  });

  it('returns ok:false for bnUSD revert on Sonic (hub) — the EVM-spoke branch excludes hub by design', async () => {
    // The bnUSD branch in `approve` uses `isEvmSpokeOnlyChainKeyType`, which excludes Sonic.
    // Sonic→Icon bnUSD revert therefore falls through to the trailing "Invalid params or
    // chain type for revert action". The hub-side ternary inside the EVM-spoke branch is
    // unreachable dead code — flagged here as a gap for follow-up.
    const params = bnUSDNewToLegacyParams();
    const result = await sodax.migration.approve({ params, raw: false, walletProvider: mockEvmProvider }, 'revert');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Invalid params or chain type for revert action/);
    }
  });

  it('approves ICX revert on Sonic (hub) — token is the SODA token, spender is the user wallet', async () => {
    const params = icxRevertParams();
    mocks.getUserHubWalletAddress.mockResolvedValueOnce(userRouterAddress);
    const approveSpy = vi
      .spyOn(sodax.spokeService, 'approve')
      .mockResolvedValueOnce({ ok: true, value: '0xicx-revert-approve' });

    const result = await sodax.migration.approve({ params, raw: false, walletProvider: mockEvmProvider }, 'revert');

    expect(result).toEqual({ ok: true, value: '0xicx-revert-approve' });
    const call = approveSpy.mock.calls[0]?.[0];
    expect(call).toMatchObject({
      srcChainKey: ChainKeys.SONIC_MAINNET,
      token: sodax.hubProvider.chainConfig.addresses.sodaToken,
      amount: params.amount,
      owner: params.srcAddress,
      spender: userRouterAddress,
      raw: false,
      walletProvider: mockEvmProvider,
    });
  });

  it('approves ICX revert on Sonic with raw=true — no walletProvider in the spoke call', async () => {
    const params = icxRevertParams();
    const rawTx = { from: '0x1', to: '0x2', value: 0n, data: '0x' };
    const approveSpy = vi.spyOn(sodax.spokeService, 'approve').mockResolvedValueOnce({ ok: true, value: rawTx });

    const result = await sodax.migration.approve({ params, raw: true }, 'revert');

    expect(result.ok).toBe(true);
    const call = approveSpy.mock.calls[0]?.[0];
    expect(call?.raw).toBe(true);
    expect(call).not.toHaveProperty('walletProvider');
  });

  it('approves bnUSD revert on Stellar (raw=false)', async () => {
    const params = bnUSDStellarParams();
    const approveSpy = vi
      .spyOn(sodax.spokeService, 'approve')
      .mockResolvedValueOnce({ ok: true, value: '0xrevert-stellar' });

    const result = await sodax.migration.approve({ params, raw: false, walletProvider: mockStellarProvider }, 'revert');

    expect(result.ok).toBe(true);
    const call = approveSpy.mock.calls[0]?.[0];
    expect(call?.srcChainKey).toBe(ChainKeys.STELLAR_MAINNET);
    expect(call).not.toHaveProperty('spender');
  });

  it('approves bnUSD revert on EVM spoke (raw=true) — no walletProvider in the spoke call', async () => {
    const params = bnUSDEvmSpokeParams();
    const rawTx = { from: '0x1', to: '0x2', value: 0n, data: '0x' };
    const approveSpy = vi.spyOn(sodax.spokeService, 'approve').mockResolvedValueOnce({ ok: true, value: rawTx });

    const result = await sodax.migration.approve({ params, raw: true }, 'revert');

    expect(result.ok).toBe(true);
    const call = approveSpy.mock.calls[0]?.[0];
    expect(call?.raw).toBe(true);
    expect(call).not.toHaveProperty('walletProvider');
  });

  it('approves bnUSD revert on Stellar (raw=true) — no walletProvider in the spoke call', async () => {
    const params = bnUSDStellarParams();
    const rawTx = { from: 'stellar1', to: 'stellar2', value: 0n, data: '0x' };
    const approveSpy = vi.spyOn(sodax.spokeService, 'approve').mockResolvedValueOnce({ ok: true, value: rawTx });

    const result = await sodax.migration.approve({ params, raw: true }, 'revert');

    expect(result.ok).toBe(true);
    const call = approveSpy.mock.calls[0]?.[0];
    expect(call?.raw).toBe(true);
    expect(call).not.toHaveProperty('walletProvider');
  });

  it('returns ok:false when neither bnUSD-EVM-spoke / bnUSD-Stellar / icx-hub matches', async () => {
    // bnUSD revert on Solana — none of the three revert branches match.
    const params: UnifiedBnUSDMigrateParams<typeof ChainKeys.SOLANA_MAINNET> = {
      srcAddress: 'SoLaNaSrCaDdReSs',
      srcChainKey: ChainKeys.SOLANA_MAINNET,
      srcbnUSD: '3rSPCLNEF7Quw4wX8S1NyKivELoyij8eYA2gJwBgt4V5',
      dstChainKey: ChainKeys.ICON_MAINNET,
      dstbnUSD: iconBnUSDAddress,
      amount: 1n,
      dstAddress: iconEoaAddress,
    };

    const result = await sodax.migration.approve({ params, raw: false, walletProvider: mockSolanaProvider }, 'revert');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Invalid params or chain type for revert action/);
    }
  });

  it('forwards a thrown error from spoke.approve as a Result.error', async () => {
    const approveError = new Error('SPOKE_APPROVE_THROWS');
    vi.spyOn(sodax.spokeService, 'approve').mockRejectedValueOnce(approveError);

    const result = await sodax.migration.approve(
      { params: bnUSDEvmSpokeParams(), raw: false, walletProvider: mockEvmProvider },
      'revert',
    );

    expect(result).toEqual({ ok: false, error: approveError });
  });

  it('returns ok:false with "Invalid action" for an unrecognized action string', async () => {
    const result = await sodax.migration.approve(
      { params: bnUSDEvmSpokeParams(), raw: false, walletProvider: mockEvmProvider },
      'wrong' as unknown as 'migrate',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Invalid action/);
    }
  });
});

// =========================================================================
// migratebnUSD — facade method that orchestrates create + verify + relay + (optional) wait
// =========================================================================

describe('MigrationService.migratebnUSD', () => {
  it('on success, returns [spokeTxHash, hubTxHash] from createMigratebnUSDIntent + relayTxAndWaitPacket', async () => {
    const extraData = { address: hubWalletAddress, payload: '0xpayload' } as const;
    vi.spyOn(sodax.migration, 'createMigratebnUSDIntent').mockResolvedValueOnce({
      ok: true,
      value: [spokeTxHash, extraData],
    });
    mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: true, value: okPacket });

    const result = await sodax.migration.migratebnUSD({
      params: bnUSDLegacyToNewParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([spokeTxHash, hubTxHash]);
  });

  it('does NOT call waitUntilIntentExecuted when src or dst is Sonic', async () => {
    vi.spyOn(sodax.migration, 'createMigratebnUSDIntent').mockResolvedValueOnce({
      ok: true,
      value: [spokeTxHash, { address: hubWalletAddress, payload: '0xp' }],
    });
    mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: true, value: okPacket });

    await sodax.migration.migratebnUSD({
      params: bnUSDLegacyToNewParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    // Sonic on either end → relay packet is the final step. Skip the hub→spoke wait.
    expect(mocks.waitUntilIntentExecuted).not.toHaveBeenCalled();
  });

  it('calls waitUntilIntentExecuted when neither src nor dst is Sonic', async () => {
    // Stellar→Icon: Sonic is the hub but NEITHER endpoint, so the hub→spoke leg must wait.
    const params = bnUSDStellarParams();
    const stellarToIcon: UnifiedBnUSDMigrateParams<typeof ChainKeys.STELLAR_MAINNET> = {
      ...params,
      dstChainKey: ChainKeys.ICON_MAINNET,
      dstbnUSD: iconBnUSDAddress,
      dstAddress: iconEoaAddress,
    };
    vi.spyOn(sodax.migration, 'createMigratebnUSDIntent').mockResolvedValueOnce({
      ok: true,
      value: [spokeTxHash, { address: hubWalletAddress, payload: '0xp' }],
    });
    mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: true, value: okPacket });
    mocks.waitUntilIntentExecuted.mockResolvedValueOnce({ ok: true, value: okPacket });

    await sodax.migration.migratebnUSD({
      params: stellarToIcon,
      raw: false,
      walletProvider: mockStellarProvider,
    });

    expect(mocks.waitUntilIntentExecuted).toHaveBeenCalledTimes(1);
    const waitCall = mocks.waitUntilIntentExecuted.mock.calls[0]?.[0];
    // Hub→spoke wait runs against Sonic's relay chain id with the hub tx hash from the
    // packet we just received.
    expect(waitCall?.spokeTxHash).toBe(okPacket.dst_tx_hash);
    expect(waitCall?.apiUrl).toBe(sodax.migration.relayerApiEndpoint);
  });

  it('passes extraData to relayTxAndWaitPacket on Solana srcChain', async () => {
    const params: UnifiedBnUSDMigrateParams<typeof ChainKeys.SOLANA_MAINNET> = {
      srcAddress: 'SoLaNaSrCaDdReSs',
      srcChainKey: ChainKeys.SOLANA_MAINNET,
      srcbnUSD: '3rSPCLNEF7Quw4wX8S1NyKivELoyij8eYA2gJwBgt4V5',
      dstChainKey: ChainKeys.SONIC_MAINNET,
      dstbnUSD: sonicBnUSDAddress,
      amount: 1n,
      dstAddress: evmAddress,
    };
    const extraData = { address: hubWalletAddress, payload: '0xsolana-payload' } as const;
    vi.spyOn(sodax.migration, 'createMigratebnUSDIntent').mockResolvedValueOnce({
      ok: true,
      value: [spokeTxHash, extraData],
    });
    mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: true, value: okPacket });

    await sodax.migration.migratebnUSD({ params, raw: false, walletProvider: mockSolanaProvider });

    // Solana / Bitcoin: relayer needs full off-chain data. Other chains pass `undefined`.
    expect(mocks.relayTxAndWaitPacket.mock.calls[0]?.[1]).toEqual(extraData);
  });

  it('passes undefined extraData to relayTxAndWaitPacket on non-Solana/Bitcoin chains', async () => {
    vi.spyOn(sodax.migration, 'createMigratebnUSDIntent').mockResolvedValueOnce({
      ok: true,
      value: [spokeTxHash, { address: hubWalletAddress, payload: '0xp' }],
    });
    mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: true, value: okPacket });

    await sodax.migration.migratebnUSD({
      params: bnUSDLegacyToNewParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(mocks.relayTxAndWaitPacket.mock.calls[0]?.[1]).toBeUndefined();
  });

  it('forwards a createMigratebnUSDIntent failure as Result.error', async () => {
    const createError = new Error('CREATE_INTENT_FAILED');
    vi.spyOn(sodax.migration, 'createMigratebnUSDIntent').mockResolvedValueOnce({
      ok: false,
      error: createError,
    });

    const result = await sodax.migration.migratebnUSD({
      params: bnUSDLegacyToNewParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: false, error: createError });
    expect(mocks.relayTxAndWaitPacket).not.toHaveBeenCalled();
  });

  it('forwards a verifyTxHash failure as Result.error', async () => {
    vi.spyOn(sodax.migration, 'createMigratebnUSDIntent').mockResolvedValueOnce({
      ok: true,
      value: [spokeTxHash, { address: hubWalletAddress, payload: '0xp' }],
    });
    const verifyError = new Error('TX_NOT_FOUND');
    vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: false, error: verifyError });

    const result = await sodax.migration.migratebnUSD({
      params: bnUSDLegacyToNewParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: false, error: verifyError });
    expect(mocks.relayTxAndWaitPacket).not.toHaveBeenCalled();
  });

  it('forwards a relayTxAndWaitPacket failure as Result.error', async () => {
    vi.spyOn(sodax.migration, 'createMigratebnUSDIntent').mockResolvedValueOnce({
      ok: true,
      value: [spokeTxHash, { address: hubWalletAddress, payload: '0xp' }],
    });
    const relayError = new Error('RELAY_TIMEOUT');
    mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: false, error: relayError });

    const result = await sodax.migration.migratebnUSD({
      params: bnUSDLegacyToNewParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: false, error: relayError });
  });

  it('returns ok:false when an internal call throws', async () => {
    const thrownError = new Error('UNEXPECTED');
    vi.spyOn(sodax.migration, 'createMigratebnUSDIntent').mockRejectedValueOnce(thrownError);

    const result = await sodax.migration.migratebnUSD({
      params: bnUSDLegacyToNewParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: false, error: thrownError });
  });
});

// =========================================================================
// migrateIcxToSoda — facade
// =========================================================================

describe('MigrationService.migrateIcxToSoda', () => {
  it('on success, returns [spokeTxHash, hubTxHash]', async () => {
    vi.spyOn(sodax.migration, 'createMigrateIcxToSodaIntent').mockResolvedValueOnce({
      ok: true,
      value: spokeTxHash,
    });
    mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: true, value: okPacket });

    const result = await sodax.migration.migrateIcxToSoda({
      params: icxMigrateParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([spokeTxHash, hubTxHash]);
    // Icon migrations don't need extraData on the relay call.
    expect(mocks.relayTxAndWaitPacket.mock.calls[0]?.[1]).toBeUndefined();
  });

  it('forwards a createMigrateIcxToSodaIntent failure as Result.error', async () => {
    const intentError = new Error('CREATE_FAILED');
    vi.spyOn(sodax.migration, 'createMigrateIcxToSodaIntent').mockResolvedValueOnce({
      ok: false,
      error: intentError,
    });

    const result = await sodax.migration.migrateIcxToSoda({
      params: icxMigrateParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: false, error: intentError });
    expect(mocks.relayTxAndWaitPacket).not.toHaveBeenCalled();
  });

  it('forwards a relayTxAndWaitPacket failure as Result.error', async () => {
    vi.spyOn(sodax.migration, 'createMigrateIcxToSodaIntent').mockResolvedValueOnce({
      ok: true,
      value: spokeTxHash,
    });
    const relayError = new Error('RELAY_TIMEOUT');
    mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: false, error: relayError });

    const result = await sodax.migration.migrateIcxToSoda({
      params: icxMigrateParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: false, error: relayError });
  });

  it('returns ok:false when an internal call throws', async () => {
    const thrownError = new Error('UNEXPECTED');
    vi.spyOn(sodax.migration, 'createMigrateIcxToSodaIntent').mockRejectedValueOnce(thrownError);

    const result = await sodax.migration.migrateIcxToSoda({
      params: icxMigrateParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: false, error: thrownError });
  });
});

// =========================================================================
// revertMigrateSodaToIcx — facade
// =========================================================================

describe('MigrationService.revertMigrateSodaToIcx', () => {
  it('on success, returns [hubTxHash, spokeTxHash] and relays via Sonic', async () => {
    vi.spyOn(sodax.migration, 'createRevertSodaToIcxMigrationIntent').mockResolvedValueOnce({
      ok: true,
      value: spokeTxHash,
    });
    mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: true, value: okPacket });

    const result = await sodax.migration.revertMigrateSodaToIcx({
      params: icxRevertParams(),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([spokeTxHash, hubTxHash]);
    // Revert always runs from the hub (Sonic) — relay must use SONIC_MAINNET.
    expect(mocks.relayTxAndWaitPacket.mock.calls[0]?.[2]).toBe(ChainKeys.SONIC_MAINNET);
  });

  it('forwards a createRevertSodaToIcxMigrationIntent failure as Result.error', async () => {
    const intentError = new Error('CREATE_REVERT_FAILED');
    vi.spyOn(sodax.migration, 'createRevertSodaToIcxMigrationIntent').mockResolvedValueOnce({
      ok: false,
      error: intentError,
    });

    const result = await sodax.migration.revertMigrateSodaToIcx({
      params: icxRevertParams(),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: intentError });
  });

  it('forwards a relay failure as Result.error', async () => {
    vi.spyOn(sodax.migration, 'createRevertSodaToIcxMigrationIntent').mockResolvedValueOnce({
      ok: true,
      value: spokeTxHash,
    });
    const relayError = new Error('RELAY_TIMEOUT');
    mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: false, error: relayError });

    const result = await sodax.migration.revertMigrateSodaToIcx({
      params: icxRevertParams(),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: relayError });
  });

  it('returns ok:false when an internal call throws', async () => {
    const thrownError = new Error('UNEXPECTED');
    vi.spyOn(sodax.migration, 'createRevertSodaToIcxMigrationIntent').mockRejectedValueOnce(thrownError);

    const result = await sodax.migration.revertMigrateSodaToIcx({
      params: icxRevertParams(),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: thrownError });
  });
});

// =========================================================================
// migrateBaln — facade
// =========================================================================

describe('MigrationService.migrateBaln', () => {
  it('on success, returns [spokeTxHash, hubTxHash] and relays via ICON', async () => {
    vi.spyOn(sodax.migration, 'createMigrateBalnIntent').mockResolvedValueOnce({
      ok: true,
      value: spokeTxHash,
    });
    mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: true, value: okPacket });

    const result = await sodax.migration.migrateBaln({
      params: balnMigrateParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([spokeTxHash, hubTxHash]);
    // BALN swap is initiated from ICON; relay must reflect that.
    expect(mocks.relayTxAndWaitPacket.mock.calls[0]?.[2]).toBe(ChainKeys.ICON_MAINNET);
  });

  it('forwards a createMigrateBalnIntent failure as Result.error', async () => {
    const intentError = new Error('CREATE_BALN_FAILED');
    vi.spyOn(sodax.migration, 'createMigrateBalnIntent').mockResolvedValueOnce({
      ok: false,
      error: intentError,
    });

    const result = await sodax.migration.migrateBaln({
      params: balnMigrateParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: false, error: intentError });
  });

  it('forwards a relay failure as Result.error', async () => {
    vi.spyOn(sodax.migration, 'createMigrateBalnIntent').mockResolvedValueOnce({
      ok: true,
      value: spokeTxHash,
    });
    const relayError = new Error('RELAY_TIMEOUT');
    mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: false, error: relayError });

    const result = await sodax.migration.migrateBaln({
      params: balnMigrateParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: false, error: relayError });
  });

  it('returns ok:false when an internal call throws', async () => {
    const thrownError = new Error('UNEXPECTED');
    vi.spyOn(sodax.migration, 'createMigrateBalnIntent').mockRejectedValueOnce(thrownError);

    const result = await sodax.migration.migrateBaln({
      params: balnMigrateParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: false, error: thrownError });
  });
});

// =========================================================================
// createMigrateBalnIntent — spoke deposit + sub-service swapData
// =========================================================================

describe('MigrationService.createMigrateBalnIntent', () => {
  it('forwards balnSwapService.swapData output to spoke.deposit (raw=false)', async () => {
    const swapDataSpy = vi.spyOn(sodax.migration.balnSwapService, 'swapData').mockReturnValueOnce('0xbaln-data');
    const depositSpy = vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: true, value: spokeTxHash });

    const result = await sodax.migration.createMigrateBalnIntent({
      params: balnMigrateParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: true, value: spokeTxHash });
    expect(swapDataSpy).toHaveBeenCalledTimes(1);
    const depositCall = depositSpy.mock.calls[0]?.[0];
    expect(depositCall).toMatchObject({
      srcChainKey: ChainKeys.ICON_MAINNET,
      to: hubWalletAddress,
      data: '0xbaln-data',
      raw: false,
      walletProvider: mockIconProvider,
    });
  });

  it('builds raw deposit params (no walletProvider) when raw=true', async () => {
    vi.spyOn(sodax.migration.balnSwapService, 'swapData').mockReturnValueOnce('0xbaln-data');
    const rawTx = { from: 'cx1', to: 'cx2', value: 0n, data: '0x' };
    const depositSpy = vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: true, value: rawTx });

    const result = await sodax.migration.createMigrateBalnIntent({ params: balnMigrateParams(), raw: true });

    expect(result.ok).toBe(true);
    const depositCall = depositSpy.mock.calls[0]?.[0];
    expect(depositCall?.raw).toBe(true);
    expect(depositCall).not.toHaveProperty('walletProvider');
  });

  it('forwards a deposit failure as Result.error', async () => {
    vi.spyOn(sodax.migration.balnSwapService, 'swapData').mockReturnValueOnce('0xbaln-data');
    const depositError = new Error('DEPOSIT_REJECTED');
    vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: false, error: depositError });

    const result = await sodax.migration.createMigrateBalnIntent({
      params: balnMigrateParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: false, error: depositError });
  });

  it('returns ok:false when getUserHubWalletAddress rejects', async () => {
    const hubError = new Error('HUB_LOOKUP_FAILED');
    mocks.getUserHubWalletAddress.mockRejectedValueOnce(hubError);
    vi.spyOn(sodax.migration.balnSwapService, 'swapData').mockReturnValueOnce('0xbaln-data');

    const result = await sodax.migration.createMigrateBalnIntent({
      params: balnMigrateParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: false, error: hubError });
  });

  it('returns ok:false when balnSwapService.swapData throws', async () => {
    const swapDataError = new Error('BALN_TOKEN_NOT_FOUND');
    vi.spyOn(sodax.migration.balnSwapService, 'swapData').mockImplementationOnce(() => {
      throw swapDataError;
    });

    const result = await sodax.migration.createMigrateBalnIntent({
      params: balnMigrateParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: false, error: swapDataError });
  });
});

// =========================================================================
// createMigratebnUSDIntent — heaviest method, branches on legacy/new + chain key
// =========================================================================

describe('MigrationService.createMigratebnUSDIntent — happy paths', () => {
  it('on legacy→new (Icon→Sonic), calls bnUSDMigrationService.migrateData and deposits', async () => {
    const params = bnUSDLegacyToNewParams();
    const migrateDataSpy = vi
      .spyOn(sodax.migration.bnUSDMigrationService, 'migrateData')
      .mockReturnValueOnce('0xbnusd-migrate-data');
    const depositSpy = vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: true, value: spokeTxHash });

    const result = await sodax.migration.createMigratebnUSDIntent({
      params,
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value[0]).toBe(spokeTxHash);
      // RelayExtraData is { address, payload } — payload must be the migrationData we built.
      expect(result.value[1]).toEqual({ address: hubWalletAddress, payload: '0xbnusd-migrate-data' });
    }
    expect(migrateDataSpy).toHaveBeenCalledTimes(1);
    expect(mocks.encodeAddress).toHaveBeenCalledWith(params.dstChainKey, params.dstAddress);
    const depositCall = depositSpy.mock.calls[0]?.[0];
    expect(depositCall).toMatchObject({
      srcChainKey: ChainKeys.ICON_MAINNET,
      to: hubWalletAddress,
      token: params.srcbnUSD,
      amount: params.amount,
      data: '0xbnusd-migrate-data',
    });
  });

  it('on new→legacy (Sonic→Icon), calls bnUSDMigrationService.revertMigrationData', async () => {
    const params = bnUSDNewToLegacyParams();
    const revertDataSpy = vi
      .spyOn(sodax.migration.bnUSDMigrationService, 'revertMigrationData')
      .mockReturnValueOnce('0xbnusd-revert-data');
    vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: true, value: spokeTxHash });

    const result = await sodax.migration.createMigratebnUSDIntent({
      params,
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result.ok).toBe(true);
    expect(revertDataSpy).toHaveBeenCalledTimes(1);
  });

  it('builds raw deposit params when raw=true', async () => {
    vi.spyOn(sodax.migration.bnUSDMigrationService, 'migrateData').mockReturnValueOnce('0xdata');
    const rawTx = { from: 'hx1', to: 'cx2', value: 0n, data: '0x' };
    const depositSpy = vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: true, value: rawTx });

    const result = await sodax.migration.createMigratebnUSDIntent({
      params: bnUSDLegacyToNewParams(),
      raw: true,
    });

    expect(result.ok).toBe(true);
    const depositCall = depositSpy.mock.calls[0]?.[0];
    expect(depositCall?.raw).toBe(true);
    expect(depositCall).not.toHaveProperty('walletProvider');
  });

  it('skips invariants when unchecked=true', async () => {
    // Force the legacy spoke chain key check to false; with unchecked=true, the call
    // should still succeed because invariants are bypassed.
    vi.spyOn(sodax.config, 'isValidSpokeChainKey').mockReturnValue(false);
    vi.spyOn(sodax.migration.bnUSDMigrationService, 'migrateData').mockReturnValueOnce('0xdata');
    vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: true, value: spokeTxHash });

    const result = await sodax.migration.createMigratebnUSDIntent({
      params: bnUSDLegacyToNewParams(),
      raw: false,
      walletProvider: mockIconProvider,
      unchecked: true,
    });

    expect(result.ok).toBe(true);
  });
});

describe('MigrationService.createMigratebnUSDIntent — invariant failures', () => {
  it('returns ok:false when srcChainKey is not a valid spoke chain key', async () => {
    vi.spyOn(sodax.config, 'isValidSpokeChainKey').mockReturnValueOnce(false);

    const result = await sodax.migration.createMigratebnUSDIntent({
      params: bnUSDLegacyToNewParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Invalid spoke source chain key/);
    }
  });

  it('returns ok:false when dstChainKey is not a valid spoke chain key', async () => {
    vi.spyOn(sodax.config, 'isValidSpokeChainKey').mockReturnValueOnce(true).mockReturnValueOnce(false);

    const result = await sodax.migration.createMigratebnUSDIntent({
      params: bnUSDLegacyToNewParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Invalid spoke destination chain key/);
    }
  });

  it('returns ok:false when srcbnUSD is empty', async () => {
    const result = await sodax.migration.createMigratebnUSDIntent({
      params: { ...bnUSDLegacyToNewParams(), srcbnUSD: '' },
      raw: false,
      walletProvider: mockIconProvider,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Legacy bnUSD token address is required/);
    }
  });

  it('returns ok:false when dstbnUSD is empty', async () => {
    const result = await sodax.migration.createMigratebnUSDIntent({
      params: { ...bnUSDLegacyToNewParams(), dstbnUSD: '' },
      raw: false,
      walletProvider: mockIconProvider,
    });
    expect(result.ok).toBe(false);
  });

  it('returns ok:false when amount is 0', async () => {
    const result = await sodax.migration.createMigratebnUSDIntent({
      params: { ...bnUSDLegacyToNewParams(), amount: 0n },
      raw: false,
      walletProvider: mockIconProvider,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Amount must be greater than 0/);
    }
  });

  it('returns ok:false when dstAddress is empty', async () => {
    const result = await sodax.migration.createMigratebnUSDIntent({
      params: { ...bnUSDLegacyToNewParams(), dstAddress: '' },
      raw: false,
      walletProvider: mockIconProvider,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Recipient address is required/);
    }
  });

  it('returns ok:false when both srcbnUSD and dstbnUSD are legacy bnUSD', async () => {
    const result = await sodax.migration.createMigratebnUSDIntent({
      params: { ...bnUSDLegacyToNewParams(), dstbnUSD: iconBnUSDAddress },
      raw: false,
      walletProvider: mockIconProvider,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/cannot both be legacy bnUSD tokens/);
    }
  });

  it('returns ok:false when neither srcbnUSD nor dstbnUSD is a legacy bnUSD token (unchecked=true)', async () => {
    // With unchecked=true the invariant block is skipped; the only remaining check is the
    // explicit `throw new Error('srcbnUSD or dstbnUSD must be a legacy bnUSD token')`.
    const params: UnifiedBnUSDMigrateParams<typeof ChainKeys.SONIC_MAINNET> = {
      ...bnUSDNewToLegacyParams(),
      // both addresses are non-legacy
      srcbnUSD: sonicBnUSDAddress,
      dstbnUSD: sonicBnUSDAddress,
    };
    const result = await sodax.migration.createMigratebnUSDIntent({
      params,
      raw: false,
      walletProvider: mockEvmProvider,
      unchecked: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/srcbnUSD or dstbnUSD must be a legacy bnUSD token/);
    }
  });
});

describe('MigrationService.createMigratebnUSDIntent — error propagation', () => {
  it('returns ok:false when getUserHubWalletAddress rejects', async () => {
    const hubError = new Error('HUB_LOOKUP_FAILED');
    mocks.getUserHubWalletAddress.mockRejectedValueOnce(hubError);
    vi.spyOn(sodax.migration.bnUSDMigrationService, 'migrateData').mockReturnValueOnce('0xdata');

    const result = await sodax.migration.createMigratebnUSDIntent({
      params: bnUSDLegacyToNewParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: false, error: hubError });
  });

  it('forwards a deposit failure as Result.error', async () => {
    vi.spyOn(sodax.migration.bnUSDMigrationService, 'migrateData').mockReturnValueOnce('0xdata');
    const depositError = new Error('DEPOSIT_FAILED');
    vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: false, error: depositError });

    const result = await sodax.migration.createMigratebnUSDIntent({
      params: bnUSDLegacyToNewParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: false, error: depositError });
  });

  it('returns ok:false when bnUSDMigrationService.migrateData throws', async () => {
    const dataError = new Error('HUB_ASSET_NOT_FOUND');
    vi.spyOn(sodax.migration.bnUSDMigrationService, 'migrateData').mockImplementationOnce(() => {
      throw dataError;
    });

    const result = await sodax.migration.createMigratebnUSDIntent({
      params: bnUSDLegacyToNewParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: false, error: dataError });
  });
});

// =========================================================================
// createMigrateIcxToSodaIntent — invariants + liquidity check + deposit
// =========================================================================

describe('MigrationService.createMigrateIcxToSodaIntent — happy paths', () => {
  it('returns the deposit tx hash when all invariants pass', async () => {
    vi.spyOn(sodax.migration.icxMigration, 'getAvailableAmount').mockResolvedValueOnce({
      ok: true,
      value: 10_000_000_000_000_000_000n,
    });
    vi.spyOn(sodax.migration.icxMigration, 'migrateData').mockReturnValueOnce('0xicx-migrate-data');
    const depositSpy = vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: true, value: spokeTxHash });

    const result = await sodax.migration.createMigrateIcxToSodaIntent({
      params: icxMigrateParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: true, value: spokeTxHash });
    const depositCall = depositSpy.mock.calls[0]?.[0];
    expect(depositCall).toMatchObject({
      srcChainKey: ChainKeys.ICON_MAINNET,
      to: hubWalletAddress,
      token: wICXAddress,
      data: '0xicx-migrate-data',
    });
  });

  it('builds raw deposit params when raw=true', async () => {
    vi.spyOn(sodax.migration.icxMigration, 'getAvailableAmount').mockResolvedValueOnce({
      ok: true,
      value: 10_000_000_000_000_000_000n,
    });
    vi.spyOn(sodax.migration.icxMigration, 'migrateData').mockReturnValueOnce('0xicx-migrate-data');
    const rawTx = { from: 'hx1', to: 'cx2', value: 0n, data: '0x' };
    const depositSpy = vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: true, value: rawTx });

    const result = await sodax.migration.createMigrateIcxToSodaIntent({ params: icxMigrateParams(), raw: true });

    expect(result.ok).toBe(true);
    const depositCall = depositSpy.mock.calls[0]?.[0];
    expect(depositCall?.raw).toBe(true);
    expect(depositCall).not.toHaveProperty('walletProvider');
  });
});

describe('MigrationService.createMigrateIcxToSodaIntent — invariant failures', () => {
  it('returns ok:false when amount is 0', async () => {
    const result = await sodax.migration.createMigrateIcxToSodaIntent({
      params: { ...icxMigrateParams(), amount: 0n },
      raw: false,
      walletProvider: mockIconProvider,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Amount must be greater than 0/);
    }
  });

  it('returns ok:false when dstAddress is not a valid EVM address', async () => {
    const result = await sodax.migration.createMigrateIcxToSodaIntent({
      params: { ...icxMigrateParams(), dstAddress: '0xinvalid' as Address },
      raw: false,
      walletProvider: mockIconProvider,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Recipient address is required/);
    }
  });

  it('returns ok:false when token is neither wICX nor native ICX', async () => {
    const result = await sodax.migration.createMigrateIcxToSodaIntent({
      params: { ...icxMigrateParams(), address: 'cx1234567890abcdef1234567890abcdef12345678' as IcxTokenType },
      raw: false,
      walletProvider: mockIconProvider,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Token must be wICX or native ICX/);
    }
  });

  it('returns ok:false when srcChainKey is not Icon', async () => {
    const result = await sodax.migration.createMigrateIcxToSodaIntent({
      // Cast: the type forbids this, but the runtime invariant is the safety net.
      params: {
        ...icxMigrateParams(),
        srcChainKey: ChainKeys.SONIC_MAINNET as unknown as typeof ChainKeys.ICON_MAINNET,
      },
      raw: false,
      walletProvider: mockIconProvider,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Source chain key must be an Icon chain/);
    }
  });

  it('returns ok:false when available liquidity is below requested amount', async () => {
    vi.spyOn(sodax.migration.icxMigration, 'getAvailableAmount').mockResolvedValueOnce({
      ok: true,
      value: 1n,
    });

    const result = await sodax.migration.createMigrateIcxToSodaIntent({
      params: icxMigrateParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Insufficient liquidity/);
    }
  });
});

describe('MigrationService.createMigrateIcxToSodaIntent — error propagation', () => {
  it('forwards a getAvailableAmount failure as Result.error', async () => {
    const liquidityError = new Error('LIQUIDITY_LOOKUP_FAILED');
    vi.spyOn(sodax.migration.icxMigration, 'getAvailableAmount').mockResolvedValueOnce({
      ok: false,
      error: liquidityError,
    });

    const result = await sodax.migration.createMigrateIcxToSodaIntent({
      params: icxMigrateParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: false, error: liquidityError });
  });

  it('forwards a deposit failure as Result.error', async () => {
    vi.spyOn(sodax.migration.icxMigration, 'getAvailableAmount').mockResolvedValueOnce({
      ok: true,
      value: 10_000_000_000_000_000_000n,
    });
    vi.spyOn(sodax.migration.icxMigration, 'migrateData').mockReturnValueOnce('0xicx-data');
    const depositError = new Error('DEPOSIT_FAILED');
    vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: false, error: depositError });

    const result = await sodax.migration.createMigrateIcxToSodaIntent({
      params: icxMigrateParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: false, error: depositError });
  });

  it('returns ok:false when getUserHubWalletAddress rejects', async () => {
    vi.spyOn(sodax.migration.icxMigration, 'getAvailableAmount').mockResolvedValueOnce({
      ok: true,
      value: 10_000_000_000_000_000_000n,
    });
    const hubError = new Error('HUB_LOOKUP_FAILED');
    mocks.getUserHubWalletAddress.mockRejectedValueOnce(hubError);

    const result = await sodax.migration.createMigrateIcxToSodaIntent({
      params: icxMigrateParams(),
      raw: false,
      walletProvider: mockIconProvider,
    });

    expect(result).toEqual({ ok: false, error: hubError });
  });
});

// =========================================================================
// createRevertSodaToIcxMigrationIntent
// =========================================================================

describe('MigrationService.createRevertSodaToIcxMigrationIntent', () => {
  it('on success, builds revertMigration data and deposits via the Sonic spoke', async () => {
    const revertMigrationSpy = vi
      .spyOn(sodax.migration.icxMigration, 'revertMigration')
      .mockReturnValueOnce('0xrevert-data');
    const depositSpy = vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: true, value: spokeTxHash });

    const result = await sodax.migration.createRevertSodaToIcxMigrationIntent({
      params: icxRevertParams(),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: true, value: spokeTxHash });
    expect(revertMigrationSpy).toHaveBeenCalledTimes(1);
    const revertCall = revertMigrationSpy.mock.calls[0]?.[0];
    expect(revertCall).toMatchObject({
      wICX: sodax.config.sodaxConfig.chains[ChainKeys.ICON_MAINNET].addresses.wICX,
      amount: icxRevertParams().amount,
      userWallet: hubWalletAddress,
    });
    expect(mocks.encodeAddress).toHaveBeenCalledWith(ChainKeys.ICON_MAINNET, iconEoaAddress);
    const depositCall = depositSpy.mock.calls[0]?.[0];
    expect(depositCall).toMatchObject({
      srcChainKey: ChainKeys.SONIC_MAINNET,
      to: hubWalletAddress,
      token: sodax.hubProvider.chainConfig.addresses.sodaToken,
      data: '0xrevert-data',
    });
  });

  it('builds raw deposit params when raw=true', async () => {
    vi.spyOn(sodax.migration.icxMigration, 'revertMigration').mockReturnValueOnce('0xrevert-data');
    const rawTx = { from: '0x1', to: '0x2', value: 0n, data: '0x' };
    const depositSpy = vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: true, value: rawTx });

    const result = await sodax.migration.createRevertSodaToIcxMigrationIntent({
      params: icxRevertParams(),
      raw: true,
    });

    expect(result.ok).toBe(true);
    const depositCall = depositSpy.mock.calls[0]?.[0];
    expect(depositCall?.raw).toBe(true);
    expect(depositCall).not.toHaveProperty('walletProvider');
  });

  it('returns ok:false when getUserHubWalletAddress rejects', async () => {
    const hubError = new Error('HUB_LOOKUP_FAILED');
    mocks.getUserHubWalletAddress.mockRejectedValueOnce(hubError);

    const result = await sodax.migration.createRevertSodaToIcxMigrationIntent({
      params: icxRevertParams(),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: hubError });
  });

  it('returns ok:false when icxMigration.revertMigration throws', async () => {
    const revertError = new Error('REVERT_DATA_FAILED');
    vi.spyOn(sodax.migration.icxMigration, 'revertMigration').mockImplementationOnce(() => {
      throw revertError;
    });

    const result = await sodax.migration.createRevertSodaToIcxMigrationIntent({
      params: icxRevertParams(),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: revertError });
  });

  it('forwards a deposit failure as Result.error', async () => {
    vi.spyOn(sodax.migration.icxMigration, 'revertMigration').mockReturnValueOnce('0xrevert-data');
    const depositError = new Error('DEPOSIT_FAILED');
    vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: false, error: depositError });

    const result = await sodax.migration.createRevertSodaToIcxMigrationIntent({
      params: icxRevertParams(),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: depositError });
  });
});
