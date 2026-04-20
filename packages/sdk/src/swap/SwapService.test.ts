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
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  ChainKeys,
  getIntentRelayChainId,
  spokeChainConfig,
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
import {
  isEvmChainKeyType,
  isHubChainKeyType,
  isSonicChainKeyType,
  isSpokeApproveParamsEvm,
  isSpokeApproveParamsStellar,
  isStellarChainKeyType,
  type SpokeApproveParams,
  type SpokeIsAllowanceValidParams,
  type SpokeIsAllowanceValidParamsEvmSpoke,
  type SpokeIsAllowanceValidParamsHub,
} from '../index.js';
import type { ConfigService } from '../shared/config/ConfigService.js';
import { Erc20Service } from '../shared/services/erc-20/Erc20Service.js';
import type { HubProvider } from '../shared/types/types.js';
import type { SpokeService } from '../shared/services/spoke/SpokeService.js';
import type { BitcoinSpokeService } from '../shared/services/spoke/BitcoinSpokeService.js';
import type { StellarSpokeService } from '../shared/services/spoke/StellarSpokeService.js';

// SwapService imports SonicSpokeService, EvmSolverService, HubService, etc. via the SDK barrel
// (`../index.js`). Under Vitest's module graph the barrel's re-export ordering makes a direct
// `vi.spyOn(Foo, ...)` unreliable — the SwapService-internal reference ends up as a different
// module instance than the test-side import. We mock the modules at their source paths so the
// SwapService sees our test doubles. `vi.hoisted` lets the mock factories reference top-level
// bindings safely despite `vi.mock` being hoisted to the file top.
const mocks = vi.hoisted(() => ({
  sonicCreateRawSwapIntent: vi.fn(),
  sonicCreateAndExecuteSwapIntent: vi.fn(),
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
}));
vi.mock('../shared/services/spoke/SonicSpokeService.js', () => ({
  SonicSpokeService: {
    createRawSwapIntent: mocks.sonicCreateRawSwapIntent,
    createAndExecuteSwapIntent: mocks.sonicCreateAndExecuteSwapIntent,
  },
}));
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

// --- minimal mocks --------------------------------------------------------

const mockIntentsContract = '0x0987654321098765432109876543210987654321';
const mockEvmProvider = {
  sendTransaction: vi.fn(),
  getWalletAddress: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
} as unknown as IEvmWalletProvider;
const mockSolanaProvider = { sendTransaction: vi.fn(), getWalletAddress: vi.fn() } as unknown as ISolanaWalletProvider;
const mockBitcoinProvider = { getWalletAddress: vi.fn(), signMessage: vi.fn() } as unknown as IBitcoinWalletProvider;
const mockStellarProvider = {
  getWalletAddress: vi.fn(),
  signTransaction: vi.fn(),
} as unknown as IStellarWalletProvider;

const mockConfigService = {
  isValidOriginalAssetAddress: vi.fn().mockReturnValue(true),
  isValidSpokeChainKey: vi.fn().mockReturnValue(true),
  isValidIntentRelayChainId: vi.fn().mockReturnValue(true),
  getHubAssetInfo: vi.fn().mockReturnValue({
    hubAsset: '0x0000000000000000000000000000000000000000',
    vault: '0x0',
    asset: '0x0',
    decimal: 18,
  }),
} as unknown as ConfigService;

const mockHubProvider = {
  chainConfig: { chain: { id: ChainKeys.SONIC_MAINNET } },
  publicClient: {},
} as unknown as HubProvider;

// Fresh SpokeService mock per test would be ideal, but since the constructor is private we
// can only fabricate one. Use a partial cast and override the methods we intercept.
function makeSpokeService(): SpokeService {
  const stellarSpokeService = {
    hasSufficientTrustline: vi.fn().mockResolvedValue(true),
    requestTrustline: vi.fn().mockResolvedValue('0xtrustline'),
  } as unknown as StellarSpokeService;
  const mockPublicClient = {};
  const evmSpokeService = {
    getPublicClient: vi.fn().mockReturnValue(mockPublicClient),
  };
  const sonicSpokeService = {
    publicClient: mockPublicClient,
  };
  const isAllowanceValid = vi.fn(async (params: SpokeIsAllowanceValidParams): Promise<Result<boolean>> => {
    const { srcChainKey, token, amount, owner } = params;
    if (isHubChainKeyType(srcChainKey) && isSonicChainKeyType(srcChainKey)) {
      return Erc20Service.isAllowanceValid({
        token: token as Address,
        amount,
        owner: owner as Address,
        spender: (params as SpokeIsAllowanceValidParamsHub).spender,
        chainKey: srcChainKey,
        publicClient: sonicSpokeService.publicClient as never,
      });
    }
    if (isEvmChainKeyType(srcChainKey) && !isHubChainKeyType(srcChainKey)) {
      const chainKey = srcChainKey;
      const evmParams = params as SpokeIsAllowanceValidParamsEvmSpoke;
      const spender = evmParams.spender ?? spokeChainConfig[chainKey].addresses.assetManager;
      return Erc20Service.isAllowanceValid({
        token: token as Address,
        amount,
        owner: owner as Address,
        spender,
        chainKey,
        publicClient: evmSpokeService.getPublicClient(chainKey) as never,
      });
    }
    if (isStellarChainKeyType(srcChainKey)) {
      return {
        ok: true,
        value: await stellarSpokeService.hasSufficientTrustline(token, amount, owner),
      };
    }
    return { ok: true, value: true };
  });
  const approve = vi.fn(
    async (params: SpokeApproveParams<boolean>): Promise<Result<TxReturnType<SpokeChainKey, boolean>>> => {
      if (isSpokeApproveParamsEvm(params)) {
        const { srcChainKey, token, amount, owner } = params;
        const spender =
          params.spender ??
          (isHubChainKeyType(srcChainKey) && isSonicChainKeyType(srcChainKey)
            ? undefined
            : spokeChainConfig[srcChainKey as EvmSpokeOnlyChainKey].addresses.assetManager);
        if (spender === undefined) {
          return { ok: false, error: new Error('[mock approve] spender required for hub') };
        }
        if (params.raw === true) {
          const result = await Erc20Service.approve({
            token: token as Address,
            amount,
            from: owner as Address,
            spender,
            raw: true,
          } as never);
          return { ok: true, value: result };
        }
        if (!('walletProvider' in params)) {
          return { ok: false, error: new Error('[mock approve] walletProvider required') };
        }
        const result = await Erc20Service.approve({
          token: token as Address,
          amount,
          from: owner as Address,
          spender,
          raw: false,
          walletProvider: params.walletProvider,
        } as never);
        return { ok: true, value: result };
      }
      if (isSpokeApproveParamsStellar(params)) {
        const { srcChainKey, token, amount, owner } = params;
        if (params.raw === true) {
          const result = await stellarSpokeService.requestTrustline({
            srcAddress: owner,
            srcChainKey,
            token,
            amount,
            raw: true,
            ...(params.skipSimulation !== undefined ? { skipSimulation: params.skipSimulation } : {}),
          } as never);
          return { ok: true, value: result };
        }
        if (!('walletProvider' in params)) {
          return { ok: false, error: new Error('[mock approve] walletProvider required') };
        }
        const result = await stellarSpokeService.requestTrustline({
          srcAddress: owner,
          srcChainKey,
          token,
          amount,
          raw: false,
          walletProvider: params.walletProvider,
          ...(params.skipSimulation !== undefined ? { skipSimulation: params.skipSimulation } : {}),
        } as never);
        return { ok: true, value: result };
      }
      return { ok: false, error: new Error('unsupported') };
    },
  );
  return {
    deposit: vi.fn(),
    sendMessage: vi.fn(),
    verifyTxHash: vi.fn().mockResolvedValue({ ok: true, value: true }),
    isAllowanceValid,
    approve,
    evmSpokeService: evmSpokeService as never,
    sonicSpokeService: sonicSpokeService as never,
    stellarSpokeService,
    bitcoinSpokeService: {
      getEffectiveWalletAddress: vi.fn().mockImplementation(async (a: string) => a),
      radfi: { ensureRadfiAccessToken: vi.fn().mockResolvedValue(undefined) },
    } as unknown as BitcoinSpokeService,
  } as unknown as SpokeService;
}

function makeSwapService(): SwapService {
  return new SwapService({
    config: { intentsContract: mockIntentsContract, solverApiEndpoint: 'https://solver.example' },
    configService: mockConfigService,
    hubProvider: mockHubProvider,
    spokeService: makeSpokeService(),
  });
}

// Base user-facing intent params parameterized by source chain. Returning a generic
// `CreateIntentParams<K>` lets the test call sites pass a literal ChainKey and have K
// inferred all the way through to walletProvider narrowing.
const intentInput = <K extends SpokeChainKey>(srcChain: K): CreateIntentParams<K> => ({
  inputToken: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
  outputToken: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
  inputAmount: 1_000_000n,
  minOutputAmount: 900_000n,
  deadline: 0n,
  allowPartialFill: false,
  srcChain,
  dstChain: ChainKeys.ARBITRUM_MAINNET,
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

  it('CreateIntentParams carries srcChain (the K generic anchor)', () => {
    expectTypeOf<CreateIntentParams>().toHaveProperty('srcChain');
    expectTypeOf<CreateIntentParams<'0x38.bsc'>['srcChain']>().toEqualTypeOf<'0x38.bsc'>();
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
    const svc = makeSwapService();
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
    const svc = makeSwapService();
    if (false as boolean) {
      // @ts-expect-error — walletProvider is required by SwapActionParams.
      void svc.createIntent({ params: intentInput(ChainKeys.BSC_MAINNET) });
    }
  });

  it('createIntentRaw rejects walletProvider — the raw twin has no such field', () => {
    const svc = makeSwapService();
    if (false as boolean) {
      void svc.createIntentRaw({
        params: intentInput(ChainKeys.BSC_MAINNET),
        // @ts-expect-error — walletProvider is not a property of SwapActionParamsRaw.
        walletProvider: mockEvmProvider,
      });
    }
  });

  it('rejects mismatched provider on cancelIntent', () => {
    const svc = makeSwapService();
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
  const svc = makeSwapService();

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
      void svc.createIntentRaw({ params: intentInput(ChainKeys.BSC_MAINNET) });
      void svc.createIntentRaw({ params: intentInput(ChainKeys.SOLANA_MAINNET) });
      void svc.createIntentRaw({ params: intentInput(ChainKeys.STELLAR_MAINNET) });
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
      void svc.createIntentRaw<SpokeChainKey>({ params });

      // Broad K falls back to IWalletProvider union; all chain providers are accepted.
      void svc.createIntent<SpokeChainKey>({ params, walletProvider: mockEvmProvider });
      void svc.createIntent<SpokeChainKey>({ params, walletProvider: mockSolanaProvider });
      void svc.createIntent<SpokeChainKey>({ params, walletProvider: mockStellarProvider });
    }
  });
});

describe('SwapService.swap — narrows walletProvider (always exec)', () => {
  const svc = makeSwapService();

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
  const svc = makeSwapService();

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
      void svc.approveRaw({ params: intentInput(ChainKeys.BSC_MAINNET) });
      void svc.approveRaw({
        params: intentInput(ChainKeys.BSC_MAINNET),
        // @ts-expect-error — walletProvider is not a property of SwapActionParamsRaw.
        walletProvider: mockEvmProvider,
      });
    }
  });
});

describe('SwapService.isAllowanceValid — narrows walletProvider from params.srcChain', () => {
  const svc = makeSwapService();

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
  const svc = makeSwapService();

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
      void svc.createLimitOrderIntentRaw({ params: intentInput(ChainKeys.BSC_MAINNET) });
      void svc.createLimitOrderIntentRaw({
        params: intentInput(ChainKeys.BSC_MAINNET),
        // @ts-expect-error — walletProvider is not a property of LimitOrderActionParamsRaw.
        walletProvider: mockEvmProvider,
      });
    }
  });
});

describe('SwapService.cancelIntent — narrows walletProvider from explicit srcChainKey', () => {
  const svc = makeSwapService();
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

describe('SwapService.isAllowanceValid', () => {
  it('checks ERC20 allowance against the intents contract on the hub (Sonic)', async () => {
    const svc = makeSwapService();
    const spy = vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

    const result = await svc.isAllowanceValid({
      params: intentInput(ChainKeys.SONIC_MAINNET),
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: true, value: true });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ spender: mockIntentsContract, chainKey: ChainKeys.SONIC_MAINNET }),
    );
  });

  it('checks ERC20 allowance against the asset manager on EVM spokes', async () => {
    const svc = makeSwapService();
    const spy = vi.spyOn(Erc20Service, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

    const result = await svc.isAllowanceValid({
      params: intentInput(ChainKeys.BSC_MAINNET),
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: true, value: true });
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ chainKey: ChainKeys.BSC_MAINNET }));
    // For BSC the spender is the BSC asset manager, not the intents contract.
    expect(spy.mock.calls[0]?.[0].spender).not.toBe(mockIntentsContract);
  });

  it('defers to Stellar trustline check for Stellar params.srcChain', async () => {
    const svc = makeSwapService();
    const stellarParams = intentInput(ChainKeys.STELLAR_MAINNET);
    const result = await svc.isAllowanceValid({
      params: stellarParams,
      walletProvider: mockStellarProvider,
    });
    expect(result).toEqual({ ok: true, value: true });
    expect(svc.spokeService.stellarSpokeService.hasSufficientTrustline).toHaveBeenCalledWith(
      stellarParams.inputToken,
      stellarParams.inputAmount,
      stellarParams.srcAddress,
    );
  });

  it('short-circuits to true for chains without allowance semantics (e.g. Solana)', async () => {
    const svc = makeSwapService();
    const result = await svc.isAllowanceValid({
      params: intentInput(ChainKeys.SOLANA_MAINNET),
      walletProvider: mockSolanaProvider,
    });
    expect(result).toEqual({ ok: true, value: true });
  });
});

describe('SwapService.approve', () => {
  it('approves the intents contract on Sonic (raw=false)', async () => {
    const svc = makeSwapService();
    const spy = vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce('0xapprove-hash' as never);

    const result = (await svc.approve({
      params: intentInput(ChainKeys.SONIC_MAINNET),
      walletProvider: mockEvmProvider,
    })) as Result<`0x${string}`>;

    expect(result).toEqual({ ok: true, value: '0xapprove-hash' });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ spender: mockIntentsContract, raw: false, walletProvider: mockEvmProvider }),
    );
  });

  it('approves the asset manager on EVM spokes (raw=true returns raw tx, no walletProvider)', async () => {
    const svc = makeSwapService();
    const rawTx = { from: '0x1', to: '0x2', data: '0x', value: 0n };
    const spy = vi.spyOn(Erc20Service, 'approve').mockResolvedValueOnce(rawTx as never);

    const result = await svc.approveRaw({
      params: intentInput(ChainKeys.BSC_MAINNET),
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(rawTx);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ raw: true }));
    // walletProvider must NOT leak into the downstream call when raw=true
    expect(spy.mock.calls[0]?.[0]).not.toHaveProperty('walletProvider');
  });

  it('delegates Stellar trustline requests to the Stellar spoke service', async () => {
    const svc = makeSwapService();
    const result = await svc.approve({
      params: intentInput(ChainKeys.STELLAR_MAINNET),
      walletProvider: mockStellarProvider,
    });
    expect(result.ok).toBe(true);
    expect(svc.spokeService.stellarSpokeService.requestTrustline).toHaveBeenCalled();
  });
});

describe('SwapService.createIntent', () => {
  it('on Sonic, delegates to SonicSpokeService.createRawSwapIntent when raw=true', async () => {
    const svc = makeSwapService();
    const fakeIntent = makeIntent(ChainKeys.SONIC_MAINNET);
    mocks.getUserHubWalletAddress.mockResolvedValueOnce('0xhubwallet');
    mocks.sonicCreateRawSwapIntent.mockResolvedValueOnce([
      { from: '0x1', to: '0x2', data: '0x', value: 0n },
      fakeIntent,
      123n,
      '0xdata',
    ]);

    const result = await svc.createIntentRaw({
      params: intentInput(ChainKeys.SONIC_MAINNET),
    });

    expect(result.ok).toBe(true);
    expect(mocks.sonicCreateRawSwapIntent).toHaveBeenCalled();
    expect(mocks.sonicCreateRawSwapIntent.mock.calls[0]?.[0].createIntentParams.srcChain).toBe(ChainKeys.SONIC_MAINNET);
  });

  it('on Sonic, delegates to SonicSpokeService.createAndExecuteSwapIntent when raw=false', async () => {
    const svc = makeSwapService();
    const fakeIntent = makeIntent(ChainKeys.SONIC_MAINNET);
    mocks.getUserHubWalletAddress.mockResolvedValueOnce('0xhubwallet');
    mocks.sonicCreateAndExecuteSwapIntent.mockResolvedValueOnce(['0xexec-hash', fakeIntent, 0n, '0xdata']);

    const result = await svc.createIntent({
      params: intentInput(ChainKeys.SONIC_MAINNET),
      walletProvider: mockEvmProvider,
    });

    expect(result.ok).toBe(true);
    expect(mocks.sonicCreateAndExecuteSwapIntent).toHaveBeenCalled();
    expect(mocks.sonicCreateAndExecuteSwapIntent.mock.calls[0]?.[0].walletProvider).toBe(mockEvmProvider);
  });

  it('on EVM spokes, builds intent data via EvmSolverService and deposits via SpokeService', async () => {
    const svc = makeSwapService();
    mocks.getUserHubWalletAddress.mockResolvedValueOnce('0xhubwallet');
    const fakeIntent = makeIntent(ChainKeys.BSC_MAINNET);
    mocks.constructCreateIntentData.mockReturnValueOnce(['0xintentdata', fakeIntent, 42n]);
    (svc.spokeService.deposit as ReturnType<typeof vi.fn>).mockResolvedValueOnce('0xdeposit-hash');

    const result = await svc.createIntent({
      params: intentInput(ChainKeys.BSC_MAINNET),
      walletProvider: mockEvmProvider,
    });

    expect(result.ok).toBe(true);
    expect(svc.spokeService.deposit).toHaveBeenCalled();
    const depositCall = (svc.spokeService.deposit as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(depositCall.srcChainKey).toBe(ChainKeys.BSC_MAINNET);
    expect(depositCall.raw).toBe(false);
    expect(depositCall.walletProvider).toBe(mockEvmProvider);
  });

  it('forwards the raw flag to SpokeService.deposit and does not pass walletProvider when raw=true', async () => {
    const svc = makeSwapService();
    mocks.getUserHubWalletAddress.mockResolvedValueOnce('0xhubwallet');
    mocks.constructCreateIntentData.mockReturnValueOnce(['0xintentdata', makeIntent(ChainKeys.BSC_MAINNET), 0n]);
    const rawDepositTx = { from: '0x1', to: '0x2', data: '0x', value: 0n };
    (svc.spokeService.deposit as ReturnType<typeof vi.fn>).mockResolvedValueOnce(rawDepositTx);

    const result = await svc.createIntentRaw({
      params: intentInput(ChainKeys.BSC_MAINNET),
    });

    expect(result.ok).toBe(true);
    const depositCall = (svc.spokeService.deposit as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(depositCall).not.toHaveProperty('walletProvider');
  });

  it('invokes Radfi access-token setup with the Bitcoin wallet provider when params.srcChain is Bitcoin and raw=false', async () => {
    const svc = makeSwapService();
    mocks.getUserHubWalletAddress.mockResolvedValueOnce('0xhubwallet');
    mocks.constructCreateIntentData.mockReturnValueOnce(['0xintentdata', makeIntent(ChainKeys.BITCOIN_MAINNET), 0n]);
    (svc.spokeService.deposit as ReturnType<typeof vi.fn>).mockResolvedValueOnce('0xdeposit-hash');

    await svc.createIntent({
      params: { ...intentInput(ChainKeys.BITCOIN_MAINNET), srcAddress: 'bc1qusersource' },
      walletProvider: mockBitcoinProvider,
    });

    expect(svc.spokeService.bitcoinSpokeService.getEffectiveWalletAddress).toHaveBeenCalledWith('bc1qusersource');
    expect(svc.spokeService.bitcoinSpokeService.radfi.ensureRadfiAccessToken).toHaveBeenCalledWith(mockBitcoinProvider);
  });
});

describe('SwapService.createLimitOrder and createLimitOrderIntent', () => {
  it('createLimitOrder forces deadline=0n and routes through swap()', async () => {
    const svc = makeSwapService();
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
      walletProvider: mockEvmProvider,
    });

    expect(swapSpy).toHaveBeenCalledTimes(1);
    const forwarded = swapSpy.mock.calls[0]?.[0];
    expect((forwarded?.params as CreateIntentParams).deadline).toBe(0n);
    expect(forwarded?.params.srcChain).toBe(ChainKeys.BSC_MAINNET);
    expect(forwarded?.walletProvider).toBe(mockEvmProvider);
  });

  it('createLimitOrderIntent delegates to createIntent with deadline=0n, preserving raw/K', async () => {
    const svc = makeSwapService();
    const baseInput = intentInput(ChainKeys.BSC_MAINNET);
    const fakeIntent = makeIntent(ChainKeys.BSC_MAINNET);
    const createIntentSpy = vi.spyOn(svc, 'createIntent').mockResolvedValueOnce({
      ok: true,
      value: ['0xtx' as never, { ...fakeIntent, feeAmount: 0n }, '0x'],
    });

    // createLimitOrderIntentRaw delegates to createIntentRaw; spy on that instead.
    const createIntentRawSpy = vi.spyOn(svc, 'createIntentRaw').mockResolvedValueOnce({
      ok: true,
      value: [{ from: '0x1', to: '0x2', data: '0x', value: 0n } as never, { ...fakeIntent, feeAmount: 0n }, '0x'],
    });
    createIntentSpy.mockRestore();

    await svc.createLimitOrderIntentRaw({
      params: { ...baseInput, deadline: 9999n },
    });

    expect(createIntentRawSpy).toHaveBeenCalledTimes(1);
    const forwarded = createIntentRawSpy.mock.calls[0]?.[0];
    expect((forwarded?.params as CreateIntentParams).deadline).toBe(0n);
    expect(forwarded?.params.srcChain).toBe(ChainKeys.BSC_MAINNET);
  });
});

describe('SwapService.cancelIntent', () => {
  it('sends a cancel message via SpokeService.sendMessage with the resolved srcChainKey', async () => {
    const svc = makeSwapService();
    const intent = makeIntent(ChainKeys.BSC_MAINNET);
    (svc.spokeService.sendMessage as ReturnType<typeof vi.fn>).mockResolvedValueOnce('0xcancel-hash');

    const result = await svc.cancelIntent({
      srcChainKey: ChainKeys.BSC_MAINNET,
      intent,
      walletProvider: mockEvmProvider,
    });

    if (!result.ok) throw new Error(`cancelIntent failed: ${String(result.error.data.error)}`);
    expect(result.ok).toBe(true);
    const sendCall = (svc.spokeService.sendMessage as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(sendCall.srcChainKey).toBe(ChainKeys.BSC_MAINNET);
    expect(sendCall.walletProvider).toBe(mockEvmProvider);
    expect(sendCall.raw).toBe(false);
  });

  // Note: SwapService.cancelIntent is exec-only by design — the raw twin lives at
  // createCancelIntent<K, true>. Runtime coverage for the raw path belongs there.

  it('returns CANCEL_FAILED when srcChainKey disagrees with intent.srcChain', async () => {
    const svc = makeSwapService();
    // Intent says BSC, but we pass Arbitrum as srcChainKey — should fail the runtime assert.
    const intent = makeIntent(ChainKeys.BSC_MAINNET);

    const result = await svc.cancelIntent({
      srcChainKey: ChainKeys.ARBITRUM_MAINNET,
      intent,
      walletProvider: mockEvmProvider,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CANCEL_FAILED');
      expect(String(result.error.data.error)).toMatch(/does not match intent\.srcChain/);
    }
    // sendMessage must NOT have been called because the assert fires before it.
    expect(svc.spokeService.sendMessage).not.toHaveBeenCalled();
  });
});
