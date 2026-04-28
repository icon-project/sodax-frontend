/**
 * Tests for the strongly-typed SwapService public API.
 *
 * Covers BOTH runtime behavior and type-level correctness. The goal of the refactor is:
 *
 *   1. `srcChainKey: K extends SpokeChainKey` is the generic anchor — it lives at the top
 *      level of every method's params, replacing the old nested `params.srcChain`.
 *   2. `walletProvider` is narrowed via `GetWalletProviderType<K>` so passing an EVM chain
 *      key requires an EVM wallet provider (mismatches fail at compile time).
 *   3. `raw: R` is a required boolean discriminant on swap actions: when `raw: true`, `walletProvider`
 *      is forbidden (`never`); when `raw: false`, `walletProvider` is required.
 *   4. `cancelIntent` takes an explicit `srcChainKey` alongside `intent`; we assert at runtime
 *      that `getIntentRelayChainId(srcChainKey) === intent.srcChain` and throw on mismatch.
 */
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  getIntentRelayChainId,
  type Address,
  type EvmSpokeOnlyChainKey,
  type IBitcoinWalletProvider,
  type IEvmWalletProvider,
  type ISolanaWalletProvider,
  type IStellarWalletProvider,
  type IWalletProvider,
  type Result,
  type SpokeChainKey,
  type TxReturnType,
} from '@sodax/types';
// NOTE: `@sodax/types` is consumed from `dist/` in vitest. In this branch the generated dist entry
// is stale/missing many exports (including ChainKeys/spokeChainConfig), so we import those from
// source to make SDK unit tests runnable.
import { ChainKeys } from '../../../types/src/chains/chain-keys.js';
import { spokeChainConfig } from '../../../types/src/chains/chains.js';
import {
  isEvmChainKeyType,
  isHubChainKeyType,
  isSonicChainKeyType,
  isSpokeApproveParamsStellar,
  isStellarChainKeyType,
  type SpokeApproveParams,
  type SpokeIsAllowanceValidParams,
  type SpokeIsAllowanceValidParamsEvmSpoke,
  type SpokeIsAllowanceValidParamsHub,
} from '../index.js';
import { Sodax } from '../shared/entities/Sodax.js';

// SwapService imports SonicSpokeService, EvmSolverService, HubService, etc. via the SDK barrel
// (`../index.js`). Under Vitest's module graph the barrel's re-export ordering makes a direct
// `vi.spyOn(Foo, ...)` unreliable — the SwapService-internal reference ends up as a different
// module instance than the test-side import. We mock the modules at their source paths so the
// SwapService sees our test doubles. `vi.hoisted` lets the mock factories reference top-level
// bindings safely despite `vi.mock` being hoisted to the file top.
const mocks = vi.hoisted(() => ({
  sonicCreateSwapIntent: vi.fn(),
  constructCreateIntentData: vi.fn(),
  encodeCancelIntent: vi.fn().mockReturnValue({
    address: '0x0000000000000000000000000000000000000000',
    value: 0n,
    data: '0x',
  }),
  encodeCreateIntent: vi.fn().mockReturnValue({
    address: '0x0000000000000000000000000000000000000000',
    value: 0n,
    data: '0x',
  }),
  getIntent: vi.fn(),
  getFilledIntent: vi.fn(),
  getIntentHash: vi.fn(),
  getUserHubWalletAddress: vi.fn(),
  // IntentRelayApiService functions — mocked so the relay-facing methods never hit the network.
  submitTransaction: vi.fn(),
  waitUntilIntentExecuted: vi.fn(),
  relayTxAndWaitPacket: vi.fn(),
  // SolverApiService static methods — same reasoning for getQuote / getStatus / postExecution.
  solverGetQuote: vi.fn(),
  solverGetStatus: vi.fn(),
  solverPostExecution: vi.fn(),
}));
// SonicSpokeService is instantiated by EvmHubProvider + SpokeService (`new SonicSpokeService(config)`)
// AND accessed statically by SwapService (`SonicSpokeService.createSwapIntent(...)`). The mock must
// therefore be a class with the static method attached — a plain object breaks `new`.
vi.mock('../shared/services/spoke/SonicSpokeService.js', () => {
  class SonicSpokeService {
    static createSwapIntent = mocks.sonicCreateSwapIntent;
  }
  return { SonicSpokeService };
});
vi.mock('./EvmSolverService.js', () => ({
  EvmSolverService: {
    constructCreateIntentData: mocks.constructCreateIntentData,
    encodeCancelIntent: mocks.encodeCancelIntent,
    encodeCreateIntent: mocks.encodeCreateIntent,
    getIntent: mocks.getIntent,
    getFilledIntent: mocks.getFilledIntent,
    getIntentHash: mocks.getIntentHash,
  },
}));
vi.mock('../shared/services/hub/HubService.js', () => ({
  HubService: {
    getUserHubWalletAddress: mocks.getUserHubWalletAddress,
  },
}));
// IntentRelayApiService exports a mix of functions and types. We use vi.importActual so the
// type exports survive; only the three network-touching functions are replaced with mocks.
vi.mock('../shared/services/intentRelay/IntentRelayApiService.js', async () => {
  const actual = await vi.importActual<object>('../shared/services/intentRelay/IntentRelayApiService.js');
  return {
    ...actual,
    submitTransaction: mocks.submitTransaction,
    waitUntilIntentExecuted: mocks.waitUntilIntentExecuted,
    relayTxAndWaitPacket: mocks.relayTxAndWaitPacket,
  };
});
vi.mock('./SolverApiService.js', () => ({
  SolverApiService: {
    getQuote: mocks.solverGetQuote,
    getStatus: mocks.solverGetStatus,
    postExecution: mocks.solverPostExecution,
  },
}));
import {
  SwapService,
  type CancelIntentParams,
  type CreateIntentParams,
  type Intent,
  type SwapActionParams,
  type SwapActionParamsRaw,
  type SwapAllowanceParams,
} from './SwapService.js';
import type { WalletProviderSlot } from '../shared/types/types.js';

// --- test fixtures --------------------------------------------------------
//
// A single real Sodax instance backs every test in this file. `new Sodax()` wires up
// the full graph (EvmHubProvider, SpokeService, ConfigService, SwapService, ...) using
// the default sodaxConfig — we then stub behavior per-test via `vi.spyOn(sodax.config, ...)`
// and `vi.spyOn(sodax.spokeService, ...)`. Module-level `vi.mock` above still intercepts
// SonicSpokeService / EvmSolverService / HubService because those are static imports
// inside SwapService.ts that can't be reached through the instance.

const sodax = new Sodax();

// Wallet provider fakes — only used by the type-level tests to prove walletProvider
// narrowing via expectTypeOf / @ts-expect-error. The bodies never execute at runtime.
const mockEvmProvider = {
  chainType: 'EVM',
  sendTransaction: vi.fn(),
  getWalletAddress: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
} as unknown as IEvmWalletProvider;
const mockSolanaProvider = {
  chainType: 'SOLANA',
  sendTransaction: vi.fn(),
  getWalletAddress: vi.fn(),
} as unknown as ISolanaWalletProvider;
const mockBitcoinProvider = {
  chainType: 'BITCOIN',
  getWalletAddress: vi.fn(),
  signMessage: vi.fn(),
} as unknown as IBitcoinWalletProvider;
const mockStellarProvider = {
  chainType: 'STELLAR',
  getWalletAddress: vi.fn(),
  signTransaction: vi.fn(),
} as unknown as IStellarWalletProvider;

// Base user-facing intent params parameterized by source chain. Returning a generic
// `CreateIntentParams<K>` lets the test call sites pass a literal ChainKey and have K
// inferred all the way through to walletProvider narrowing.
const intentInput = <K extends SpokeChainKey>(srcChainKey: K): CreateIntentParams<K> => ({
  inputToken: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
  outputToken: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
  inputAmount: 1_000_000n,
  minOutputAmount: 900_000n,
  deadline: 0n,
  allowPartialFill: false,
  srcChainKey,
  dstChainKey: ChainKeys.ARBITRUM_MAINNET,
  srcAddress: '0x1111111111111111111111111111111111111111',
  dstAddress: '0x2222222222222222222222222222222222222222',
  solver: '0x0000000000000000000000000000000000000000',
  data: '0x',
});

// Compatible Intent fixture for cancelIntent.
function makeIntent(srcChainKey: Parameters<typeof getIntentRelayChainId>[0] = ChainKeys.BSC_MAINNET): Intent {
  return {
    intentId: 1n,
    creator: '0x3333333333333333333333333333333333333333',
    inputToken: '0x4444444444444444444444444444444444444444',
    outputToken: '0x5555555555555555555555555555555555555555',
    inputAmount: 1_000_000n,
    minOutputAmount: 900_000n,
    deadline: 0n,
    allowPartialFill: false,
    srcChain: getIntentRelayChainId(srcChainKey),
    dstChain: getIntentRelayChainId(ChainKeys.ARBITRUM_MAINNET),
    srcAddress: '0x1111111111111111111111111111111111111111',
    dstAddress: '0x2222222222222222222222222222222222222222',
    solver: '0x0000000000000000000000000000000000000000',
    data: '0x',
  };
}

// =========================================================================
// Type-level tests — these use `expectTypeOf` and `@ts-expect-error` to prove
// that the compiler narrows walletProvider on srcChainKey + raw.
// =========================================================================

describe('SwapService types — walletProvider narrowing', () => {
  // WalletProviderSlot is the spoke-layer helper still used by DepositParams / SendMessageParams.
  // Keep its type-level tests here as a regression safety net.
  it('WalletProviderSlot forbids walletProvider when raw is true', () => {
    expectTypeOf<WalletProviderSlot<'0x38.bsc', true>>().toEqualTypeOf<{ raw: true; walletProvider?: never }>();
  });

  it('WalletProviderSlot requires narrowed EVM walletProvider when raw is false', () => {
    expectTypeOf<WalletProviderSlot<'0x38.bsc', false>>().toEqualTypeOf<{
      raw: false;
      walletProvider: IEvmWalletProvider;
    }>();
    expectTypeOf<WalletProviderSlot<'ethereum', false>>().toEqualTypeOf<{
      raw: false;
      walletProvider: IEvmWalletProvider;
    }>();
    expectTypeOf<WalletProviderSlot<'sonic', false>>().toEqualTypeOf<{
      raw: false;
      walletProvider: IEvmWalletProvider;
    }>();
  });

  it('WalletProviderSlot narrows walletProvider to Solana / Stellar / Bitcoin for their respective chain keys', () => {
    expectTypeOf<WalletProviderSlot<'solana', false>>().toEqualTypeOf<{
      raw: false;
      walletProvider: ISolanaWalletProvider;
    }>();
    expectTypeOf<WalletProviderSlot<'stellar', false>>().toEqualTypeOf<{
      raw: false;
      walletProvider: IStellarWalletProvider;
    }>();
    expectTypeOf<WalletProviderSlot<'bitcoin', false>>().toEqualTypeOf<{
      raw: false;
      walletProvider: IBitcoinWalletProvider;
    }>();
  });

  it('SwapActionParams (exec) narrows walletProvider via K inferred from params.srcChain', () => {
    expectTypeOf<SwapActionParams<'0x38.bsc'>['walletProvider']>().toEqualTypeOf<IEvmWalletProvider>();
    expectTypeOf<SwapActionParams<'ethereum'>['walletProvider']>().toEqualTypeOf<IEvmWalletProvider>();
    expectTypeOf<SwapActionParams<'sonic'>['walletProvider']>().toEqualTypeOf<IEvmWalletProvider>();
    expectTypeOf<SwapActionParams<'solana'>['walletProvider']>().toEqualTypeOf<ISolanaWalletProvider>();
    expectTypeOf<SwapActionParams<'stellar'>['walletProvider']>().toEqualTypeOf<IStellarWalletProvider>();
    expectTypeOf<SwapActionParams<'bitcoin'>['walletProvider']>().toEqualTypeOf<IBitcoinWalletProvider>();
  });

  it('SwapActionParamsRaw has no walletProvider property', () => {
    expectTypeOf<SwapActionParamsRaw<'0x38.bsc'>>().not.toHaveProperty('walletProvider');
    expectTypeOf<SwapActionParamsRaw<'bitcoin'>>().not.toHaveProperty('walletProvider');
  });

  it('SwapAllowanceParams narrows walletProvider via the K inferred from params.srcChain', () => {
    expectTypeOf<SwapAllowanceParams<'0x38.bsc'>['walletProvider']>().toEqualTypeOf<IEvmWalletProvider>();
    expectTypeOf<SwapAllowanceParams<'solana'>['walletProvider']>().toEqualTypeOf<ISolanaWalletProvider>();
  });

  it('CancelIntentParams narrows walletProvider via the explicit srcChainKey', () => {
    // cancelIntent keeps the explicit srcChainKey because Intent.srcChain is an
    // IntentRelayChainId (bigint) that can't narrow to a literal ChainKey at the type level.
    expectTypeOf<CancelIntentParams<'0x38.bsc', false>>()
      .toHaveProperty('walletProvider')
      .toEqualTypeOf<IEvmWalletProvider>();
    expectTypeOf<CancelIntentParams<'solana', false>>()
      .toHaveProperty('walletProvider')
      .toEqualTypeOf<ISolanaWalletProvider>();
  });

  it('CreateIntentParams carries srcChainKey (the K generic anchor)', () => {
    expectTypeOf<CreateIntentParams>().toHaveProperty('srcChainKey');
    expectTypeOf<CreateIntentParams<'0x38.bsc'>['srcChainKey']>().toEqualTypeOf<'0x38.bsc'>();
  });

  it('SwapActionParams with unconstrained K falls back to IWalletProvider', () => {
    expectTypeOf<SwapActionParams<SpokeChainKey>['walletProvider']>().toEqualTypeOf<IWalletProvider>();
  });
});

describe('SwapService types — method signatures reject mismatched walletProvider', () => {
  // These are compile-time assertions; if they compile, the test passes.
  // The call sites are guarded with @ts-expect-error so a regression (the compiler accepting
  // a mismatched provider) immediately surfaces as a test failure. Wrapping them in an unreachable
  // branch (`if (false)`) keeps the typechecker honest without running the bodies at runtime.

  it('rejects Solana provider when params.srcChain is an EVM literal (createIntent)', () => {
    const svc = sodax.swaps;
    if (false as boolean) {
      void svc.createIntent({
        params: intentInput(ChainKeys.BSC_MAINNET),
        raw: false,
        // @ts-expect-error — ISolanaWalletProvider cannot satisfy IEvmWalletProvider.
        walletProvider: mockSolanaProvider,
      });
    }
  });

  it('requires walletProvider on createIntent (no raw field in new API)', () => {
    const svc = sodax.swaps;
    if (false as boolean) {
      // @ts-expect-error — walletProvider is required by SwapActionParams.
      void svc.createIntent({ params: intentInput(ChainKeys.BSC_MAINNET) });
    }
  });

  it('createIntentRaw rejects walletProvider — the raw twin has no such field', () => {
    const svc = sodax.swaps;
    if (false as boolean) {
      void svc.createIntent({
        params: intentInput(ChainKeys.BSC_MAINNET),
        raw: true,
        // @ts-expect-error — walletProvider is forbidden when raw is true.
        walletProvider: mockEvmProvider,
      } as never);
    }
  });

  it('rejects mismatched provider on cancelIntent', () => {
    const svc = sodax.swaps;
    if (false as boolean) {
      void svc.cancelIntent({
        srcChainKey: ChainKeys.BSC_MAINNET,
        intent: makeIntent(),
        raw: false,
        // @ts-expect-error — Stellar provider cannot satisfy an EVM srcChainKey.
        walletProvider: mockStellarProvider,
      });
    }
  });
});

// =========================================================================
// Method-invocation type narrowing — proves that K is correctly inferred from
// `params.srcChain` (or `srcChainKey` for cancelIntent) at every public method's
// call site, and that walletProvider is narrowed accordingly. Each `it` block is
// a compile-time test wrapped in `if (false as boolean)` so the body is never
// executed at runtime — vitest still asserts the expectTypeOf checks (which run
// at compile time) and counts the test as passing if the file type-checks.
// =========================================================================

describe('SwapService.createIntent — narrows walletProvider from params.srcChain', () => {
  const svc = sodax.swaps;

  it('EVM literal (ethereum) → walletProvider must be IEvmWalletProvider', () => {
    if (false as boolean) {
      void svc.createIntent({
        params: intentInput(ChainKeys.ETHEREUM_MAINNET),
        walletProvider: mockEvmProvider,
      });
      void svc.createIntent({
        params: intentInput(ChainKeys.ETHEREUM_MAINNET),
        // @ts-expect-error — IEvmWalletProvider required, not ISolanaWalletProvider.
        walletProvider: mockSolanaProvider,
      });
      void svc.createIntent({
        params: intentInput(ChainKeys.ETHEREUM_MAINNET),
        // @ts-expect-error — IEvmWalletProvider required, not IStellarWalletProvider.
        walletProvider: mockStellarProvider,
      });
    }
  });

  it('Solana literal → walletProvider must be ISolanaWalletProvider', () => {
    if (false as boolean) {
      void svc.createIntent({
        params: intentInput(ChainKeys.SOLANA_MAINNET),
        walletProvider: mockSolanaProvider,
      });
      void svc.createIntent({
        params: intentInput(ChainKeys.SOLANA_MAINNET),
        // @ts-expect-error — ISolanaWalletProvider required, not IEvmWalletProvider.
        walletProvider: mockEvmProvider,
      });
    }
  });

  it('Stellar literal → walletProvider must be IStellarWalletProvider', () => {
    if (false as boolean) {
      void svc.createIntent({
        params: intentInput(ChainKeys.STELLAR_MAINNET),
        walletProvider: mockStellarProvider,
      });
      void svc.createIntent({
        params: intentInput(ChainKeys.STELLAR_MAINNET),
        // @ts-expect-error — IStellarWalletProvider required, not IEvmWalletProvider.
        walletProvider: mockEvmProvider,
      });
    }
  });

  it('Bitcoin literal → walletProvider must be IBitcoinWalletProvider', () => {
    if (false as boolean) {
      void svc.createIntent({
        params: intentInput(ChainKeys.BITCOIN_MAINNET),
        walletProvider: mockBitcoinProvider,
      });
      void svc.createIntent({
        params: intentInput(ChainKeys.BITCOIN_MAINNET),
        // @ts-expect-error — IBitcoinWalletProvider required, not IEvmWalletProvider.
        walletProvider: mockEvmProvider,
      });
    }
  });

  it('createIntentRaw accepts any chain without walletProvider', () => {
    if (false as boolean) {
      void svc.createIntent({ params: intentInput(ChainKeys.BSC_MAINNET), raw: true });
      void svc.createIntent({ params: intentInput(ChainKeys.SOLANA_MAINNET), raw: true });
      void svc.createIntent({ params: intentInput(ChainKeys.STELLAR_MAINNET), raw: true });
    }
  });

  it('omitting walletProvider on createIntent is rejected', () => {
    if (false as boolean) {
      // @ts-expect-error — walletProvider is required by SwapActionParams.
      void svc.createIntent({ params: intentInput(ChainKeys.BSC_MAINNET) });
    }
  });

  it('explicit <SpokeChainKey> generic still requires walletProvider (exec) and rejects on raw twin', () => {
    if (false as boolean) {
      const params: CreateIntentParams<SpokeChainKey> = intentInput(ChainKeys.BSC_MAINNET);

      // @ts-expect-error — walletProvider required on exec even with broad K.
      void svc.createIntent<SpokeChainKey>({ params });
      void svc.createIntent<SpokeChainKey>({ params, raw: true });

      // Broad K falls back to IWalletProvider union; all chain providers are accepted.
      void svc.createIntent<SpokeChainKey>({ params, walletProvider: mockEvmProvider });
      void svc.createIntent<SpokeChainKey>({ params, walletProvider: mockSolanaProvider });
      void svc.createIntent<SpokeChainKey>({ params, walletProvider: mockStellarProvider });
    }
  });
});

describe('SwapService.swap — narrows walletProvider (always exec)', () => {
  const svc = sodax.swaps;

  it('EVM literal → walletProvider must be IEvmWalletProvider', () => {
    if (false as boolean) {
      void svc.swap({
        params: intentInput(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });
      void svc.swap({
        params: intentInput(ChainKeys.BSC_MAINNET),
        // @ts-expect-error — Solana provider mismatched.
        walletProvider: mockSolanaProvider,
      });
    }
  });

  it('Solana literal → walletProvider must be ISolanaWalletProvider', () => {
    if (false as boolean) {
      void svc.swap({
        params: intentInput(ChainKeys.SOLANA_MAINNET),
        walletProvider: mockSolanaProvider,
      });
      void svc.swap({
        params: intentInput(ChainKeys.SOLANA_MAINNET),
        // @ts-expect-error — EVM provider mismatched.
        walletProvider: mockEvmProvider,
      });
    }
  });

  it('walletProvider is mandatory on swap', () => {
    if (false as boolean) {
      // @ts-expect-error — swap always executes; walletProvider is required.
      void svc.swap({ params: intentInput(ChainKeys.BSC_MAINNET) });
    }
  });
});

describe('SwapService.approve — narrows walletProvider from params.srcChain', () => {
  const svc = sodax.swaps;

  it('EVM literal → walletProvider must be IEvmWalletProvider', () => {
    if (false as boolean) {
      void svc.approve({
        params: intentInput(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });
      void svc.approve({
        params: intentInput(ChainKeys.BSC_MAINNET),
        // @ts-expect-error — Stellar provider mismatched.
        walletProvider: mockStellarProvider,
      });
    }
  });

  it('Stellar literal → walletProvider must be IStellarWalletProvider', () => {
    if (false as boolean) {
      void svc.approve({
        params: intentInput(ChainKeys.STELLAR_MAINNET),
        walletProvider: mockStellarProvider,
      });
      void svc.approve({
        params: intentInput(ChainKeys.STELLAR_MAINNET),
        // @ts-expect-error — EVM provider mismatched.
        walletProvider: mockEvmProvider,
      });
    }
  });

  it('approveRaw takes no walletProvider', () => {
    if (false as boolean) {
      void svc.approve({ params: intentInput(ChainKeys.BSC_MAINNET), raw: true });
      void svc.approve({
        params: intentInput(ChainKeys.BSC_MAINNET),
        raw: true,
        // @ts-expect-error — walletProvider is forbidden when raw is true.
        walletProvider: mockEvmProvider,
      } as never);
    }
  });
});

describe('SwapService.isAllowanceValid — narrows walletProvider from params.srcChain', () => {
  const svc = sodax.swaps;

  it('EVM literal → walletProvider must be IEvmWalletProvider', () => {
    if (false as boolean) {
      void svc.isAllowanceValid({
        params: intentInput(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });
      void svc.isAllowanceValid({
        params: intentInput(ChainKeys.BSC_MAINNET),
        // @ts-expect-error — Solana provider mismatched.
        walletProvider: mockSolanaProvider,
      });
    }
  });

  it('Bitcoin literal → walletProvider must be IBitcoinWalletProvider', () => {
    if (false as boolean) {
      void svc.isAllowanceValid({
        params: intentInput(ChainKeys.BITCOIN_MAINNET),
        walletProvider: mockBitcoinProvider,
      });
      void svc.isAllowanceValid({
        params: intentInput(ChainKeys.BITCOIN_MAINNET),
        // @ts-expect-error — Stellar provider mismatched.
        walletProvider: mockStellarProvider,
      });
    }
  });

  it('walletProvider is always required', () => {
    if (false as boolean) {
      // @ts-expect-error — walletProvider is required.
      void svc.isAllowanceValid({ params: intentInput(ChainKeys.BSC_MAINNET) });
    }
  });
});

describe('SwapService.createLimitOrder / createLimitOrderIntent — same narrowing as createIntent', () => {
  const svc = sodax.swaps;

  it('createLimitOrder: EVM literal → walletProvider must be IEvmWalletProvider', () => {
    if (false as boolean) {
      void svc.createLimitOrder({
        params: intentInput(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });
      void svc.createLimitOrder({
        params: intentInput(ChainKeys.BSC_MAINNET),
        // @ts-expect-error — Solana provider mismatched.
        walletProvider: mockSolanaProvider,
      });
    }
  });

  it('createLimitOrderIntent: Solana literal → walletProvider must be ISolanaWalletProvider', () => {
    if (false as boolean) {
      void svc.createLimitOrderIntent({
        params: intentInput(ChainKeys.SOLANA_MAINNET),
        walletProvider: mockSolanaProvider,
      });
      void svc.createLimitOrderIntent({
        params: intentInput(ChainKeys.SOLANA_MAINNET),
        // @ts-expect-error — EVM provider mismatched.
        walletProvider: mockEvmProvider,
      });
    }
  });

  it('createLimitOrderIntentRaw takes no walletProvider', () => {
    if (false as boolean) {
      void svc.createLimitOrderIntent({ params: intentInput(ChainKeys.BSC_MAINNET), raw: true });
      void svc.createLimitOrderIntent({
        params: intentInput(ChainKeys.BSC_MAINNET),
        raw: true,
        // @ts-expect-error — walletProvider is forbidden when raw is true.
        walletProvider: mockEvmProvider,
      } as never);
    }
  });
});

describe('SwapService.cancelIntent — narrows walletProvider from explicit srcChainKey', () => {
  const svc = sodax.swaps;
  const intent = makeIntent();

  it('EVM srcChainKey → walletProvider must be IEvmWalletProvider', () => {
    if (false as boolean) {
      void svc.cancelIntent({
        srcChainKey: ChainKeys.BSC_MAINNET,
        intent,
        walletProvider: mockEvmProvider,
      });
      void svc.cancelIntent({
        srcChainKey: ChainKeys.BSC_MAINNET,
        intent,
        // @ts-expect-error — Stellar provider mismatched.
        walletProvider: mockStellarProvider,
      });
    }
  });

  it('Solana srcChainKey → walletProvider must be ISolanaWalletProvider', () => {
    if (false as boolean) {
      void svc.cancelIntent({
        srcChainKey: ChainKeys.SOLANA_MAINNET,
        intent,
        walletProvider: mockSolanaProvider,
      });
      void svc.cancelIntent({
        srcChainKey: ChainKeys.SOLANA_MAINNET,
        intent,
        // @ts-expect-error — EVM provider mismatched.
        walletProvider: mockEvmProvider,
      });
    }
  });
});

// =========================================================================
// Runtime tests — validate each method delegates correctly.
// =========================================================================

// Real config doesn't know about our synthetic test token/address pairs, so every
// runtime test needs the three validity predicates stubbed to `true`. Mocks are
// restored between tests so a `vi.spyOn(svc.spoke, ...)` in one test doesn't leak
// into the next. Note that `vi.restoreAllMocks()` also strips the default return
// value off our hoisted `vi.fn()` mocks — we re-apply those defaults here each run.
beforeEach(() => {
  vi.spyOn(sodax.config, 'isValidOriginalAssetAddress').mockReturnValue(true);
  vi.spyOn(sodax.config, 'isValidSpokeChainKey').mockReturnValue(true);
  vi.spyOn(sodax.config, 'isValidIntentRelayChainId').mockReturnValue(true);
  vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValue({ ok: true, value: true });

  const emptyContractCall = { address: '0x0000000000000000000000000000000000000000' as const, value: 0n, data: '0x' as const };
  mocks.encodeCancelIntent.mockReturnValue(emptyContractCall);
  mocks.encodeCreateIntent.mockReturnValue(emptyContractCall);
});
afterEach(() => {
  vi.restoreAllMocks();
});

// The real intents contract address from the default sodaxConfig — used in spender
// assertions for the Sonic / hub-chain allowance & approve paths.
const intentsContract = sodax.swaps.solver.intentsContract;

describe('SwapService.isAllowanceValid', () => {
  it('checks ERC20 allowance against the intents contract on the hub (Sonic)', async () => {
    const svc = sodax.swaps;
    vi.spyOn(svc.spoke, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

    const result = await svc.isAllowanceValid({
      params: intentInput(ChainKeys.SONIC_MAINNET),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: true, value: true });
    expect(svc.spoke.isAllowanceValid).toHaveBeenCalledWith(
      expect.objectContaining({
        srcChainKey: ChainKeys.SONIC_MAINNET,
        spender: intentsContract,
      } satisfies Partial<SpokeIsAllowanceValidParamsHub>),
    );
  });

  it('checks ERC20 allowance against the asset manager on EVM spokes', async () => {
    const svc = sodax.swaps;
    vi.spyOn(svc.spoke, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

    const result = await svc.isAllowanceValid({
      params: intentInput(ChainKeys.BSC_MAINNET),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: true, value: true });
    expect(svc.spoke.isAllowanceValid).toHaveBeenCalledWith(
      expect.objectContaining({
        srcChainKey: ChainKeys.BSC_MAINNET,
        spender: spokeChainConfig[ChainKeys.BSC_MAINNET].addresses.assetManager,
      } satisfies Partial<SpokeIsAllowanceValidParamsEvmSpoke>),
    );
  });

  it('defers to Stellar trustline check for Stellar params.srcChain', async () => {
    const svc = sodax.swaps;
    const stellarParams = intentInput(ChainKeys.STELLAR_MAINNET);
    vi.spyOn(svc.spoke, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });
    const result = await svc.isAllowanceValid({
      params: stellarParams,
      raw: false,
      walletProvider: mockStellarProvider,
    });
    expect(result).toEqual({ ok: true, value: true });
    expect(svc.spoke.isAllowanceValid).toHaveBeenCalledWith(
      expect.objectContaining({
        srcChainKey: ChainKeys.STELLAR_MAINNET,
        token: stellarParams.inputToken,
        amount: stellarParams.inputAmount,
        owner: stellarParams.srcAddress,
      }),
    );
  });

  it('short-circuits to true for chains without allowance semantics (e.g. Solana)', async () => {
    const svc = sodax.swaps;
    const isAllowanceValidSpy = vi.spyOn(svc.spoke, 'isAllowanceValid');
    const result = await svc.isAllowanceValid({
      params: intentInput(ChainKeys.SOLANA_MAINNET),
      raw: false,
      walletProvider: mockSolanaProvider,
    });
    expect(result).toEqual({ ok: true, value: true });
    expect(isAllowanceValidSpy).not.toHaveBeenCalled();
  });
});

describe('SwapService.approve', () => {
  it('approves the intents contract on Sonic (raw=false)', async () => {
    const svc = sodax.swaps;
    vi.spyOn(svc.spoke, 'approve').mockResolvedValueOnce({ ok: true, value: '0xapprove-hash' });

    const result = (await svc.approve({
      params: intentInput(ChainKeys.SONIC_MAINNET),
      raw: false,
      walletProvider: mockEvmProvider,
    })) as Result<`0x${string}`>;

    expect(result).toEqual({ ok: true, value: '0xapprove-hash' });
    expect(svc.spoke.approve).toHaveBeenCalledWith(
      expect.objectContaining({
        srcChainKey: ChainKeys.SONIC_MAINNET,
        spender: intentsContract,
        raw: false,
        walletProvider: mockEvmProvider,
      }),
    );
  });

  it('approves the asset manager on EVM spokes (raw=true returns raw tx, no walletProvider)', async () => {
    const svc = sodax.swaps;
    const rawTx = { from: '0x1', to: '0x2', data: '0x', value: 0n };
    vi.spyOn(svc.spoke, 'approve').mockResolvedValueOnce({ ok: true, value: rawTx });

    const result = await svc.approve({
      params: intentInput(ChainKeys.BSC_MAINNET),
      raw: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(rawTx);
    expect(svc.spoke.approve).toHaveBeenCalledWith(expect.objectContaining({ raw: true }));
    // SwapService currently forwards `walletProvider` as `undefined` in raw mode.
    expect((svc.spoke.approve as ReturnType<typeof vi.fn>).mock.calls[0]?.[0].walletProvider).toBeUndefined();
  });

  it('delegates Stellar trustline requests to the Stellar spoke service', async () => {
    const svc = sodax.swaps;
    vi.spyOn(svc.spoke, 'approve').mockResolvedValueOnce({ ok: true, value: '0xtrustline' });
    const result = await svc.approve({
      params: intentInput(ChainKeys.STELLAR_MAINNET),
      raw: false,
      walletProvider: mockStellarProvider,
    });
    expect(result.ok).toBe(true);
    expect(svc.spoke.approve).toHaveBeenCalled();
  });
});

describe('SwapService.createIntent', () => {
  // Happy paths — the five distinct successful execution flows the method supports:
  // Sonic raw, Sonic exec, EVM spoke raw, EVM spoke exec, and the Bitcoin-specific preflight.
  describe('happy paths', () => {
    it('on Sonic, delegates to SonicSpokeService.createRawSwapIntent when raw=true', async () => {
      const svc = sodax.swaps;
      const fakeIntent = makeIntent(ChainKeys.SONIC_MAINNET);
      const rawTx = { from: '0x1', to: '0x2', data: '0x', value: 0n };
      mocks.getUserHubWalletAddress.mockResolvedValueOnce('0xhubwallet');
      mocks.sonicCreateSwapIntent.mockResolvedValueOnce([rawTx, fakeIntent, 123n, '0xdata']);

      const result = await svc.createIntent({
        params: intentInput(ChainKeys.SONIC_MAINNET),
        raw: true,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([rawTx, { ...fakeIntent, feeAmount: 123n }, '0xdata']);
      }
      expect(mocks.sonicCreateSwapIntent).toHaveBeenCalled();
      expect(mocks.sonicCreateSwapIntent.mock.calls[0]?.[0].createIntentParams.srcChainKey).toBe(ChainKeys.SONIC_MAINNET);
    });

    it('on Sonic, delegates to SonicSpokeService.createAndExecuteSwapIntent when raw=false', async () => {
      const svc = sodax.swaps;
      const fakeIntent = makeIntent(ChainKeys.SONIC_MAINNET);
      mocks.getUserHubWalletAddress.mockResolvedValueOnce('0xhubwallet');
      mocks.sonicCreateSwapIntent.mockResolvedValueOnce(['0xexec-hash', fakeIntent, 0n, '0xdata']);

      const result = await svc.createIntent({
        params: intentInput(ChainKeys.SONIC_MAINNET),
        raw: false,
        walletProvider: mockEvmProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(['0xexec-hash', { ...fakeIntent, feeAmount: 0n }, '0xdata']);
      }
      expect(mocks.sonicCreateSwapIntent).toHaveBeenCalled();
      const lastCall = mocks.sonicCreateSwapIntent.mock.calls.at(-1)?.[0];
      expect(lastCall?.walletProvider).toBe(mockEvmProvider);
    });

    it('on EVM spokes, builds intent data via EvmSolverService and deposits via SpokeService', async () => {
      const svc = sodax.swaps;
      mocks.getUserHubWalletAddress.mockResolvedValueOnce('0xhubwallet');
      const fakeIntent = makeIntent(ChainKeys.BSC_MAINNET);
      mocks.constructCreateIntentData.mockReturnValueOnce(['0xintentdata', fakeIntent, 42n]);
      vi.spyOn(svc.spoke, 'deposit').mockResolvedValueOnce({ ok: true, value: '0xdeposit-hash' });

      const result = await svc.createIntent({
        params: intentInput(ChainKeys.BSC_MAINNET),
        raw: false,
        walletProvider: mockEvmProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(['0xdeposit-hash', { ...fakeIntent, feeAmount: 42n }, '0xintentdata']);
      }
      expect(svc.spoke.deposit).toHaveBeenCalled();
      const depositCall = (svc.spoke.deposit as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(depositCall.srcChainKey).toBe(ChainKeys.BSC_MAINNET);
      expect(depositCall.raw).toBe(false);
      expect(depositCall.walletProvider).toBe(mockEvmProvider);
    });

    it('forwards the raw flag to SpokeService.deposit and does not pass walletProvider when raw=true', async () => {
      const svc = sodax.swaps;
      const params = intentInput(ChainKeys.BSC_MAINNET);
      mocks.getUserHubWalletAddress.mockResolvedValueOnce('0xhubwallet');
      mocks.constructCreateIntentData.mockReturnValueOnce(['0xintentdata', makeIntent(ChainKeys.BSC_MAINNET), 0n]);
      const rawDepositTx = { from: '0x1', to: '0x2', data: '0x', value: 0n };
      vi.spyOn(svc.spoke, 'deposit').mockResolvedValueOnce({ ok: true, value: rawDepositTx });

      const result = await svc.createIntent({ params, raw: true });

      expect(result.ok).toBe(true);
      const depositCall = (svc.spoke.deposit as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(depositCall).not.toHaveProperty('walletProvider');
      expect(depositCall.raw).toBe(true);
      expect(depositCall.srcChainKey).toBe(ChainKeys.BSC_MAINNET);
      expect(depositCall.token).toBe(params.inputToken);
      expect(depositCall.amount).toBe(params.inputAmount);
      expect(depositCall.data).toBe('0xintentdata');
      expect(depositCall.to).toBe('0xhubwallet');
    });

    it('invokes Radfi access-token setup with the Bitcoin wallet provider when params.srcChain is Bitcoin and raw=false', async () => {
      const svc = sodax.swaps;
      mocks.getUserHubWalletAddress.mockResolvedValueOnce('0xhubwallet');
      mocks.constructCreateIntentData.mockReturnValueOnce(['0xintentdata', makeIntent(ChainKeys.BITCOIN_MAINNET), 0n]);
      vi.spyOn(svc.spoke, 'deposit').mockResolvedValueOnce({ ok: true, value: '0xdeposit-hash' });
      const effectiveAddressSpy = vi
        .spyOn(svc.spoke.bitcoinSpokeService, 'getEffectiveWalletAddress')
        .mockImplementation(async (a: string) => a);
      const ensureRadfiSpy = vi
        .spyOn(svc.spoke.bitcoinSpokeService.radfi, 'ensureRadfiAccessToken')
        .mockResolvedValue(undefined);

      await svc.createIntent({
        params: { ...intentInput(ChainKeys.BITCOIN_MAINNET), srcAddress: 'bc1qusersource' },
        raw: false,
        walletProvider: mockBitcoinProvider,
      });

      expect(effectiveAddressSpy).toHaveBeenCalledWith('bc1qusersource');
      expect(ensureRadfiSpy).toHaveBeenCalledWith(mockBitcoinProvider);
    });
  });

  // Invariant failures — the preflight invariants at the top of createIntent run BEFORE
  // the try/catch, so failures surface as a rejected promise rather than a `{ok:false}`
  // Result. Tests here use `await expect(...).rejects.toThrow(...)`.
  describe('rejects on invalid inputs', () => {
    it('rejects when walletProvider chainType does not match srcChain', async () => {
      await expect(
        sodax.swaps.createIntent({
          params: intentInput(ChainKeys.BSC_MAINNET),
          raw: false,
          // Solana provider on an EVM chain — the chainType mismatch trips the
          // `isUndefinedOrValidWalletProviderForChainKey` invariant. Cast defeats the
          // compile-time narrowing that would otherwise reject the call site.
          walletProvider: mockSolanaProvider as unknown as IEvmWalletProvider,
        }),
      ).rejects.toThrow('Invalid wallet provider for chain key');
    });

    it('rejects when inputToken is not a valid original asset on srcChain', async () => {
      // Fail only the next call — the dstChain check right after must still return true,
      // otherwise we can't tell which invariant actually tripped.
      vi.spyOn(sodax.config, 'isValidOriginalAssetAddress').mockReturnValueOnce(false);

      await expect(
        sodax.swaps.createIntent({
          params: intentInput(ChainKeys.BSC_MAINNET),
          raw: false,
          walletProvider: mockEvmProvider,
        }),
      ).rejects.toThrow('Unsupported spoke chain token (srcChainKey)');
    });

    it('rejects when outputToken is not a valid original asset on dstChain', async () => {
      // First call (srcChain check) passes, second call (dstChain check) fails.
      vi.spyOn(sodax.config, 'isValidOriginalAssetAddress')
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      await expect(
        sodax.swaps.createIntent({
          params: intentInput(ChainKeys.BSC_MAINNET),
          raw: false,
          walletProvider: mockEvmProvider,
        }),
      ).rejects.toThrow('Unsupported spoke chain token (params.dstChain)');
    });

    it('rejects when srcChain is not a valid spoke chain key', async () => {
      vi.spyOn(sodax.config, 'isValidSpokeChainKey').mockReturnValueOnce(false);

      await expect(
        sodax.swaps.createIntent({
          params: intentInput(ChainKeys.BSC_MAINNET),
          raw: false,
          walletProvider: mockEvmProvider,
        }),
      ).rejects.toThrow('Invalid spoke chain (srcChainKey)');
    });

    it('rejects when dstChain is not a valid spoke chain key', async () => {
      vi.spyOn(sodax.config, 'isValidSpokeChainKey').mockReturnValueOnce(true).mockReturnValueOnce(false);

      await expect(
        sodax.swaps.createIntent({
          params: intentInput(ChainKeys.BSC_MAINNET),
          raw: false,
          walletProvider: mockEvmProvider,
        }),
      ).rejects.toThrow('Invalid spoke chain (params.dstChain)');
    });

    it('rejects when dstChain is Bitcoin + outputToken is BTC and minOutputAmount is below the 546 sat dust limit', async () => {
      const bitcoinDstParams = {
        ...intentInput(ChainKeys.BSC_MAINNET),
        dstChainKey: ChainKeys.BITCOIN_MAINNET,
        outputToken: 'BTC' as const,
        minOutputAmount: 100n,
      };

      await expect(
        sodax.swaps.createIntent({
          params: bitcoinDstParams,
          raw: false,
          walletProvider: mockEvmProvider,
        }),
      ).rejects.toThrow('Invalid minOutputAmount');
    });
  });

  // Error propagation — failures from collaborators inside the try/catch must be surfaced
  // as `{ok:false, error}`, not as a thrown rejection. Covers each internal call that can
  // fail: HubService, SonicSpokeService, EvmSolverService, and SpokeService.deposit.
  describe('propagates internal errors as Result.error', () => {
    it('returns ok:false when HubService.getUserHubWalletAddress rejects', async () => {
      const hubError = new Error('HUB_WALLET_LOOKUP_FAILED');
      mocks.getUserHubWalletAddress.mockRejectedValueOnce(hubError);

      const result = await sodax.swaps.createIntent({
        params: intentInput(ChainKeys.BSC_MAINNET),
        raw: false,
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: hubError });
    });

    it('returns ok:false when SonicSpokeService.createSwapIntent rejects (Sonic path)', async () => {
      const sonicError = new Error('SONIC_CREATE_FAILED');
      mocks.getUserHubWalletAddress.mockResolvedValueOnce('0xhubwallet');
      mocks.sonicCreateSwapIntent.mockRejectedValueOnce(sonicError);

      const result = await sodax.swaps.createIntent({
        params: intentInput(ChainKeys.SONIC_MAINNET),
        raw: false,
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: sonicError });
    });

    it('returns ok:false when EvmSolverService.constructCreateIntentData throws (EVM spoke path)', async () => {
      const constructError = new Error('CONSTRUCT_INTENT_DATA_FAILED');
      mocks.getUserHubWalletAddress.mockResolvedValueOnce('0xhubwallet');
      mocks.constructCreateIntentData.mockImplementationOnce(() => {
        throw constructError;
      });

      const result = await sodax.swaps.createIntent({
        params: intentInput(ChainKeys.BSC_MAINNET),
        raw: false,
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: constructError });
    });

    it('forwards SpokeService.deposit failure as-is (early return, not re-wrapped)', async () => {
      const depositError = new Error('DEPOSIT_REJECTED_BY_RPC');
      mocks.getUserHubWalletAddress.mockResolvedValueOnce('0xhubwallet');
      mocks.constructCreateIntentData.mockReturnValueOnce(['0xintentdata', makeIntent(ChainKeys.BSC_MAINNET), 0n]);
      vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: false, error: depositError });

      const result = await sodax.swaps.createIntent({
        params: intentInput(ChainKeys.BSC_MAINNET),
        raw: false,
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: depositError });
    });

    it('returns ok:false when SpokeService.deposit rejects (thrown, not returned failure)', async () => {
      const depositThrown = new Error('DEPOSIT_THROWS');
      mocks.getUserHubWalletAddress.mockResolvedValueOnce('0xhubwallet');
      mocks.constructCreateIntentData.mockReturnValueOnce(['0xintentdata', makeIntent(ChainKeys.BSC_MAINNET), 0n]);
      vi.spyOn(sodax.spokeService, 'deposit').mockRejectedValueOnce(depositThrown);

      const result = await sodax.swaps.createIntent({
        params: intentInput(ChainKeys.BSC_MAINNET),
        raw: false,
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: depositThrown });
    });
  });
});

describe('SwapService.createLimitOrder and createLimitOrderIntent', () => {
  it('createLimitOrder forces deadline=0n and routes through swap()', async () => {
    const svc = sodax.swaps;
    const baseInput = intentInput(ChainKeys.BSC_MAINNET);
    const fakeIntent = makeIntent(ChainKeys.BSC_MAINNET);
    const swapSpy = vi.spyOn(svc, 'swap').mockResolvedValueOnce({
      ok: true,
      value: [
        { answer: 'OK', intent_hash: '0xhash' },
        fakeIntent,
        {
          srcChainId: ChainKeys.BSC_MAINNET,
          srcTxHash: '0xsrc',
          srcAddress: baseInput.srcAddress,
          dstChainId: ChainKeys.ARBITRUM_MAINNET,
          dstTxHash: '0xdst',
          dstAddress: baseInput.dstAddress,
        },
      ],
    });

    // Pass a non-zero deadline — the method must override it to 0n.
    await svc.createLimitOrder({
      params: { ...baseInput, deadline: 42n },
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(swapSpy).toHaveBeenCalledTimes(1);
    const forwarded = swapSpy.mock.calls[0]?.[0];
    expect((forwarded?.params as CreateIntentParams).deadline).toBe(0n);
    expect(forwarded?.params.srcChainKey).toBe(ChainKeys.BSC_MAINNET);
    expect(forwarded?.walletProvider).toBe(mockEvmProvider);
    expect(forwarded?.skipSimulation).toBe(false);
    expect(forwarded?.fee).toBe(sodax.swaps.partnerFee);
  });

  it('createLimitOrderIntent delegates to createIntent with deadline=0n, preserving raw/K', async () => {
    const svc = sodax.swaps;
    const baseInput = intentInput(ChainKeys.BSC_MAINNET);
    const fakeIntent = makeIntent(ChainKeys.BSC_MAINNET);
    const createIntentSpy = vi.spyOn(svc, 'createIntent').mockResolvedValueOnce({
      ok: true,
      value: ['0xtx' as never, { ...fakeIntent, feeAmount: 0n }, '0x'],
    });

    await svc.createLimitOrderIntent({
      params: { ...baseInput, deadline: 9999n },
      raw: true,
    } as never);

    expect(createIntentSpy).toHaveBeenCalledTimes(1);
    const forwarded = createIntentSpy.mock.calls[0]?.[0];
    expect((forwarded?.params as CreateIntentParams).deadline).toBe(0n);
    expect(forwarded?.params.srcChainKey).toBe(ChainKeys.BSC_MAINNET);
  });
});

describe('SwapService.cancelIntent', () => {
  it('sends a cancel message via SpokeService.sendMessage with the resolved srcChainKey', async () => {
    const svc = sodax.swaps;
    // Use hub-chain flow (Sonic) so cancelIntent doesn't need relayer submit + wait.
    const intent = makeIntent(ChainKeys.SONIC_MAINNET);
    vi.spyOn(svc.spoke, 'sendMessage').mockResolvedValueOnce({ ok: true, value: '0xcancel-hash' });

    const result = await svc.cancelIntent({
      srcChainKey: ChainKeys.SONIC_MAINNET,
      intent,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: true, value: ['0xcancel-hash', '0xcancel-hash'] });
    const sendCall = (svc.spoke.sendMessage as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(sendCall.srcChainKey).toBe(ChainKeys.SONIC_MAINNET);
    expect(sendCall.walletProvider).toBe(mockEvmProvider);
    expect(sendCall.raw).toBe(false);
  });

  // Note: SwapService.cancelIntent is exec-only by design — the raw twin lives at
  // createCancelIntent<K, true>. Runtime coverage for the raw path belongs there.

  it('fails when srcChainKey disagrees with intent.srcChain', async () => {
    const svc = sodax.swaps;
    const sendMessageSpy = vi.spyOn(svc.spoke, 'sendMessage');
    // Intent says BSC, but we pass Arbitrum as srcChainKey — should fail the runtime assert.
    const intent = makeIntent(ChainKeys.BSC_MAINNET);

    const result = await svc.cancelIntent({
      srcChainKey: ChainKeys.ARBITRUM_MAINNET,
      intent,
      walletProvider: mockEvmProvider,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/does not match intent\.srcChain/);
    }
    // sendMessage must NOT have been called because the assert fires before it.
    expect(sendMessageSpy).not.toHaveBeenCalled();
  });
});

// =========================================================================
// Batch 1: simple getters — pure/thin wrappers with little-to-no I/O.
// =========================================================================

describe('SwapService.getPartnerFee', () => {
  it('returns 0n when no partnerFee is configured', () => {
    // Default `new Sodax()` has no partnerFee in config, so the early-return branch fires.
    expect(sodax.swaps.getPartnerFee(1_000_000n)).toBe(0n);
  });

  it('returns 0n regardless of the input amount when no partnerFee is set', () => {
    expect(sodax.swaps.getPartnerFee(0n)).toBe(0n);
    expect(sodax.swaps.getPartnerFee(10n ** 30n)).toBe(0n);
  });

  it('routes through calculateFeeAmount when partnerFee is configured', () => {
    // Spin up a separate Sodax instance with a configured partnerFee so we can exercise the
    // branch beyond the early-return. The readonly `partnerFee` field is set in the SwapService
    // constructor, so stubbing it on the shared instance would be hacky — a fresh instance is
    // the cleaner way to test config-dependent behavior. The cast is needed because
    // `SodaxConfig.swaps` intersects with the default `{ partnerFee: undefined }` literal,
    // which narrows the slot away from `PartnerFee` at the type level.
    const sodaxWithFee = new Sodax({
      swaps: { partnerFee: { address: '0x3333333333333333333333333333333333333333', percentage: 100 } },
    } as unknown as ConstructorParameters<typeof Sodax>[0]);

    const fee = sodaxWithFee.swaps.getPartnerFee(1_000_000n);

    // 100 basis points = 1% → non-zero fee on a non-zero input. Asserting > 0 rather than a
    // specific value because calculateFeeAmount's rounding isn't what this test is about —
    // we're proving the method *routed into* the helper, not replicating the helper's math.
    expect(fee).toBeGreaterThan(0n);
  });
});

describe('SwapService.getSolverFee', () => {
  it('returns 0n for 0 input', () => {
    expect(sodax.swaps.getSolverFee(0n)).toBe(0n);
  });

  it('scales proportionally with input amount', () => {
    // calculatePercentageFeeAmount is called with fee=10 basis points (0.1%). We don't want
    // the test to duplicate the helper's math — instead we assert the shape: the result for
    // 2x input is 2x the result for x input.
    const small = sodax.swaps.getSolverFee(1_000_000n);
    const double = sodax.swaps.getSolverFee(2_000_000n);
    expect(double).toBe(small * 2n);
    expect(small).toBeGreaterThan(0n);
  });
});

describe('SwapService.getIntentHash', () => {
  it('delegates to EvmSolverService.getIntentHash and returns its value', () => {
    const fakeHash = '0xdeadbeef' as const;
    mocks.getIntentHash.mockReturnValueOnce(fakeHash);
    const intent = makeIntent(ChainKeys.BSC_MAINNET);

    const hash = sodax.swaps.getIntentHash(intent);

    expect(hash).toBe(fakeHash);
    expect(mocks.getIntentHash).toHaveBeenCalledWith(intent);
  });
});

describe('SwapService.getSupportedSwapTokensByChainId', () => {
  it('forwards the chainId to the ConfigService and returns its result', () => {
    const fakeTokens = [{ symbol: 'BNB' }] as never;
    const spy = vi.spyOn(sodax.config, 'getSupportedSwapTokensByChainId').mockReturnValueOnce(fakeTokens);

    const result = sodax.swaps.getSupportedSwapTokensByChainId(ChainKeys.BSC_MAINNET);

    expect(result).toBe(fakeTokens);
    expect(spy).toHaveBeenCalledWith(ChainKeys.BSC_MAINNET);
  });
});

describe('SwapService.getSupportedSwapTokens', () => {
  it('returns whatever ConfigService.getSupportedSwapTokens returns', () => {
    const fakeAllTokens = { [ChainKeys.BSC_MAINNET]: [] } as never;
    const spy = vi.spyOn(sodax.config, 'getSupportedSwapTokens').mockReturnValueOnce(fakeAllTokens);

    const result = sodax.swaps.getSupportedSwapTokens();

    expect(result).toBe(fakeAllTokens);
    expect(spy).toHaveBeenCalled();
  });
});

describe('SwapService.getSwapDeadline', () => {
  it('returns the hub block timestamp plus the supplied deadline offset', async () => {
    const blockTimestamp = 1_700_000_000n;
    const offset = 300n;
    const getBlockSpy = vi
      .spyOn(sodax.hubProvider.publicClient, 'getBlock')
      .mockResolvedValueOnce({ timestamp: blockTimestamp } as never);

    const result = await sodax.swaps.getSwapDeadline(offset);

    expect(result).toEqual({ ok: true, value: blockTimestamp + offset });
    expect(getBlockSpy).toHaveBeenCalledWith({ includeTransactions: false, blockTag: 'latest' });
  });

  it('returns ok:false when deadline is 0n (invariant fails)', async () => {
    const result = await sodax.swaps.getSwapDeadline(0n);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Deadline must be greater than 0/);
    }
  });

  it('returns ok:false when hubProvider.publicClient.getBlock rejects', async () => {
    const rpcError = new Error('RPC_DOWN');
    vi.spyOn(sodax.hubProvider.publicClient, 'getBlock').mockRejectedValueOnce(rpcError);

    const result = await sodax.swaps.getSwapDeadline(60n);

    expect(result).toEqual({ ok: false, error: rpcError });
  });
});

// =========================================================================
// Batch 2: thin wrappers around static helpers / spoke methods.
// =========================================================================

describe('SwapService.estimateGas', () => {
  it('delegates to spoke.estimateGas with the given params and returns its Result', async () => {
    const estimateResult = { ok: true as const, value: { gas: 21_000n } as never };
    const spy = vi.spyOn(sodax.spokeService, 'estimateGas').mockResolvedValueOnce(estimateResult);
    const params = { chainKey: ChainKeys.BSC_MAINNET } as never;

    const result = await sodax.swaps.estimateGas(params);

    expect(result).toBe(estimateResult);
    expect(spy).toHaveBeenCalledWith(params);
  });

  it('forwards a failure Result from spoke.estimateGas unchanged', async () => {
    const gasError = new Error('GAS_ESTIMATION_FAILED');
    vi.spyOn(sodax.spokeService, 'estimateGas').mockResolvedValueOnce({ ok: false, error: gasError });

    const result = await sodax.swaps.estimateGas({ chainKey: ChainKeys.BSC_MAINNET } as never);

    expect(result).toEqual({ ok: false, error: gasError });
  });
});

describe('SwapService.getIntent', () => {
  it('returns ok:true wrapping the intent EvmSolverService.getIntent resolved with', async () => {
    const fakeIntent = makeIntent(ChainKeys.BSC_MAINNET);
    mocks.getIntent.mockResolvedValueOnce(fakeIntent);

    const result = await sodax.swaps.getIntent('0xtxhash');

    expect(result).toEqual({ ok: true, value: fakeIntent });
    expect(mocks.getIntent).toHaveBeenCalledWith('0xtxhash', sodax.config, sodax.hubProvider.publicClient);
  });

  it('returns ok:false when EvmSolverService.getIntent rejects', async () => {
    const lookupError = new Error('LOOKUP_FAILED');
    mocks.getIntent.mockRejectedValueOnce(lookupError);

    const result = await sodax.swaps.getIntent('0xtxhash');

    expect(result).toEqual({ ok: false, error: lookupError });
  });
});

describe('SwapService.getFilledIntent', () => {
  it('returns ok:true with the IntentState EvmSolverService.getFilledIntent resolved with', async () => {
    const fakeState = { filled: true } as never;
    mocks.getFilledIntent.mockResolvedValueOnce(fakeState);

    const result = await sodax.swaps.getFilledIntent('0xtxhash');

    expect(result).toEqual({ ok: true, value: fakeState });
    expect(mocks.getFilledIntent).toHaveBeenCalledWith('0xtxhash', sodax.swaps.solver, sodax.hubProvider.publicClient);
  });

  it('returns ok:false when EvmSolverService.getFilledIntent rejects', async () => {
    const lookupError = new Error('FILLED_LOOKUP_FAILED');
    mocks.getFilledIntent.mockRejectedValueOnce(lookupError);

    const result = await sodax.swaps.getFilledIntent('0xtxhash');

    expect(result).toEqual({ ok: false, error: lookupError });
  });
});

describe('SwapService.getIntentSubmitTxExtraData', () => {
  it('when given an intent directly, encodes it and returns creator + payload', async () => {
    const intent = makeIntent(ChainKeys.BSC_MAINNET);
    mocks.encodeCreateIntent.mockReturnValueOnce({ data: '0xencoded', address: intent.creator, value: 0n });

    const result = await sodax.swaps.getIntentSubmitTxExtraData({ intent });

    expect(result).toEqual({ ok: true, value: { address: intent.creator, payload: '0xencoded' } });
    expect(mocks.encodeCreateIntent).toHaveBeenCalledWith(intent, sodax.swaps.solver.intentsContract);
  });

  it('when given a txHash, fetches the intent first then encodes it', async () => {
    const intent = makeIntent(ChainKeys.BSC_MAINNET);
    mocks.getIntent.mockResolvedValueOnce(intent);
    mocks.encodeCreateIntent.mockReturnValueOnce({ data: '0xencoded2', address: intent.creator, value: 0n });

    const result = await sodax.swaps.getIntentSubmitTxExtraData({ txHash: '0xtxhash' });

    expect(result).toEqual({ ok: true, value: { address: intent.creator, payload: '0xencoded2' } });
  });

  it('when the txHash lookup fails, returns the failure as-is and does NOT call encodeCreateIntent', async () => {
    const lookupError = new Error('INTENT_NOT_FOUND');
    mocks.getIntent.mockRejectedValueOnce(lookupError);

    const result = await sodax.swaps.getIntentSubmitTxExtraData({ txHash: '0xmissing' });

    expect(result).toEqual({ ok: false, error: lookupError });
    expect(mocks.encodeCreateIntent).not.toHaveBeenCalled();
  });

  it('returns ok:false when encodeCreateIntent throws', async () => {
    const encodeError = new Error('ENCODE_FAILED');
    mocks.encodeCreateIntent.mockImplementationOnce(() => {
      throw encodeError;
    });

    const result = await sodax.swaps.getIntentSubmitTxExtraData({ intent: makeIntent(ChainKeys.BSC_MAINNET) });

    expect(result).toEqual({ ok: false, error: encodeError });
  });
});

describe('SwapService.getSolvedIntentPacket', () => {
  it('forwards params to waitUntilIntentExecuted and returns its Result on success', async () => {
    const packet = { dst_tx_hash: '0xdstTxHash' } as never;
    mocks.waitUntilIntentExecuted.mockResolvedValueOnce({ ok: true, value: packet });

    const result = await sodax.swaps.getSolvedIntentPacket({
      chainId: ChainKeys.BSC_MAINNET,
      fillTxHash: '0xfillTxHash',
    });

    expect(result).toEqual({ ok: true, value: packet });
    const callArgs = mocks.waitUntilIntentExecuted.mock.calls[0]?.[0];
    expect(callArgs.spokeTxHash).toBe('0xfillTxHash');
    expect(callArgs.apiUrl).toBe(sodax.swaps.relayerApiEndpoint);
  });

  it('propagates a failure Result (e.g. RELAY_TIMEOUT) from waitUntilIntentExecuted', async () => {
    const timeoutError = new Error('RELAY_TIMEOUT');
    mocks.waitUntilIntentExecuted.mockResolvedValueOnce({ ok: false, error: timeoutError });

    const result = await sodax.swaps.getSolvedIntentPacket({
      chainId: ChainKeys.BSC_MAINNET,
      fillTxHash: '0xfillTxHash',
    });

    expect(result).toEqual({ ok: false, error: timeoutError });
  });
});

// =========================================================================
// Batch 3: relayer / solver API facade methods.
// =========================================================================

describe('SwapService.getStatus', () => {
  it('delegates to SolverApiService.getStatus with the solver config and returns the Result', async () => {
    const statusResult = { ok: true as const, value: { status: 3, intent_hash: '0xhash' } as never };
    mocks.solverGetStatus.mockResolvedValueOnce(statusResult);
    const request = { intent_tx_hash: '0xsome' } as never;

    const result = await sodax.swaps.getStatus(request);

    expect(result).toBe(statusResult);
    expect(mocks.solverGetStatus).toHaveBeenCalledWith(request, sodax.swaps.solver);
  });

  it('forwards a SolverErrorResponse failure from SolverApiService.getStatus', async () => {
    const solverError = { ok: false, error: { code: 'INTENT_NOT_FOUND' } } as never;
    mocks.solverGetStatus.mockResolvedValueOnce(solverError);

    const result = await sodax.swaps.getStatus({ intent_tx_hash: '0xmissing' } as never);

    expect(result).toBe(solverError);
  });
});

describe('SwapService.postExecution', () => {
  it('delegates to SolverApiService.postExecution and returns the Result', async () => {
    const execResult = { ok: true as const, value: { answer: 'OK', intent_hash: '0xhash' } as never };
    mocks.solverPostExecution.mockResolvedValueOnce(execResult);
    const request = { intent_tx_hash: '0xsome' } as never;

    const result = await sodax.swaps.postExecution(request);

    expect(result).toBe(execResult);
    expect(mocks.solverPostExecution).toHaveBeenCalledWith(request, sodax.swaps.solver);
  });

  it('forwards a failure Result from SolverApiService.postExecution', async () => {
    const failure = { ok: false, error: { code: 'POST_EXEC_REJECTED' } } as never;
    mocks.solverPostExecution.mockResolvedValueOnce(failure);

    const result = await sodax.swaps.postExecution({ intent_tx_hash: '0xsome' } as never);

    expect(result).toBe(failure);
  });
});

describe('SwapService.submitIntent', () => {
  const submitPayload = {
    action: 'submit',
    params: { chain_id: '0x38.bsc', tx_hash: '0xtx' },
  } as never;

  it('returns ok:true wrapping the submit response when success is true', async () => {
    const relayResponse = { success: true, message: 'accepted' };
    mocks.submitTransaction.mockResolvedValueOnce(relayResponse);

    const result = await sodax.swaps.submitIntent(submitPayload);

    expect(result).toEqual({ ok: true, value: relayResponse });
    expect(mocks.submitTransaction).toHaveBeenCalledWith(submitPayload, sodax.swaps.relayerApiEndpoint);
  });

  it('wraps a success:false response as Error("SUBMIT_TX_FAILED") with the relay message on .cause', async () => {
    mocks.submitTransaction.mockResolvedValueOnce({ success: false, message: 'relay rejected' });

    const result = await sodax.swaps.submitIntent(submitPayload);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect((result.error as Error).message).toBe('SUBMIT_TX_FAILED');
      expect(((result.error as Error).cause as Error).message).toBe('relay rejected');
    }
  });

  it('returns ok:false when submitTransaction rejects', async () => {
    const networkError = new Error('NETWORK_DOWN');
    mocks.submitTransaction.mockRejectedValueOnce(networkError);

    const result = await sodax.swaps.submitIntent(submitPayload);

    expect(result).toEqual({ ok: false, error: networkError });
  });
});

// =========================================================================
// Batch 4: quote request — adjusts amount by partner fee before delegating.
// =========================================================================

describe('SwapService.getQuote', () => {
  const baseQuoteRequest = {
    token_src: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    token_dst: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    token_src_blockchain_id: ChainKeys.BSC_MAINNET,
    token_dst_blockchain_id: ChainKeys.ARBITRUM_MAINNET,
    amount: 1_000_000n,
    quote_type: 'exact_input',
  } as never;

  it('forwards the payload (after fee adjustment) to SolverApiService.getQuote and returns the Result', async () => {
    const quoteResponse = { ok: true as const, value: { quoted_amount: 900_000n } as never };
    mocks.solverGetQuote.mockResolvedValueOnce(quoteResponse);

    const result = await sodax.swaps.getQuote(baseQuoteRequest);

    expect(result).toBe(quoteResponse);
    // Second arg is the solver config, third is ConfigService instance. We assert shape, not deep equality.
    expect(mocks.solverGetQuote).toHaveBeenCalledWith(expect.objectContaining({ amount: expect.any(BigInt) }), sodax.swaps.solver, sodax.config);
  });

  it('leaves the amount unchanged when no partnerFee is configured', async () => {
    mocks.solverGetQuote.mockResolvedValueOnce({ ok: true, value: {} as never });

    await sodax.swaps.getQuote(baseQuoteRequest);

    const forwarded = mocks.solverGetQuote.mock.calls.at(-1)?.[0] as { amount: bigint };
    // No partnerFee → adjustAmountByFee returns the input untouched.
    expect(forwarded.amount).toBe((baseQuoteRequest as unknown as { amount: bigint }).amount);
  });

  it('forwards a failure Result from SolverApiService.getQuote', async () => {
    const failure = { ok: false, error: { code: 'INSUFFICIENT_LIQUIDITY' } } as never;
    mocks.solverGetQuote.mockResolvedValueOnce(failure);

    const result = await sodax.swaps.getQuote(baseQuoteRequest);

    expect(result).toBe(failure);
  });
});

// =========================================================================
// Batch 5: expand coverage for approve + isAllowanceValid beyond happy paths.
// =========================================================================

describe('SwapService.isAllowanceValid — error propagation', () => {
  it('returns ok:false when spoke.isAllowanceValid rejects on an EVM spoke', async () => {
    const rpcError = new Error('RPC_DOWN');
    vi.spyOn(sodax.spokeService, 'isAllowanceValid').mockRejectedValueOnce(rpcError);

    const result = await sodax.swaps.isAllowanceValid({
      params: intentInput(ChainKeys.BSC_MAINNET),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: rpcError });
  });

  it('forwards a failure Result from spoke.isAllowanceValid unchanged', async () => {
    const spokeError = new Error('ALLOWANCE_CHECK_FAILED');
    vi.spyOn(sodax.spokeService, 'isAllowanceValid').mockResolvedValueOnce({ ok: false, error: spokeError });

    const result = await sodax.swaps.isAllowanceValid({
      params: intentInput(ChainKeys.BSC_MAINNET),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: spokeError });
  });
});

describe('SwapService.approve — additional branches', () => {
  it('returns ok:false with explanatory error for unsupported chains (Solana)', async () => {
    const result = await sodax.swaps.approve({
      params: intentInput(ChainKeys.SOLANA_MAINNET),
      raw: false,
      walletProvider: mockSolanaProvider,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Approve only supported/);
    }
  });

  it('forwards a failure Result from spoke.approve on an EVM spoke (ok:false not re-wrapped)', async () => {
    const approveError = new Error('APPROVE_REJECTED');
    vi.spyOn(sodax.spokeService, 'approve').mockResolvedValueOnce({ ok: false, error: approveError });

    const result = await sodax.swaps.approve({
      params: intentInput(ChainKeys.BSC_MAINNET),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: approveError });
  });

  it('returns ok:false when spoke.approve rejects (thrown)', async () => {
    const thrownError = new Error('APPROVE_THROWS');
    vi.spyOn(sodax.spokeService, 'approve').mockRejectedValueOnce(thrownError);

    const result = await sodax.swaps.approve({
      params: intentInput(ChainKeys.BSC_MAINNET),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: thrownError });
  });

  it('returns ok:false when the EVM path receives a non-EVM wallet provider (invariant inside try)', async () => {
    const result = await sodax.swaps.approve({
      params: intentInput(ChainKeys.BSC_MAINNET),
      raw: false,
      // Solana provider cast onto an EVM chain — the isOptionalEvmWalletProviderType
      // invariant inside the try block converts the mismatch into a Result failure.
      walletProvider: mockSolanaProvider as unknown as IEvmWalletProvider,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Expected Evm wallet provider/);
    }
  });

  it('returns ok:false when the Stellar path receives a non-Stellar wallet provider', async () => {
    const result = await sodax.swaps.approve({
      params: intentInput(ChainKeys.STELLAR_MAINNET),
      raw: false,
      walletProvider: mockEvmProvider as unknown as IStellarWalletProvider,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Expected Stellar wallet provider/);
    }
  });

  it('on Stellar with raw=true, calls spoke.approve without walletProvider', async () => {
    const rawTx = { from: '0x1', to: '0x2', data: '0x', value: 0n };
    const spy = vi.spyOn(sodax.spokeService, 'approve').mockResolvedValueOnce({ ok: true, value: rawTx as never });

    const result = await sodax.swaps.approve({
      params: intentInput(ChainKeys.STELLAR_MAINNET),
      raw: true,
    });

    expect(result.ok).toBe(true);
    const callArg = spy.mock.calls[0]?.[0];
    expect(callArg).toMatchObject({ raw: true });
    expect(callArg).not.toHaveProperty('walletProvider');
  });
});

// =========================================================================
// Batch 6: swap — orchestrates createIntent + verify + relay + postExecution.
// =========================================================================

describe('SwapService.swap', () => {
  // Stub createIntent so tests can focus on swap's orchestration logic without re-traversing
  // all of createIntent's internal paths. Return value: [spokeTxHash, intent, data].
  const stubCreateIntentOk = (srcChain: SpokeChainKey, spokeTxHash = '0xspokeTx' as never) => {
    const intent = makeIntent(srcChain as Parameters<typeof getIntentRelayChainId>[0]);
    return vi.spyOn(sodax.swaps, 'createIntent').mockResolvedValueOnce({
      ok: true,
      value: [spokeTxHash, { ...intent, feeAmount: 0n }, '0xdata' as never] as never,
    });
  };

  it('on hub-chain srcChain (Sonic), skips relay and calls postExecution with the spoke tx hash', async () => {
    stubCreateIntentOk(ChainKeys.SONIC_MAINNET, '0xsonicTx' as never);
    mocks.solverPostExecution.mockResolvedValueOnce({
      ok: true,
      value: { answer: 'OK', intent_hash: '0xhash' } as never,
    });

    const result = await sodax.swaps.swap({
      params: intentInput(ChainKeys.SONIC_MAINNET),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result.ok).toBe(true);
    // postExecution should receive the spoke tx hash as intent_tx_hash — no relay step between them.
    expect(mocks.solverPostExecution).toHaveBeenCalledWith(
      expect.objectContaining({ intent_tx_hash: '0xsonicTx' }),
      sodax.swaps.solver,
    );
    // The relay path must NOT have been invoked for hub-chain srcChain.
    expect(mocks.relayTxAndWaitPacket).not.toHaveBeenCalled();
  });

  it('on an EVM spoke srcChain, relays the spoke tx then calls postExecution with the dst tx hash', async () => {
    stubCreateIntentOk(ChainKeys.BSC_MAINNET, '0xbscTx' as never);
    mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: true, value: { dst_tx_hash: '0xdstTx' } });
    mocks.solverPostExecution.mockResolvedValueOnce({ ok: true, value: { answer: 'OK' } as never });

    const result = await sodax.swaps.swap({
      params: intentInput(ChainKeys.BSC_MAINNET),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result.ok).toBe(true);
    // Second arg is extraData — for EVM spokes it must be undefined (only Solana/Bitcoin pass extraData).
    expect(mocks.relayTxAndWaitPacket.mock.calls[0]?.[1]).toBeUndefined();
    expect(mocks.solverPostExecution).toHaveBeenCalledWith(
      expect.objectContaining({ intent_tx_hash: '0xdstTx' }),
      sodax.swaps.solver,
    );
  });

  it('on Solana srcChain, passes extraData (address + payload) to relayTxAndWaitPacket', async () => {
    stubCreateIntentOk(ChainKeys.SOLANA_MAINNET, '0xsolTx' as never);
    mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: true, value: { dst_tx_hash: '0xdstTx' } });
    mocks.solverPostExecution.mockResolvedValueOnce({ ok: true, value: { answer: 'OK' } as never });

    await sodax.swaps.swap({
      params: intentInput(ChainKeys.SOLANA_MAINNET),
      raw: false,
      walletProvider: mockSolanaProvider,
    });

    const extraData = mocks.relayTxAndWaitPacket.mock.calls[0]?.[1];
    expect(extraData).toBeDefined();
    expect(extraData).toHaveProperty('address');
    expect(extraData).toHaveProperty('payload');
  });

  it('returns the failure from createIntent when it fails', async () => {
    const createError = new Error('CREATE_FAILED');
    vi.spyOn(sodax.swaps, 'createIntent').mockResolvedValueOnce({ ok: false, error: createError });

    const result = await sodax.swaps.swap({
      params: intentInput(ChainKeys.BSC_MAINNET),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: createError });
    expect(mocks.relayTxAndWaitPacket).not.toHaveBeenCalled();
  });

  it('returns the failure from verifyTxHash when it fails', async () => {
    stubCreateIntentOk(ChainKeys.BSC_MAINNET);
    const verifyError = new Error('VERIFY_FAILED');
    vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: false, error: verifyError });

    const result = await sodax.swaps.swap({
      params: intentInput(ChainKeys.BSC_MAINNET),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: verifyError });
    expect(mocks.relayTxAndWaitPacket).not.toHaveBeenCalled();
  });

  it('returns the failure from relayTxAndWaitPacket when it fails', async () => {
    stubCreateIntentOk(ChainKeys.BSC_MAINNET);
    const relayError = new Error('RELAY_TIMEOUT');
    mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: false, error: relayError });

    const result = await sodax.swaps.swap({
      params: intentInput(ChainKeys.BSC_MAINNET),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: relayError });
    expect(mocks.solverPostExecution).not.toHaveBeenCalled();
  });

  it('wraps a postExecution failure in Error("POST_EXECUTION_FAILED") with the underlying error on .cause', async () => {
    stubCreateIntentOk(ChainKeys.SONIC_MAINNET);
    const postExecError = new Error('SOLVER_UNAVAILABLE');
    mocks.solverPostExecution.mockResolvedValueOnce({ ok: false, error: postExecError });

    const result = await sodax.swaps.swap({
      params: intentInput(ChainKeys.SONIC_MAINNET),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect((result.error as Error).message).toBe('POST_EXECUTION_FAILED');
      expect((result.error as Error).cause).toBe(postExecError);
    }
  });

  it('returns ok:false when createIntent rejects (thrown, not Result failure)', async () => {
    const thrownError = new Error('CREATE_THROWS');
    vi.spyOn(sodax.swaps, 'createIntent').mockRejectedValueOnce(thrownError);

    const result = await sodax.swaps.swap({
      params: intentInput(ChainKeys.BSC_MAINNET),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: thrownError });
  });

  it('returns the IntentDeliveryInfo tuple with src/dst chain + tx info on success', async () => {
    const params = intentInput(ChainKeys.BSC_MAINNET);
    stubCreateIntentOk(ChainKeys.BSC_MAINNET, '0xbscTx' as never);
    mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: true, value: { dst_tx_hash: '0xdstTx' } });
    mocks.solverPostExecution.mockResolvedValueOnce({ ok: true, value: { answer: 'OK' } as never });

    const result = await sodax.swaps.swap({ params, raw: false, walletProvider: mockEvmProvider });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const [, , delivery] = result.value;
      expect(delivery).toEqual({
        srcChainId: ChainKeys.BSC_MAINNET,
        srcTxHash: '0xbscTx',
        srcAddress: params.srcAddress,
        dstChainId: params.dstChainKey,
        dstTxHash: '0xdstTx',
        dstAddress: params.dstAddress,
      });
    }
  });
});

// =========================================================================
// Batch 7: cancel family — createCancelIntent + cancelIntent expansion + cancelLimitOrder.
// =========================================================================

describe('SwapService.createCancelIntent', () => {
  it('forwards sendMessage params with raw=true and no walletProvider', async () => {
    const intent = makeIntent(ChainKeys.BSC_MAINNET);
    const sendMessageSpy = vi
      .spyOn(sodax.spokeService, 'sendMessage')
      .mockResolvedValueOnce({ ok: true, value: { from: '0x1', to: '0x2', data: '0x', value: 0n } as never });

    const result = await sodax.swaps.createCancelIntent({
      srcChainKey: ChainKeys.BSC_MAINNET,
      intent,
      raw: true,
    });

    expect(result.ok).toBe(true);
    const callArg = sendMessageSpy.mock.calls[0]?.[0];
    expect(callArg).toMatchObject({ raw: true });
    expect(callArg).not.toHaveProperty('walletProvider');
  });

  it('forwards sendMessage params with raw=false and walletProvider', async () => {
    const intent = makeIntent(ChainKeys.BSC_MAINNET);
    const sendMessageSpy = vi
      .spyOn(sodax.spokeService, 'sendMessage')
      .mockResolvedValueOnce({ ok: true, value: '0xcancel-tx' });

    const result = await sodax.swaps.createCancelIntent({
      srcChainKey: ChainKeys.BSC_MAINNET,
      intent,
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result.ok).toBe(true);
    const callArg = sendMessageSpy.mock.calls[0]?.[0];
    expect(callArg).toMatchObject({ raw: false, walletProvider: mockEvmProvider });
  });

  it('returns ok:false when intent.srcChain is not a valid relay chain id', async () => {
    const intent = makeIntent(ChainKeys.BSC_MAINNET);
    // Override the default beforeEach stub: first call (intent.srcChain check) fails.
    vi.spyOn(sodax.config, 'isValidIntentRelayChainId').mockReturnValueOnce(false);

    const result = await sodax.swaps.createCancelIntent({
      srcChainKey: ChainKeys.BSC_MAINNET,
      intent,
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Invalid intent\.srcChain/);
    }
  });

  it('returns ok:false when intent.dstChain is not a valid relay chain id', async () => {
    const intent = makeIntent(ChainKeys.BSC_MAINNET);
    vi.spyOn(sodax.config, 'isValidIntentRelayChainId').mockReturnValueOnce(true).mockReturnValueOnce(false);

    const result = await sodax.swaps.createCancelIntent({
      srcChainKey: ChainKeys.BSC_MAINNET,
      intent,
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(String(result.error)).toMatch(/Invalid intent\.dstChain/);
    }
  });

  it('forwards a failure Result from spoke.sendMessage unchanged', async () => {
    const intent = makeIntent(ChainKeys.BSC_MAINNET);
    const sendError = new Error('SEND_REJECTED');
    vi.spyOn(sodax.spokeService, 'sendMessage').mockResolvedValueOnce({ ok: false, error: sendError });

    const result = await sodax.swaps.createCancelIntent({
      srcChainKey: ChainKeys.BSC_MAINNET,
      intent,
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: sendError });
  });

  it('returns ok:false when spoke.sendMessage rejects', async () => {
    const intent = makeIntent(ChainKeys.BSC_MAINNET);
    const thrownError = new Error('SEND_THROWS');
    vi.spyOn(sodax.spokeService, 'sendMessage').mockRejectedValueOnce(thrownError);

    const result = await sodax.swaps.createCancelIntent({
      srcChainKey: ChainKeys.BSC_MAINNET,
      intent,
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: thrownError });
  });
});

describe('SwapService.cancelIntent — non-hub (relay) path', () => {
  it('on an EVM spoke, submits the cancel to the relayer and waits for the dst tx hash', async () => {
    const intent = makeIntent(ChainKeys.BSC_MAINNET);
    const verifyTxHashSpy = vi
      .spyOn(sodax.spokeService, 'verifyTxHash')
      .mockResolvedValueOnce({ ok: true, value: true });
    vi.spyOn(sodax.spokeService, 'sendMessage').mockResolvedValueOnce({ ok: true, value: '0xspokeCancelTx' });
    mocks.submitTransaction.mockResolvedValueOnce({ success: true, message: 'ok' });
    mocks.waitUntilIntentExecuted.mockResolvedValueOnce({ ok: true, value: { dst_tx_hash: '0xdstCancelTx' } });

    const result = await sodax.swaps.cancelIntent({
      srcChainKey: ChainKeys.BSC_MAINNET,
      intent,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: true, value: ['0xspokeCancelTx', '0xdstCancelTx'] });

    expect(verifyTxHashSpy).toHaveBeenCalledWith({
      txHash: '0xspokeCancelTx',
      chainKey: ChainKeys.BSC_MAINNET,
    });

    expect(mocks.submitTransaction).toHaveBeenCalledWith(
      {
        action: 'submit',
        params: {
          chain_id: intent.srcChain.toString(),
          tx_hash: '0xspokeCancelTx',
        },
      },
      sodax.swaps.relayerApiEndpoint,
    );

    expect(mocks.waitUntilIntentExecuted).toHaveBeenCalledWith({
      intentRelayChainId: intent.srcChain.toString(),
      spokeTxHash: '0xspokeCancelTx',
      timeout: expect.any(Number),
      apiUrl: sodax.swaps.relayerApiEndpoint,
    });
  });

  it('returns submitIntent failure when the relayer rejects the submit', async () => {
    const intent = makeIntent(ChainKeys.BSC_MAINNET);
    vi.spyOn(sodax.spokeService, 'sendMessage').mockResolvedValueOnce({ ok: true, value: '0xspokeCancelTx' });
    mocks.submitTransaction.mockResolvedValueOnce({ success: false, message: 'relay rejected' });

    const result = await sodax.swaps.cancelIntent({
      srcChainKey: ChainKeys.BSC_MAINNET,
      intent,
      walletProvider: mockEvmProvider,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect((result.error as Error).message).toBe('SUBMIT_TX_FAILED');
    expect(mocks.waitUntilIntentExecuted).not.toHaveBeenCalled();
  });

  it('returns the failure Result from waitUntilIntentExecuted on relay timeout', async () => {
    const intent = makeIntent(ChainKeys.BSC_MAINNET);
    const timeoutError = new Error('RELAY_TIMEOUT');
    vi.spyOn(sodax.spokeService, 'sendMessage').mockResolvedValueOnce({ ok: true, value: '0xspokeCancelTx' });
    mocks.submitTransaction.mockResolvedValueOnce({ success: true, message: 'ok' });
    mocks.waitUntilIntentExecuted.mockResolvedValueOnce({ ok: false, error: timeoutError });

    const result = await sodax.swaps.cancelIntent({
      srcChainKey: ChainKeys.BSC_MAINNET,
      intent,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: timeoutError });
  });

  it('returns the failure from verifyTxHash after a successful spoke cancel', async () => {
    const intent = makeIntent(ChainKeys.BSC_MAINNET);
    const verifyError = new Error('VERIFY_FAILED');
    vi.spyOn(sodax.spokeService, 'sendMessage').mockResolvedValueOnce({ ok: true, value: '0xspokeCancelTx' });
    vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: false, error: verifyError });

    const result = await sodax.swaps.cancelIntent({
      srcChainKey: ChainKeys.BSC_MAINNET,
      intent,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: verifyError });
  });
});

describe('SwapService.cancelLimitOrder', () => {
  it('delegates directly to cancelIntent (thin pass-through)', async () => {
    const intent = makeIntent(ChainKeys.SONIC_MAINNET);
    const cancelSpy = vi
      .spyOn(sodax.swaps, 'cancelIntent')
      .mockResolvedValueOnce({ ok: true, value: ['0xspokeTx', '0xdstTx'] });

    const result = await sodax.swaps.cancelLimitOrder({
      srcChainKey: ChainKeys.SONIC_MAINNET,
      intent,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: true, value: ['0xspokeTx', '0xdstTx'] });
    // timeout defaults to DEFAULT_RELAY_TX_TIMEOUT; we don't pin the exact number so the test
    // isn't brittle to constant changes — just assert the pass-through.
    expect(cancelSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        srcChainKey: ChainKeys.SONIC_MAINNET,
        intent,
        walletProvider: mockEvmProvider,
        timeout: expect.any(Number),
      }),
    );
  });

  it('forwards cancelIntent failures as-is', async () => {
    const intent = makeIntent(ChainKeys.SONIC_MAINNET);
    const cancelError = new Error('CANCEL_FAILED');
    vi.spyOn(sodax.swaps, 'cancelIntent').mockResolvedValueOnce({ ok: false, error: cancelError });

    const result = await sodax.swaps.cancelLimitOrder({
      srcChainKey: ChainKeys.SONIC_MAINNET,
      intent,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: cancelError });
  });
});

// =========================================================================
// Batch 8: limit order family — error propagation + raw path for createLimitOrderIntent.
// =========================================================================

describe('SwapService.createLimitOrder — error propagation', () => {
  it('forwards a failure Result from swap() unchanged', async () => {
    const swapError = new Error('SWAP_FAILED');
    vi.spyOn(sodax.swaps, 'swap').mockResolvedValueOnce({ ok: false, error: swapError });

    const result = await sodax.swaps.createLimitOrder({
      params: intentInput(ChainKeys.BSC_MAINNET),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: swapError });
  });
});

describe('SwapService.createLimitOrderIntent — additional coverage', () => {
  it('raw=false delegates to createIntent with walletProvider and deadline=0n', async () => {
    const fakeIntent = makeIntent(ChainKeys.BSC_MAINNET);
    const createIntentSpy = vi.spyOn(sodax.swaps, 'createIntent').mockResolvedValueOnce({
      ok: true,
      value: ['0xtx' as never, { ...fakeIntent, feeAmount: 0n }, '0x'],
    });

    await sodax.swaps.createLimitOrderIntent({
      params: intentInput(ChainKeys.BSC_MAINNET),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    const forwarded = createIntentSpy.mock.calls[0]?.[0];
    expect((forwarded?.params as CreateIntentParams).deadline).toBe(0n);
    expect(forwarded?.walletProvider).toBe(mockEvmProvider);
  });

  it('forwards a failure Result from createIntent unchanged', async () => {
    const createError = new Error('CREATE_INTENT_FAILED');
    vi.spyOn(sodax.swaps, 'createIntent').mockResolvedValueOnce({ ok: false, error: createError });

    const result = await sodax.swaps.createLimitOrderIntent({
      params: intentInput(ChainKeys.BSC_MAINNET),
      raw: false,
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: createError });
  });
});
