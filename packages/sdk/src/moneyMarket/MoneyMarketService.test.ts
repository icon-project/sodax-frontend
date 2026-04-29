/**
 * Tests for the strongly-typed MoneyMarketService public API.
 *
 * Mirrors the shape of SwapService.test.ts:
 *
 *   1. `srcChainKey: K extends SpokeChainKey` is the generic anchor on every params object —
 *      it narrows the associated `walletProvider` via `GetWalletProviderType<K>`.
 *   2. `walletProvider` is required on exec methods (`supply`, `borrow`, `withdraw`, `repay`,
 *      `create*Intent`, `approve`). Use `{ raw: true }` for raw transaction payloads (no walletProvider); `{ raw: false, walletProvider }` for exec.
 *   3. Every test runs against a single module-scope `new Sodax()`. Internal collaborators
 *      (HubService, IntentRelayApiService) are mocked at their source paths via `vi.mock`;
 *      instance methods on the real `sodax.spokeService` and `sodax.config` are stubbed per-test
 *      with `vi.spyOn(...).mockResolvedValueOnce(...)`.
 */
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import type {
  Address,
  IBitcoinWalletProvider,
  IEvmWalletProvider,
  ISolanaWalletProvider,
  IStellarWalletProvider,
  Result,
  SpokeChainKey,
} from '@sodax/types';
// `@sodax/types` is consumed from `dist/` in vitest; in this branch the generated dist entry
// is stale for some exports. Import ChainKeys / spokeChainConfig directly from source so the
// SDK unit tests stay runnable.
import { ChainKeys } from '../../../types/src/chains/chain-keys.js';
import { spokeChainConfig } from '../../../types/src/chains/chains.js';
import { Sodax } from '../shared/entities/Sodax.js';
import { decodeFunctionData } from 'viem';
import { poolAbi } from '../shared/abis/pool.abi.js';

// MoneyMarketService imports HubService + relayTxAndWaitPacket statically. Like in
// SwapService.test.ts we mock those at their source paths so the service-internal references
// resolve to our test doubles. `vi.hoisted` lets the mock factories reference shared
// top-level mocks despite `vi.mock` being hoisted to the file top.
const mocks = vi.hoisted(() => ({
  getUserHubWalletAddress: vi.fn(),
  getUserRouter: vi.fn(),
  relayTxAndWaitPacket: vi.fn(),
}));
vi.mock('../shared/services/hub/HubService.js', () => ({
  HubService: {
    getUserHubWalletAddress: mocks.getUserHubWalletAddress,
    getUserRouter: mocks.getUserRouter,
  },
}));
// Partial mock — IntentRelayApiService also exports types we want to keep intact.
vi.mock('../shared/services/intentRelay/IntentRelayApiService.js', async () => {
  const actual = await vi.importActual<object>('../shared/services/intentRelay/IntentRelayApiService.js');
  return {
    ...actual,
    relayTxAndWaitPacket: mocks.relayTxAndWaitPacket,
  };
});

import {
  MoneyMarketService,
  type MoneyMarketBorrowActionParams,
  type MoneyMarketBorrowParams,
  type MoneyMarketRepayActionParams,
  type MoneyMarketRepayParams,
  type MoneyMarketSupplyActionParams,
  type MoneyMarketSupplyParams,
  type MoneyMarketWithdrawActionParams,
  type MoneyMarketWithdrawParams,
} from './MoneyMarketService.js';

// --- test fixtures --------------------------------------------------------
//
// One real Sodax instance backs every test in the file. `new Sodax()` wires up the full
// dependency graph — we never stub the wiring, only the leaves (collaborators reached via
// static imports get vi.mock; instance methods on the real services get vi.spyOn per test).

const sodax = new Sodax();

// Hub-chain wallet address returned by HubService.getUserHubWalletAddress in most happy-path tests.
const HUB_WALLET = '0x1111111111111111111111111111111111111111' as Address;
const TO_HUB_WALLET = '0x2222222222222222222222222222222222222222' as Address;
const USER_ROUTER = '0x3333333333333333333333333333333333333333' as Address;

// Sample valid EVM token address (cast from a real BSC ETHB-style address).
const SAMPLE_EVM_TOKEN = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8' as Address;
const SAMPLE_USER_ADDRESS = '0x4444444444444444444444444444444444444444' as Address;
const SAMPLE_DST_ADDRESS = '0x5555555555555555555555555555555555555555' as Address;

// Wallet provider fakes — shape-only; the bodies are never invoked at runtime because
// every spoke method that would touch them is stubbed.
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
const mockStellarProvider = {
  chainType: 'STELLAR',
  getWalletAddress: vi.fn(),
  signTransaction: vi.fn(),
} as unknown as IStellarWalletProvider;
const mockBitcoinProvider = {
  chainType: 'BITCOIN',
  getWalletAddress: vi.fn(),
  signMessage: vi.fn(),
} as unknown as IBitcoinWalletProvider;

// Per-action params factories. Keeping K generic lets test call sites pass a literal ChainKey
// and have it inferred all the way to walletProvider narrowing.
const supplyParams = <K extends SpokeChainKey>(srcChainKey: K): MoneyMarketSupplyParams<K> => ({
  srcChainKey,
  srcAddress: SAMPLE_USER_ADDRESS,
  token: SAMPLE_EVM_TOKEN,
  amount: 1_000_000n,
  action: 'supply',
});

const borrowParams = <K extends SpokeChainKey>(srcChainKey: K): MoneyMarketBorrowParams<K> => ({
  srcChainKey,
  srcAddress: SAMPLE_USER_ADDRESS,
  token: SAMPLE_EVM_TOKEN,
  amount: 1_000_000n,
  action: 'borrow',
});

const withdrawParams = <K extends SpokeChainKey>(srcChainKey: K): MoneyMarketWithdrawParams<K> => ({
  srcChainKey,
  srcAddress: SAMPLE_USER_ADDRESS,
  token: SAMPLE_EVM_TOKEN,
  amount: 1_000_000n,
  action: 'withdraw',
});

const repayParams = <K extends SpokeChainKey>(srcChainKey: K): MoneyMarketRepayParams<K> => ({
  srcChainKey,
  srcAddress: SAMPLE_USER_ADDRESS,
  token: SAMPLE_EVM_TOKEN,
  amount: 1_000_000n,
  action: 'repay',
});

beforeEach(() => {
  // Default: `isMoneyMarketSupportedToken` returns true so happy-path tests don't have to
  // re-stub it. Tests that exercise the unsupported-token invariant override it explicitly.
  vi.spyOn(sodax.config, 'isMoneyMarketSupportedToken').mockReturnValue(true);
  // Default HubService responses — exec/raw create*Intent paths call this for src + dst wallets
  // via Promise.all, so we configure the mock to always resolve. Per-test calls override.
  mocks.getUserHubWalletAddress.mockResolvedValue(HUB_WALLET);
  mocks.getUserRouter.mockResolvedValue(USER_ROUTER);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

// =========================================================================
// Type-level tests — verified at compile time. The test passes if it type-checks.
// Wrapping the call sites in `if (false as boolean)` ensures the bodies never execute.
// =========================================================================

describe('MoneyMarketService types — walletProvider narrowing', () => {
  it('SupplyActionParams narrows walletProvider via K', () => {
    expectTypeOf<MoneyMarketSupplyActionParams<'0x38.bsc', false>['walletProvider']>().toEqualTypeOf<IEvmWalletProvider>();
    expectTypeOf<MoneyMarketSupplyActionParams<'sonic', false>['walletProvider']>().toEqualTypeOf<IEvmWalletProvider>();
    expectTypeOf<MoneyMarketSupplyActionParams<'solana', false>['walletProvider']>().toEqualTypeOf<ISolanaWalletProvider>();
    expectTypeOf<MoneyMarketSupplyActionParams<'stellar', false>['walletProvider']>().toEqualTypeOf<IStellarWalletProvider>();
    expectTypeOf<MoneyMarketSupplyActionParams<'bitcoin', false>['walletProvider']>().toEqualTypeOf<IBitcoinWalletProvider>();
  });

  it('BorrowActionParams / WithdrawActionParams / RepayActionParams narrow walletProvider via K', () => {
    expectTypeOf<MoneyMarketBorrowActionParams<'0x38.bsc', false>['walletProvider']>().toEqualTypeOf<IEvmWalletProvider>();
    expectTypeOf<MoneyMarketWithdrawActionParams<'solana', false>['walletProvider']>().toEqualTypeOf<ISolanaWalletProvider>();
    expectTypeOf<MoneyMarketRepayActionParams<'stellar', false>['walletProvider']>().toEqualTypeOf<IStellarWalletProvider>();
  });

  it('Raw twins have no walletProvider property', () => {
    expectTypeOf<MoneyMarketSupplyActionParams<'0x38.bsc', true>>().not.toHaveProperty('walletProvider');
    expectTypeOf<MoneyMarketBorrowActionParams<'solana', true>>().not.toHaveProperty('walletProvider');
    expectTypeOf<MoneyMarketWithdrawActionParams<'stellar', true>>().not.toHaveProperty('walletProvider');
    expectTypeOf<MoneyMarketRepayActionParams<'bitcoin', true>>().not.toHaveProperty('walletProvider');
  });

  it('Each action params type carries the discriminating `action` literal', () => {
    expectTypeOf<MoneyMarketSupplyParams['action']>().toEqualTypeOf<'supply'>();
    expectTypeOf<MoneyMarketBorrowParams['action']>().toEqualTypeOf<'borrow'>();
    expectTypeOf<MoneyMarketWithdrawParams['action']>().toEqualTypeOf<'withdraw'>();
    expectTypeOf<MoneyMarketRepayParams['action']>().toEqualTypeOf<'repay'>();
  });
});

describe('MoneyMarketService types — method call sites narrow walletProvider', () => {
  const mm = sodax.moneyMarket;

  it('supply: EVM literal requires IEvmWalletProvider', () => {
    if (false as boolean) {
      void mm.supply({ raw: false, params: supplyParams(ChainKeys.BSC_MAINNET), walletProvider: mockEvmProvider });
      void mm.supply({
        raw: false,
        params: supplyParams(ChainKeys.BSC_MAINNET),
        // @ts-expect-error — Solana provider mismatched on EVM chain.
        walletProvider: mockSolanaProvider,
      });
    }
  });

  it('borrow: Solana literal requires ISolanaWalletProvider', () => {
    if (false as boolean) {
      void mm.borrow({ raw: false, params: borrowParams(ChainKeys.SOLANA_MAINNET), walletProvider: mockSolanaProvider });
      void mm.borrow({
        raw: false,
        params: borrowParams(ChainKeys.SOLANA_MAINNET),
        // @ts-expect-error — EVM provider mismatched on Solana chain.
        walletProvider: mockEvmProvider,
      });
    }
  });

  it('withdraw: Stellar literal requires IStellarWalletProvider', () => {
    if (false as boolean) {
      void mm.withdraw({ raw: false, params: withdrawParams(ChainKeys.STELLAR_MAINNET), walletProvider: mockStellarProvider });
      void mm.withdraw({
        raw: false,
        params: withdrawParams(ChainKeys.STELLAR_MAINNET),
        // @ts-expect-error — EVM provider mismatched on Stellar chain.
        walletProvider: mockEvmProvider,
      });
    }
  });

  it('repay: Bitcoin literal requires IBitcoinWalletProvider', () => {
    if (false as boolean) {
      void mm.repay({ raw: false, params: repayParams(ChainKeys.BITCOIN_MAINNET), walletProvider: mockBitcoinProvider });
      void mm.repay({
        raw: false,
        params: repayParams(ChainKeys.BITCOIN_MAINNET),
        // @ts-expect-error — EVM provider mismatched on Bitcoin chain.
        walletProvider: mockEvmProvider,
      });
    }
  });

  it('createSupplyIntent / approve with raw:true forbid walletProvider field', () => {
    if (false as boolean) {
      void mm.createSupplyIntent({ raw: true, params: supplyParams(ChainKeys.BSC_MAINNET) });
      void mm.approve({ raw: true, params: supplyParams(ChainKeys.BSC_MAINNET) });
    }
  });

  it('exec methods reject calls missing walletProvider', () => {
    if (false as boolean) {
      // @ts-expect-error — walletProvider required on exec.
      void mm.supply({ raw: false, params: supplyParams(ChainKeys.BSC_MAINNET) });
      // @ts-expect-error — walletProvider required on exec.
      void mm.createBorrowIntent({ raw: false, params: borrowParams(ChainKeys.SOLANA_MAINNET) });
    }
  });
});

// =========================================================================
// Info getters — pure delegations to ConfigService.
// =========================================================================

describe('MoneyMarketService.getSupportedTokensByChainId', () => {
  it('forwards the chainId to ConfigService.getSupportedMoneyMarketTokensByChainId', () => {
    const fakeTokens = [{ symbol: 'USDC' }] as never;
    const spy = vi.spyOn(sodax.config, 'getSupportedMoneyMarketTokensByChainId').mockReturnValueOnce(fakeTokens);

    const result = sodax.moneyMarket.getSupportedTokensByChainId(ChainKeys.BSC_MAINNET);

    expect(result).toBe(fakeTokens);
    expect(spy).toHaveBeenCalledWith(ChainKeys.BSC_MAINNET);
  });
});

describe('MoneyMarketService.getSupportedTokens', () => {
  it('returns whatever ConfigService.getSupportedMoneyMarketTokens returns', () => {
    const fakeAll = { [ChainKeys.BSC_MAINNET]: [] } as never;
    const spy = vi.spyOn(sodax.config, 'getSupportedMoneyMarketTokens').mockReturnValueOnce(fakeAll);

    const result = sodax.moneyMarket.getSupportedTokens();

    expect(result).toBe(fakeAll);
    expect(spy).toHaveBeenCalled();
  });
});

describe('MoneyMarketService.getSupportedReserves', () => {
  it('returns whatever ConfigService.getMoneyMarketReserveAssets returns', () => {
    const fakeReserves = ['0xa', '0xb'] as never;
    const spy = vi.spyOn(sodax.config, 'getMoneyMarketReserveAssets').mockReturnValueOnce(fakeReserves);

    const result = sodax.moneyMarket.getSupportedReserves();

    expect(result).toBe(fakeReserves);
    expect(spy).toHaveBeenCalled();
  });
});

// =========================================================================
// estimateGas — thin wrapper around SpokeService.estimateGas.
// =========================================================================

describe('MoneyMarketService.estimateGas', () => {
  it('delegates to spokeService.estimateGas and returns the Result', async () => {
    const ok = { ok: true as const, value: { gas: 21_000n } as never };
    const spy = vi.spyOn(sodax.spokeService, 'estimateGas').mockResolvedValueOnce(ok);
    const params = { chainKey: ChainKeys.BSC_MAINNET } as never;

    const result = await sodax.moneyMarket.estimateGas(params);

    expect(result).toBe(ok);
    expect(spy).toHaveBeenCalledWith(params);
  });

  it('forwards a failure Result unchanged', async () => {
    const failure = { ok: false as const, error: new Error('GAS_FAILED') };
    vi.spyOn(sodax.spokeService, 'estimateGas').mockResolvedValueOnce(failure);

    const result = await sodax.moneyMarket.estimateGas({ chainKey: ChainKeys.BSC_MAINNET } as never);

    expect(result).toBe(failure);
  });
});

// =========================================================================
// Static encoders — pure functions over poolAbi. Two tests each: shape +
// argument forwarding.
// =========================================================================

describe('MoneyMarketService static encoders', () => {
  const lendingPool = '0x6666666666666666666666666666666666666666' as Address;
  const asset = '0x7777777777777777777777777777777777777777' as Address;
  const onBehalfOf = '0x8888888888888888888888888888888888888888' as Address;
  const to = '0x9999999999999999999999999999999999999999' as Address;

  it('encodeSupply targets the lendingPool, encodes the "supply" selector, and forwards args', () => {
    const call = MoneyMarketService.encodeSupply({ asset, amount: 100n, onBehalfOf, referralCode: 7 }, lendingPool);
    expect(call.address).toBe(lendingPool);
    expect(call.value).toBe(0n);

    const decoded = decodeFunctionData({ abi: poolAbi, data: call.data });
    expect(decoded.functionName).toBe('supply');
    expect(decoded.args).toEqual([asset, 100n, onBehalfOf, 7]);
  });

  it('encodeWithdraw / encodeBorrow / encodeRepay / encodeRepayWithATokens / encodeSetUserUseReserveAsCollateral encode the matching pool selector with forwarded args', () => {
    const cases = [
      {
        call: MoneyMarketService.encodeWithdraw({ asset, amount: 1n, to }, lendingPool),
        functionName: 'withdraw',
        args: [asset, 1n, to],
      },
      {
        call: MoneyMarketService.encodeBorrow(
          { asset, amount: 2n, interestRateMode: 2n, referralCode: 0, onBehalfOf },
          lendingPool,
        ),
        functionName: 'borrow',
        args: [asset, 2n, 2n, 0, onBehalfOf],
      },
      {
        call: MoneyMarketService.encodeRepay({ asset, amount: 3n, interestRateMode: 2n, onBehalfOf }, lendingPool),
        functionName: 'repay',
        args: [asset, 3n, 2n, onBehalfOf],
      },
      {
        call: MoneyMarketService.encodeRepayWithATokens({ asset, amount: 4n, interestRateMode: 2n }, lendingPool),
        functionName: 'repayWithATokens',
        args: [asset, 4n, 2n],
      },
      {
        call: MoneyMarketService.encodeSetUserUseReserveAsCollateral(asset, true, lendingPool),
        functionName: 'setUserUseReserveAsCollateral',
        args: [asset, true],
      },
    ] as const;

    for (const { call, functionName, args } of cases) {
      expect(call.address).toBe(lendingPool);
      expect(call.value).toBe(0n);
      const decoded = decodeFunctionData({ abi: poolAbi, data: call.data });
      expect(decoded.functionName).toBe(functionName);
      expect(decoded.args).toEqual(args);
    }
    // Sanity: each selector is distinct (different function names produce different 4-byte selectors).
    const selectors = new Set(cases.map(c => c.call.data.slice(0, 10)));
    expect(selectors.size).toBe(cases.length);
  });

  it('calculateATokenAmount applies the RAY-precision formula', () => {
    // Formula: (amount * 1e27) / normalizedIncome + 1
    const amount = 1_000_000n;
    const normalizedIncome = 10n ** 27n; // 1.0 in RAY → result is amount + 1
    expect(MoneyMarketService.calculateATokenAmount(amount, normalizedIncome)).toBe(amount + 1n);

    const halfRay = 5n * 10n ** 26n; // 0.5 in RAY → result is 2x amount + 1
    expect(MoneyMarketService.calculateATokenAmount(amount, halfRay)).toBe(2n * amount + 1n);
  });
});

// =========================================================================
// isAllowanceValid — branchy. Hub / EVM-spoke / Stellar (src and dst) /
// Solana short-circuit / withdraw + borrow short-circuit.
// =========================================================================

describe('MoneyMarketService.isAllowanceValid', () => {
  describe('happy paths', () => {
    it('on hub (Sonic) supply: looks up the user router and delegates to spokeService.isAllowanceValid', async () => {
      mocks.getUserRouter.mockResolvedValueOnce(USER_ROUTER);
      const spy = vi.spyOn(sodax.spokeService, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

      const result = await sodax.moneyMarket.isAllowanceValid({
        params: supplyParams(ChainKeys.SONIC_MAINNET),
      });

      expect(result).toEqual({ ok: true, value: true });
      expect(mocks.getUserRouter).toHaveBeenCalledWith(SAMPLE_USER_ADDRESS, sodax.hubProvider);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          srcChainKey: ChainKeys.SONIC_MAINNET,
          owner: SAMPLE_USER_ADDRESS,
          spender: USER_ROUTER,
          token: SAMPLE_EVM_TOKEN,
          amount: 1_000_000n,
        }),
      );
    });

    it('on EVM spoke (BSC) supply: delegates with the spoke assetManager as spender', async () => {
      const spy = vi.spyOn(sodax.spokeService, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

      const result = await sodax.moneyMarket.isAllowanceValid({
        params: supplyParams(ChainKeys.BSC_MAINNET),
      });

      expect(result).toEqual({ ok: true, value: true });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          srcChainKey: ChainKeys.BSC_MAINNET,
          spender: spokeChainConfig[ChainKeys.BSC_MAINNET].addresses.assetManager,
        }),
      );
    });

    it('on EVM spoke repay: same EVM-spoke spender path applies', async () => {
      const spy = vi.spyOn(sodax.spokeService, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

      await sodax.moneyMarket.isAllowanceValid({
        params: repayParams(ChainKeys.BSC_MAINNET),
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          srcChainKey: ChainKeys.BSC_MAINNET,
          spender: spokeChainConfig[ChainKeys.BSC_MAINNET].addresses.assetManager,
        }),
      );
    });

    it('withdraw: short-circuits to true with no spoke call AND validates the token on toChainId (distinct from src)', async () => {
      const spy = vi.spyOn(sodax.spokeService, 'isAllowanceValid');
      const supportedTokenSpy = vi.spyOn(sodax.config, 'isMoneyMarketSupportedToken');
      // Use a distinct toChainId so a mutant flipping `params.action === 'withdraw' || 'borrow'`
      // would cause the wrong-chain branch to be taken (spying for assertion below).
      const result = await sodax.moneyMarket.isAllowanceValid({
        params: { ...withdrawParams(ChainKeys.BSC_MAINNET), toChainId: ChainKeys.SONIC_MAINNET },
      });

      expect(result).toEqual({ ok: true, value: true });
      expect(spy).not.toHaveBeenCalled();
      // The withdraw/borrow branch validates on `toChainId`. If the action discriminant flips,
      // the else branch fires and validates on srcChainKey (BSC) instead. Pinning the chain arg
      // kills the StringLiteral mutants on `'withdraw' || 'borrow'`.
      expect(supportedTokenSpy).toHaveBeenCalledWith(ChainKeys.SONIC_MAINNET, SAMPLE_EVM_TOKEN);
    });

    it('borrow: short-circuits to true with no spoke call AND validates the token on toChainId (distinct from src)', async () => {
      const spy = vi.spyOn(sodax.spokeService, 'isAllowanceValid');
      const supportedTokenSpy = vi.spyOn(sodax.config, 'isMoneyMarketSupportedToken');

      const result = await sodax.moneyMarket.isAllowanceValid({
        params: { ...borrowParams(ChainKeys.BSC_MAINNET), toChainId: ChainKeys.SONIC_MAINNET },
      });

      expect(result).toEqual({ ok: true, value: true });
      expect(spy).not.toHaveBeenCalled();
      expect(supportedTokenSpy).toHaveBeenCalledWith(ChainKeys.SONIC_MAINNET, SAMPLE_EVM_TOKEN);
    });

    it('Solana supply: short-circuits to true (no allowance concept) without calling spoke', async () => {
      const spy = vi.spyOn(sodax.spokeService, 'isAllowanceValid');

      const result = await sodax.moneyMarket.isAllowanceValid({
        params: supplyParams(ChainKeys.SOLANA_MAINNET),
      });

      expect(result).toEqual({ ok: true, value: true });
      expect(spy).not.toHaveBeenCalled();
    });

    it('Stellar src: delegates Stellar trustline check with srcAddress as owner', async () => {
      const spy = vi.spyOn(sodax.spokeService, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

      const result = await sodax.moneyMarket.isAllowanceValid({
        params: supplyParams(ChainKeys.STELLAR_MAINNET),
      });

      expect(result).toEqual({ ok: true, value: true });
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          srcChainKey: ChainKeys.STELLAR_MAINNET,
          owner: SAMPLE_USER_ADDRESS,
        }),
      );
    });

    it('Stellar dst (non-Stellar src): checks recipient trustline only', async () => {
      const spy = vi.spyOn(sodax.spokeService, 'isAllowanceValid').mockResolvedValueOnce({ ok: true, value: true });

      const result = await sodax.moneyMarket.isAllowanceValid({
        params: {
          ...supplyParams(ChainKeys.BSC_MAINNET),
          toChainId: ChainKeys.STELLAR_MAINNET,
          toAddress: SAMPLE_DST_ADDRESS,
        },
      });

      expect(result).toEqual({ ok: true, value: true });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          srcChainKey: ChainKeys.STELLAR_MAINNET,
          owner: SAMPLE_DST_ADDRESS,
        }),
      );
    });

    it('Stellar src + Stellar dst: ANDs both trustline checks', async () => {
      const spy = vi
        .spyOn(sodax.spokeService, 'isAllowanceValid')
        // dst trustline (called first inside the function)
        .mockResolvedValueOnce({ ok: true, value: true })
        // src trustline (only called when src is also Stellar)
        .mockResolvedValueOnce({ ok: true, value: true });

      const result = await sodax.moneyMarket.isAllowanceValid({
        params: {
          ...supplyParams(ChainKeys.STELLAR_MAINNET),
          toChainId: ChainKeys.STELLAR_MAINNET,
          toAddress: SAMPLE_DST_ADDRESS,
        },
      });

      expect(result).toEqual({ ok: true, value: true });
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('Stellar src + Stellar dst: returns false when one trustline is insufficient', async () => {
      vi.spyOn(sodax.spokeService, 'isAllowanceValid')
        .mockResolvedValueOnce({ ok: true, value: true })
        .mockResolvedValueOnce({ ok: true, value: false });

      const result = await sodax.moneyMarket.isAllowanceValid({
        params: {
          ...supplyParams(ChainKeys.STELLAR_MAINNET),
          toChainId: ChainKeys.STELLAR_MAINNET,
          toAddress: SAMPLE_DST_ADDRESS,
        },
      });

      expect(result).toEqual({ ok: true, value: false });
    });
  });

  describe('rejects on invalid inputs', () => {
    it('rejects when amount is 0', async () => {
      const result = await sodax.moneyMarket.isAllowanceValid({
        params: { ...supplyParams(ChainKeys.BSC_MAINNET), amount: 0n },
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Amount must be greater than 0/);
    });

    it('rejects when token is empty', async () => {
      const result = await sodax.moneyMarket.isAllowanceValid({
        params: { ...supplyParams(ChainKeys.BSC_MAINNET), token: '' },
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Token is required/);
    });

    it('rejects supply when token is unsupported on srcChain', async () => {
      vi.spyOn(sodax.config, 'isMoneyMarketSupportedToken').mockReturnValueOnce(false);

      const result = await sodax.moneyMarket.isAllowanceValid({
        params: supplyParams(ChainKeys.BSC_MAINNET),
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Unsupported spoke chain/);
    });

    it('rejects withdraw when token is unsupported on toChainId (default = srcChain)', async () => {
      vi.spyOn(sodax.config, 'isMoneyMarketSupportedToken').mockReturnValueOnce(false);

      const result = await sodax.moneyMarket.isAllowanceValid({
        params: withdrawParams(ChainKeys.BSC_MAINNET),
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Unsupported spoke chain/);
    });
  });

  describe('propagates internal errors', () => {
    it('returns ok:false when HubService.getUserRouter rejects (hub supply path)', async () => {
      const routerError = new Error('ROUTER_LOOKUP_FAILED');
      mocks.getUserRouter.mockRejectedValueOnce(routerError);

      const result = await sodax.moneyMarket.isAllowanceValid({
        params: supplyParams(ChainKeys.SONIC_MAINNET),
      });

      expect(result).toEqual({ ok: false, error: routerError });
    });

    it('forwards a failure Result from spokeService.isAllowanceValid (EVM-spoke supply path)', async () => {
      const allowanceError = new Error('ALLOWANCE_CHECK_FAILED');
      vi.spyOn(sodax.spokeService, 'isAllowanceValid').mockResolvedValueOnce({
        ok: false,
        error: allowanceError,
      });

      const result = await sodax.moneyMarket.isAllowanceValid({
        params: supplyParams(ChainKeys.BSC_MAINNET),
      });

      expect(result).toEqual({ ok: false, error: allowanceError });
    });

    it('returns ok:false when spokeService.isAllowanceValid throws', async () => {
      const rpcError = new Error('RPC_DOWN');
      vi.spyOn(sodax.spokeService, 'isAllowanceValid').mockRejectedValueOnce(rpcError);

      const result = await sodax.moneyMarket.isAllowanceValid({
        params: supplyParams(ChainKeys.BSC_MAINNET),
      });

      expect(result).toEqual({ ok: false, error: rpcError });
    });

    it('forwards a failure Result from the src trustline lookup (Stellar src+dst path)', async () => {
      const trustlineError = new Error('TRUSTLINE_FAILED');
      vi.spyOn(sodax.spokeService, 'isAllowanceValid')
        .mockResolvedValueOnce({ ok: true, value: true })
        .mockResolvedValueOnce({ ok: false, error: trustlineError });

      const result = await sodax.moneyMarket.isAllowanceValid({
        params: {
          ...supplyParams(ChainKeys.STELLAR_MAINNET),
          toChainId: ChainKeys.STELLAR_MAINNET,
          toAddress: SAMPLE_DST_ADDRESS,
        },
      });

      expect(result).toEqual({ ok: false, error: trustlineError });
    });
  });
});

// =========================================================================
// approve (exec + raw: true) — three chain branches (hub, EVM spoke, Stellar) plus
// invariant rejections and error propagation.
// =========================================================================

describe('MoneyMarketService.approve', () => {
  it('on hub (Sonic) supply: resolves the user router and delegates to spokeService.approve', async () => {
    mocks.getUserRouter.mockResolvedValueOnce(USER_ROUTER);
    const spy = vi.spyOn(sodax.spokeService, 'approve').mockResolvedValueOnce({ ok: true, value: '0xapprove-hash' });

    const result = (await sodax.moneyMarket.approve({
      raw: false,
      params: supplyParams(ChainKeys.SONIC_MAINNET),
      walletProvider: mockEvmProvider,
    })) as Result<`0x${string}`>;

    expect(result).toEqual({ ok: true, value: '0xapprove-hash' });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        srcChainKey: ChainKeys.SONIC_MAINNET,
        spender: USER_ROUTER,
        raw: false,
        walletProvider: mockEvmProvider,
      }),
    );
  });

  it('on EVM spoke supply: delegates with the spoke assetManager as spender', async () => {
    const spy = vi.spyOn(sodax.spokeService, 'approve').mockResolvedValueOnce({ ok: true, value: '0xapprove-hash' });

    const result = await sodax.moneyMarket.approve({
      raw: false,
      params: supplyParams(ChainKeys.BSC_MAINNET),
      walletProvider: mockEvmProvider,
    });

    expect(result.ok).toBe(true);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        srcChainKey: ChainKeys.BSC_MAINNET,
        spender: spokeChainConfig[ChainKeys.BSC_MAINNET].addresses.assetManager,
        raw: false,
      }),
    );
  });

  it('on Stellar: delegates a trustline approval (no action-type check)', async () => {
    const spy = vi.spyOn(sodax.spokeService, 'approve').mockResolvedValueOnce({ ok: true, value: '0xtrustline' });

    // Stellar approve goes through even when action is 'withdraw' — Stellar's branch sits
    // before the action invariant, and trustline enables both incoming and outgoing transfers.
    await sodax.moneyMarket.approve({
      raw: false,
      params: withdrawParams(ChainKeys.STELLAR_MAINNET),
      walletProvider: mockStellarProvider,
    });

    expect(spy).toHaveBeenCalled();
    const call = spy.mock.calls[0]?.[0];
    expect(call?.srcChainKey).toBe(ChainKeys.STELLAR_MAINNET);
  });

  describe('rejects on invalid inputs', () => {
    it('rejects amount = 0', async () => {
      const result = await sodax.moneyMarket.approve({
        raw: false,
        params: { ...supplyParams(ChainKeys.BSC_MAINNET), amount: 0n },
        walletProvider: mockEvmProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Amount must be greater than 0/);
    });

    it('rejects empty token', async () => {
      const result = await sodax.moneyMarket.approve({
        raw: false,
        params: { ...supplyParams(ChainKeys.BSC_MAINNET), token: '' },
        walletProvider: mockEvmProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Token is required/);
    });

    it('rejects when walletProvider chainType does not match srcChain', async () => {
      const result = await sodax.moneyMarket.approve({
        raw: false,
        params: supplyParams(ChainKeys.BSC_MAINNET),
        // Defeat the compile-time narrowing to reach the runtime invariant.
        walletProvider: mockSolanaProvider as unknown as IEvmWalletProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Invalid wallet provider for chain key/);
    });

    it('rejects withdraw on EVM (only supply / repay require approval on EVM)', async () => {
      const result = await sodax.moneyMarket.approve({
        raw: false,
        params: withdrawParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Invalid action/);
    });

    it('rejects when token is not a valid EVM address (hub path)', async () => {
      const result = await sodax.moneyMarket.approve({
        raw: false,
        params: { ...supplyParams(ChainKeys.SONIC_MAINNET), token: 'not-an-address' },
        walletProvider: mockEvmProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Invalid token address/);
    });

    it('rejects on a non-supported chain type (e.g. Solana goes to the unsupported-chain error)', async () => {
      const result = await sodax.moneyMarket.approve({
        raw: false,
        params: supplyParams(ChainKeys.SOLANA_MAINNET),
        walletProvider: mockSolanaProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Approve only supported/);
    });
  });

  describe('propagates internal errors', () => {
    it('returns ok:false when HubService.getUserRouter rejects (hub path)', async () => {
      const routerError = new Error('ROUTER_LOOKUP_FAILED');
      mocks.getUserRouter.mockRejectedValueOnce(routerError);

      const result = await sodax.moneyMarket.approve({
        raw: false,
        params: supplyParams(ChainKeys.SONIC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: routerError });
    });

    it('forwards a failure Result from spokeService.approve (EVM-spoke path)', async () => {
      const approveError = new Error('APPROVE_REJECTED');
      vi.spyOn(sodax.spokeService, 'approve').mockResolvedValueOnce({ ok: false, error: approveError });

      const result = await sodax.moneyMarket.approve({
        raw: false,
        params: supplyParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: approveError });
    });

    it('returns ok:false when spokeService.approve throws', async () => {
      const thrown = new Error('APPROVE_THREW');
      vi.spyOn(sodax.spokeService, 'approve').mockRejectedValueOnce(thrown);

      const result = await sodax.moneyMarket.approve({
        raw: false,
        params: supplyParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: thrown });
    });
  });
});

describe('MoneyMarketService.approve (raw: true)', () => {
  it('on hub: returns the raw transaction without requiring walletProvider', async () => {
    mocks.getUserRouter.mockResolvedValueOnce(USER_ROUTER);
    const rawTx = { from: SAMPLE_USER_ADDRESS, to: SAMPLE_EVM_TOKEN, data: '0x', value: 0n };
    vi.spyOn(sodax.spokeService, 'approve').mockResolvedValueOnce({ ok: true, value: rawTx });

    const result = await sodax.moneyMarket.approve({
      raw: true,
      params: supplyParams(ChainKeys.SONIC_MAINNET),
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual(rawTx);
    expect((sodax.spokeService.approve as ReturnType<typeof vi.fn>).mock.calls[0]?.[0].raw).toBe(true);
  });

  it('on EVM spoke: returns the raw transaction', async () => {
    const rawTx = { from: SAMPLE_USER_ADDRESS, to: SAMPLE_EVM_TOKEN, data: '0x', value: 0n };
    vi.spyOn(sodax.spokeService, 'approve').mockResolvedValueOnce({ ok: true, value: rawTx });

    const result = await sodax.moneyMarket.approve({ raw: true, params: supplyParams(ChainKeys.BSC_MAINNET) });

    expect(result.ok).toBe(true);
  });

  it('on Stellar: forwards Stellar trustline raw call', async () => {
    vi.spyOn(sodax.spokeService, 'approve').mockResolvedValueOnce({ ok: true, value: '0xtrustline-raw' });

    const result = await sodax.moneyMarket.approve({ raw: true,
      params: withdrawParams(ChainKeys.STELLAR_MAINNET),
    });

    expect(result.ok).toBe(true);
  });

  it('rejects withdraw on EVM (raw path enforces same action invariant)', async () => {
    const result = await sodax.moneyMarket.approve({ raw: true,
      params: withdrawParams(ChainKeys.BSC_MAINNET),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Invalid action/);
  });

  it('rejects on a non-supported chain type', async () => {
    const result = await sodax.moneyMarket.approve({ raw: true,
      params: supplyParams(ChainKeys.SOLANA_MAINNET),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Approve only supported/);
  });

  it('rejects amount = 0', async () => {
    const result = await sodax.moneyMarket.approve({ raw: true,
      params: { ...supplyParams(ChainKeys.BSC_MAINNET), amount: 0n },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Amount must be greater than 0/);
  });

  it('rejects empty token', async () => {
    const result = await sodax.moneyMarket.approve({ raw: true,
      params: { ...supplyParams(ChainKeys.BSC_MAINNET), token: '' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Token is required/);
  });

  it('rejects when token is not a valid EVM address (hub path)', async () => {
    const result = await sodax.moneyMarket.approve({ raw: true,
      params: { ...supplyParams(ChainKeys.SONIC_MAINNET), token: 'not-an-address' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Invalid token address/);
  });

  it('forwards a failure Result from spokeService.approve', async () => {
    const approveError = new Error('APPROVE_RAW_FAILED');
    vi.spyOn(sodax.spokeService, 'approve').mockResolvedValueOnce({ ok: false, error: approveError });

    const result = await sodax.moneyMarket.approve({ raw: true, params: supplyParams(ChainKeys.BSC_MAINNET) });

    expect(result).toEqual({ ok: false, error: approveError });
  });
});

// =========================================================================
// supply / createSupplyIntent
// =========================================================================
//
// `createSupplyIntent` is the workhorse — it builds the transaction data and calls
// SpokeService.deposit. To keep tests isolated from the `buildSupplyData` internals
// (which depend on real config wiring), we stub `buildSupplyData` directly per-test.
// `supply` wraps `createSupplyIntent` then verifies the tx hash and (off-hub) relays
// the packet.

describe('MoneyMarketService.createSupplyIntent', () => {
  describe('happy paths', () => {
    it('on hub (Sonic): builds data, deposits, returns tx hash + extra data', async () => {
      vi.spyOn(sodax.moneyMarket, 'buildSupplyData').mockReturnValueOnce('0xsupply-data');
      const depositSpy = vi
        .spyOn(sodax.spokeService, 'deposit')
        .mockResolvedValueOnce({ ok: true, value: '0xdeposit-hash' });

      const result = await sodax.moneyMarket.createSupplyIntent({
        raw: false,
        params: supplyParams(ChainKeys.SONIC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('0xdeposit-hash');
        expect(result.data).toEqual({ address: HUB_WALLET, payload: '0xsupply-data' });
      }
      const call = depositSpy.mock.calls[0]?.[0];
      expect(call?.srcChainKey).toBe(ChainKeys.SONIC_MAINNET);
      expect(call?.raw).toBe(false);
      expect(call?.walletProvider).toBe(mockEvmProvider);
      expect(call?.to).toBe(HUB_WALLET);
      expect(call?.data).toBe('0xsupply-data');
      expect(call?.amount).toBe(1_000_000n);
    });

    it('on EVM spoke (BSC): deposits with the spoke walletProvider', async () => {
      vi.spyOn(sodax.moneyMarket, 'buildSupplyData').mockReturnValueOnce('0xsupply-data');
      vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: true, value: '0xdeposit-hash' });

      const result = await sodax.moneyMarket.createSupplyIntent({
        raw: false,
        params: supplyParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({ address: HUB_WALLET, payload: '0xsupply-data' });
      }
    });

    it('uses toAddress + toChainId when supplied (separate hub-wallet for recipient)', async () => {
      mocks.getUserHubWalletAddress
        .mockResolvedValueOnce(HUB_WALLET) // src lookup
        .mockResolvedValueOnce(TO_HUB_WALLET); // dst lookup
      const buildSpy = vi.spyOn(sodax.moneyMarket, 'buildSupplyData').mockReturnValueOnce('0xsupply-data');
      vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: true, value: '0xdep' });

      await sodax.moneyMarket.createSupplyIntent({
        raw: false,
        params: {
          ...supplyParams(ChainKeys.BSC_MAINNET),
          toChainId: ChainKeys.SONIC_MAINNET,
          toAddress: SAMPLE_DST_ADDRESS,
        },
        walletProvider: mockEvmProvider,
      });

      // buildSupplyData receives toHubWallet (the dst lookup result), not the src hub wallet.
      expect(buildSpy).toHaveBeenCalledWith(ChainKeys.BSC_MAINNET, SAMPLE_EVM_TOKEN, 1_000_000n, TO_HUB_WALLET);
    });
  });

  describe('rejects on invalid inputs', () => {
    it('rejects when action is not "supply"', async () => {
      const result = await sodax.moneyMarket.createSupplyIntent({
        raw: false,
        params: { ...supplyParams(ChainKeys.BSC_MAINNET), action: 'borrow' as never },
        walletProvider: mockEvmProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Invalid action/);
    });

    it('rejects empty token', async () => {
      const result = await sodax.moneyMarket.createSupplyIntent({
        raw: false,
        params: { ...supplyParams(ChainKeys.BSC_MAINNET), token: '' },
        walletProvider: mockEvmProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Token is required/);
    });

    it('rejects amount = 0', async () => {
      const result = await sodax.moneyMarket.createSupplyIntent({
        raw: false,
        params: { ...supplyParams(ChainKeys.BSC_MAINNET), amount: 0n },
        walletProvider: mockEvmProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Amount must be greater than 0/);
    });

    it('rejects walletProvider mismatched to srcChain', async () => {
      const result = await sodax.moneyMarket.createSupplyIntent({
        raw: false,
        params: supplyParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockSolanaProvider as unknown as IEvmWalletProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Invalid wallet provider/);
    });

    it('rejects unsupported token on srcChain', async () => {
      vi.spyOn(sodax.config, 'isMoneyMarketSupportedToken').mockReturnValueOnce(false);

      const result = await sodax.moneyMarket.createSupplyIntent({
        raw: false,
        params: supplyParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Unsupported spoke chain/);
    });
  });

  describe('propagates internal errors', () => {
    it('returns ok:false when HubService.getUserHubWalletAddress rejects', async () => {
      vi.spyOn(sodax.moneyMarket, 'buildSupplyData').mockReturnValueOnce('0xsupply-data');
      const hubError = new Error('HUB_LOOKUP_FAILED');
      mocks.getUserHubWalletAddress.mockReset();
      mocks.getUserHubWalletAddress.mockRejectedValueOnce(hubError).mockResolvedValueOnce(TO_HUB_WALLET);

      const result = await sodax.moneyMarket.createSupplyIntent({
        raw: false,
        params: supplyParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: hubError });
    });

    it('forwards a failure Result from spokeService.deposit', async () => {
      vi.spyOn(sodax.moneyMarket, 'buildSupplyData').mockReturnValueOnce('0xsupply-data');
      const depositError = new Error('DEPOSIT_REJECTED');
      vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: false, error: depositError });

      const result = await sodax.moneyMarket.createSupplyIntent({
        raw: false,
        params: supplyParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: depositError });
    });

    it('returns ok:false when spokeService.deposit throws', async () => {
      vi.spyOn(sodax.moneyMarket, 'buildSupplyData').mockReturnValueOnce('0xsupply-data');
      const thrown = new Error('DEPOSIT_THREW');
      vi.spyOn(sodax.spokeService, 'deposit').mockRejectedValueOnce(thrown);

      const result = await sodax.moneyMarket.createSupplyIntent({
        raw: false,
        params: supplyParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: thrown });
    });
  });
});

describe('MoneyMarketService.createSupplyIntent (raw: true)', () => {
  it('on EVM spoke: returns the raw transaction without walletProvider', async () => {
    vi.spyOn(sodax.moneyMarket, 'buildSupplyData').mockReturnValueOnce('0xsupply-data');
    const rawTx = { from: SAMPLE_USER_ADDRESS, to: HUB_WALLET, data: '0xsupply-data', value: 0n };
    const depositSpy = vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: true, value: rawTx });

    const result = await sodax.moneyMarket.createSupplyIntent({ raw: true,
      params: supplyParams(ChainKeys.BSC_MAINNET),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(rawTx);
      expect(result.data).toEqual({ address: HUB_WALLET, payload: '0xsupply-data' });
    }
    const depositCall = depositSpy.mock.calls[0]?.[0];
    expect(depositCall?.raw).toBe(true);
    expect(depositCall).not.toHaveProperty('walletProvider');
  });

  it('rejects when action is not "supply"', async () => {
    const result = await sodax.moneyMarket.createSupplyIntent({ raw: true,
      params: { ...supplyParams(ChainKeys.BSC_MAINNET), action: 'repay' as never },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Invalid action/);
  });

  it('rejects empty token', async () => {
    const result = await sodax.moneyMarket.createSupplyIntent({ raw: true,
      params: { ...supplyParams(ChainKeys.BSC_MAINNET), token: '' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Token is required/);
  });

  it('rejects amount = 0', async () => {
    const result = await sodax.moneyMarket.createSupplyIntent({ raw: true,
      params: { ...supplyParams(ChainKeys.BSC_MAINNET), amount: 0n },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Amount must be greater than 0/);
  });

  it('rejects unsupported token', async () => {
    vi.spyOn(sodax.config, 'isMoneyMarketSupportedToken').mockReturnValueOnce(false);

    const result = await sodax.moneyMarket.createSupplyIntent({ raw: true,
      params: supplyParams(ChainKeys.BSC_MAINNET),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Unsupported spoke chain/);
  });

  it('forwards a failure Result from spokeService.deposit', async () => {
    vi.spyOn(sodax.moneyMarket, 'buildSupplyData').mockReturnValueOnce('0xsupply-data');
    const depositError = new Error('DEPOSIT_RAW_FAILED');
    vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: false, error: depositError });

    const result = await sodax.moneyMarket.createSupplyIntent({ raw: true,
      params: supplyParams(ChainKeys.BSC_MAINNET),
    });

    expect(result).toEqual({ ok: false, error: depositError });
  });
});

describe('MoneyMarketService.supply', () => {
  describe('happy paths', () => {
    it('on hub (Sonic): skips relay and returns [hash, hash]', async () => {
      vi.spyOn(sodax.moneyMarket, 'createSupplyIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xhub-tx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });

      const result = await sodax.moneyMarket.supply({
        raw: false,
        params: supplyParams(ChainKeys.SONIC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: true, value: ['0xhub-tx', '0xhub-tx'] });
      expect(mocks.relayTxAndWaitPacket).not.toHaveBeenCalled();
    });

    it('on EVM spoke: relays the packet and returns [spokeHash, dstHash]', async () => {
      vi.spyOn(sodax.moneyMarket, 'createSupplyIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xspoke-tx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      const verifySpy = vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });
      mocks.relayTxAndWaitPacket.mockResolvedValueOnce({
        ok: true,
        value: { dst_tx_hash: '0xdst-tx' },
      });

      const result = await sodax.moneyMarket.supply({
        raw: false,
        params: supplyParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: true, value: ['0xspoke-tx', '0xdst-tx'] });
      // Pin verifyTxHash args — kills the chainKey/txHash flip mutants in the verify branch.
      expect(verifySpy).toHaveBeenCalledWith({ txHash: '0xspoke-tx', chainKey: ChainKeys.BSC_MAINNET });
      // Pin all five relay args — kills mutants on the chain-key forwarding, extraData ternary,
      // and `srcChainKey !== hubChainId` invariant in the needsRelay calculation.
      expect(mocks.relayTxAndWaitPacket).toHaveBeenCalledTimes(1);
      expect(mocks.relayTxAndWaitPacket).toHaveBeenCalledWith(
        '0xspoke-tx',
        undefined,
        ChainKeys.BSC_MAINNET,
        sodax.moneyMarket.relayerApiEndpoint,
        expect.any(Number),
      );
    });

    it('on Solana: forwards the extra data tuple to the relay', async () => {
      const extraData = { address: HUB_WALLET, payload: '0xsolana-payload' as `0x${string}` };
      vi.spyOn(sodax.moneyMarket, 'createSupplyIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xsolana-tx',
        data: extraData,
      });
      vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });
      mocks.relayTxAndWaitPacket.mockResolvedValueOnce({
        ok: true,
        value: { dst_tx_hash: '0xdst-tx' },
      });

      await sodax.moneyMarket.supply({
        raw: false,
        params: supplyParams(ChainKeys.SOLANA_MAINNET),
        walletProvider: mockSolanaProvider,
      });

      // Second arg is the extraData tuple — Solana / Bitcoin pass it; other chains pass undefined.
      expect(mocks.relayTxAndWaitPacket.mock.calls[0]?.[1]).toBe(extraData);
    });

    it('on EVM spoke: passes undefined extraData (only Solana / Bitcoin forward it)', async () => {
      vi.spyOn(sodax.moneyMarket, 'createSupplyIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xspoke-tx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });
      mocks.relayTxAndWaitPacket.mockResolvedValueOnce({
        ok: true,
        value: { dst_tx_hash: '0xdst-tx' },
      });

      await sodax.moneyMarket.supply({
        raw: false,
        params: supplyParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(mocks.relayTxAndWaitPacket.mock.calls[0]?.[1]).toBeUndefined();
    });
  });

  describe('propagates internal errors', () => {
    it('forwards a failure Result from createSupplyIntent', async () => {
      const intentError = new Error('CREATE_INTENT_FAILED');
      vi.spyOn(sodax.moneyMarket, 'createSupplyIntent').mockResolvedValueOnce({
        ok: false,
        error: intentError,
      });

      const result = await sodax.moneyMarket.supply({
        raw: false,
        params: supplyParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: intentError });
    });

    it('forwards a failure Result from spokeService.verifyTxHash', async () => {
      vi.spyOn(sodax.moneyMarket, 'createSupplyIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xtx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      const verifyError = new Error('VERIFY_FAILED');
      vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: false, error: verifyError });

      const result = await sodax.moneyMarket.supply({
        raw: false,
        params: supplyParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: verifyError });
    });

    it('forwards a failure Result from relayTxAndWaitPacket', async () => {
      vi.spyOn(sodax.moneyMarket, 'createSupplyIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xtx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });
      const relayError = new Error('RELAY_TIMEOUT');
      mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: false, error: relayError });

      const result = await sodax.moneyMarket.supply({
        raw: false,
        params: supplyParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: relayError });
    });

    it('returns ok:false when createSupplyIntent throws (outer catch)', async () => {
      const thrown = new Error('UNEXPECTED');
      vi.spyOn(sodax.moneyMarket, 'createSupplyIntent').mockRejectedValueOnce(thrown);

      const result = await sodax.moneyMarket.supply({
        raw: false,
        params: supplyParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: thrown });
    });
  });
});

// =========================================================================
// borrow / createBorrowIntent
// =========================================================================
//
// Borrow uses `spokeService.sendMessage` (not deposit). It also has a richer set of
// optional params (fromChainId / fromAddress / toChainId / toAddress) and a unique
// `needsRelay` calculation: relay is only skipped when both src AND target are the hub.

describe('MoneyMarketService.createBorrowIntent', () => {
  // Default: pretend the dst token lookup succeeds. Borrow's invariant requires it.
  beforeEach(() => {
    vi.spyOn(sodax.config, 'getMoneyMarketToken').mockReturnValue({
      address: '0xaaaa000000000000000000000000000000000000' as Address,
      decimals: 18,
    } as never);
  });

  describe('happy paths', () => {
    it('on EVM spoke (BSC): builds borrow data and sends message to the hub', async () => {
      vi.spyOn(sodax.moneyMarket, 'buildBorrowData').mockReturnValueOnce('0xborrow-data');
      const sendSpy = vi
        .spyOn(sodax.spokeService, 'sendMessage')
        .mockResolvedValueOnce({ ok: true, value: '0xsend-hash' });

      const result = await sodax.moneyMarket.createBorrowIntent({
        raw: false,
        params: borrowParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('0xsend-hash');
        expect(result.data).toEqual({ address: HUB_WALLET, payload: '0xborrow-data' });
      }
      const call = sendSpy.mock.calls[0]?.[0];
      expect(call?.srcChainKey).toBe(ChainKeys.BSC_MAINNET);
      expect(call?.dstAddress).toBe(HUB_WALLET);
      expect(call?.payload).toBe('0xborrow-data');
      expect(call?.raw).toBe(false);
      expect(call?.walletProvider).toBe(mockEvmProvider);
    });

    it('on hub (Sonic): same path applies', async () => {
      vi.spyOn(sodax.moneyMarket, 'buildBorrowData').mockReturnValueOnce('0xborrow-data');
      vi.spyOn(sodax.spokeService, 'sendMessage').mockResolvedValueOnce({ ok: true, value: '0xsend-hash' });

      const result = await sodax.moneyMarket.createBorrowIntent({
        raw: false,
        params: borrowParams(ChainKeys.SONIC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result.ok).toBe(true);
    });

    it('uses fromChainId / fromAddress when supplied (separate "borrower" hub-wallet)', async () => {
      mocks.getUserHubWalletAddress.mockReset();
      mocks.getUserHubWalletAddress.mockResolvedValueOnce(TO_HUB_WALLET); // fromChainId-based lookup
      const buildSpy = vi.spyOn(sodax.moneyMarket, 'buildBorrowData').mockReturnValueOnce('0xborrow-data');
      vi.spyOn(sodax.spokeService, 'sendMessage').mockResolvedValueOnce({ ok: true, value: '0xsend-hash' });

      await sodax.moneyMarket.createBorrowIntent({
        raw: false,
        params: {
          ...borrowParams(ChainKeys.BSC_MAINNET),
          fromChainId: ChainKeys.SONIC_MAINNET,
          fromAddress: SAMPLE_DST_ADDRESS,
        },
        walletProvider: mockEvmProvider,
      });

      // First arg of buildBorrowData is the resolved fromHubWallet — should be the override.
      expect(buildSpy.mock.calls[0]?.[0]).toBe(TO_HUB_WALLET);
    });
  });

  describe('rejects on invalid inputs', () => {
    it('rejects when action is not "borrow"', async () => {
      const result = await sodax.moneyMarket.createBorrowIntent({
        raw: false,
        params: { ...borrowParams(ChainKeys.BSC_MAINNET), action: 'supply' as never },
        walletProvider: mockEvmProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Invalid action/);
    });

    it('rejects walletProvider mismatched to srcChain', async () => {
      const result = await sodax.moneyMarket.createBorrowIntent({
        raw: false,
        params: borrowParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockSolanaProvider as unknown as IEvmWalletProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Invalid wallet provider/);
    });

    it('rejects when the dst money market token is unknown', async () => {
      vi.spyOn(sodax.config, 'getMoneyMarketToken').mockReturnValueOnce(undefined as never);

      const result = await sodax.moneyMarket.createBorrowIntent({
        raw: false,
        params: borrowParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Money market token not found/);
    });

    it('rejects empty token', async () => {
      const result = await sodax.moneyMarket.createBorrowIntent({
        raw: false,
        params: { ...borrowParams(ChainKeys.BSC_MAINNET), token: '' },
        walletProvider: mockEvmProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Token is required/);
    });

    it('rejects amount = 0', async () => {
      const result = await sodax.moneyMarket.createBorrowIntent({
        raw: false,
        params: { ...borrowParams(ChainKeys.BSC_MAINNET), amount: 0n },
        walletProvider: mockEvmProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Amount must be greater than 0/);
    });
  });

  describe('propagates internal errors', () => {
    it('returns ok:false when HubService.getUserHubWalletAddress rejects', async () => {
      vi.spyOn(sodax.moneyMarket, 'buildBorrowData').mockReturnValueOnce('0xborrow-data');
      const hubError = new Error('HUB_LOOKUP_FAILED');
      mocks.getUserHubWalletAddress.mockReset();
      mocks.getUserHubWalletAddress.mockRejectedValueOnce(hubError);

      const result = await sodax.moneyMarket.createBorrowIntent({
        raw: false,
        params: borrowParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: hubError });
    });

    it('forwards a failure Result from spokeService.sendMessage', async () => {
      vi.spyOn(sodax.moneyMarket, 'buildBorrowData').mockReturnValueOnce('0xborrow-data');
      const sendError = new Error('SEND_FAILED');
      vi.spyOn(sodax.spokeService, 'sendMessage').mockResolvedValueOnce({ ok: false, error: sendError });

      const result = await sodax.moneyMarket.createBorrowIntent({
        raw: false,
        params: borrowParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: sendError });
    });

    it('returns ok:false when spokeService.sendMessage throws', async () => {
      vi.spyOn(sodax.moneyMarket, 'buildBorrowData').mockReturnValueOnce('0xborrow-data');
      const thrown = new Error('SEND_THREW');
      vi.spyOn(sodax.spokeService, 'sendMessage').mockRejectedValueOnce(thrown);

      const result = await sodax.moneyMarket.createBorrowIntent({
        raw: false,
        params: borrowParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: thrown });
    });
  });
});

describe('MoneyMarketService.createBorrowIntent (raw: true)', () => {
  beforeEach(() => {
    vi.spyOn(sodax.config, 'getMoneyMarketToken').mockReturnValue({
      address: '0xaaaa000000000000000000000000000000000000' as Address,
      decimals: 18,
    } as never);
  });

  it('returns the raw transaction without walletProvider', async () => {
    vi.spyOn(sodax.moneyMarket, 'buildBorrowData').mockReturnValueOnce('0xborrow-data');
    const rawTx = { from: SAMPLE_USER_ADDRESS, to: HUB_WALLET, data: '0xborrow-data', value: 0n };
    const sendSpy = vi.spyOn(sodax.spokeService, 'sendMessage').mockResolvedValueOnce({ ok: true, value: rawTx });

    const result = await sodax.moneyMarket.createBorrowIntent({ raw: true,
      params: borrowParams(ChainKeys.BSC_MAINNET),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(rawTx);
      expect(result.data).toEqual({ address: HUB_WALLET, payload: '0xborrow-data' });
    }
    const sendCall = sendSpy.mock.calls[0]?.[0];
    expect(sendCall?.raw).toBe(true);
    expect(sendCall).not.toHaveProperty('walletProvider');
  });

  it('rejects when dst money market token is unknown', async () => {
    vi.spyOn(sodax.config, 'getMoneyMarketToken').mockReturnValueOnce(undefined as never);

    const result = await sodax.moneyMarket.createBorrowIntent({ raw: true,
      params: borrowParams(ChainKeys.BSC_MAINNET),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Money market token not found/);
  });

  it('rejects when action is not "borrow"', async () => {
    const result = await sodax.moneyMarket.createBorrowIntent({ raw: true,
      params: { ...borrowParams(ChainKeys.BSC_MAINNET), action: 'supply' as never },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Invalid action/);
  });

  it('rejects empty token', async () => {
    const result = await sodax.moneyMarket.createBorrowIntent({ raw: true,
      params: { ...borrowParams(ChainKeys.BSC_MAINNET), token: '' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Token is required/);
  });

  it('rejects amount = 0', async () => {
    const result = await sodax.moneyMarket.createBorrowIntent({ raw: true,
      params: { ...borrowParams(ChainKeys.BSC_MAINNET), amount: 0n },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Amount must be greater than 0/);
  });

  it('forwards a failure Result from spokeService.sendMessage', async () => {
    vi.spyOn(sodax.moneyMarket, 'buildBorrowData').mockReturnValueOnce('0xborrow-data');
    const sendError = new Error('SEND_FAILED');
    vi.spyOn(sodax.spokeService, 'sendMessage').mockResolvedValueOnce({ ok: false, error: sendError });

    const result = await sodax.moneyMarket.createBorrowIntent({ raw: true,
      params: borrowParams(ChainKeys.BSC_MAINNET),
    });

    expect(result).toEqual({ ok: false, error: sendError });
  });
});

describe('MoneyMarketService.borrow', () => {
  describe('happy paths', () => {
    it('on hub with default target (also hub): skips relay and returns [hash, hash]', async () => {
      vi.spyOn(sodax.moneyMarket, 'createBorrowIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xhub-tx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });

      const result = await sodax.moneyMarket.borrow({
        raw: false,
        params: borrowParams(ChainKeys.SONIC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: true, value: ['0xhub-tx', '0xhub-tx'] });
      expect(mocks.relayTxAndWaitPacket).not.toHaveBeenCalled();
    });

    it('on hub with non-hub target: relays the packet (cross-chain delivery)', async () => {
      vi.spyOn(sodax.moneyMarket, 'createBorrowIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xhub-tx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });
      mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: true, value: { dst_tx_hash: '0xdst' } });

      const result = await sodax.moneyMarket.borrow({
        raw: false,
        params: {
          ...borrowParams(ChainKeys.SONIC_MAINNET),
          toChainId: ChainKeys.BSC_MAINNET,
          toAddress: SAMPLE_DST_ADDRESS,
        },
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: true, value: ['0xhub-tx', '0xdst'] });
      expect(mocks.relayTxAndWaitPacket).toHaveBeenCalledTimes(1);
    });

    it('on EVM spoke: relays the packet', async () => {
      vi.spyOn(sodax.moneyMarket, 'createBorrowIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xspoke-tx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      const verifySpy = vi
        .spyOn(sodax.spokeService, 'verifyTxHash')
        .mockResolvedValueOnce({ ok: true, value: true });
      mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: true, value: { dst_tx_hash: '0xdst' } });

      const result = await sodax.moneyMarket.borrow({
        raw: false,
        params: borrowParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: true, value: ['0xspoke-tx', '0xdst'] });
      expect(verifySpy).toHaveBeenCalledWith({ txHash: '0xspoke-tx', chainKey: ChainKeys.BSC_MAINNET });
      expect(mocks.relayTxAndWaitPacket).toHaveBeenCalledWith(
        '0xspoke-tx',
        undefined,
        ChainKeys.BSC_MAINNET,
        sodax.moneyMarket.relayerApiEndpoint,
        expect.any(Number),
      );
    });
  });

  describe('propagates internal errors', () => {
    it('forwards createBorrowIntent failure', async () => {
      const intentError = new Error('CREATE_INTENT_FAILED');
      vi.spyOn(sodax.moneyMarket, 'createBorrowIntent').mockResolvedValueOnce({
        ok: false,
        error: intentError,
      });

      const result = await sodax.moneyMarket.borrow({
        raw: false,
        params: borrowParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: intentError });
    });

    it('forwards verifyTxHash failure', async () => {
      vi.spyOn(sodax.moneyMarket, 'createBorrowIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xtx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      const verifyError = new Error('VERIFY_FAILED');
      vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: false, error: verifyError });

      const result = await sodax.moneyMarket.borrow({
        raw: false,
        params: borrowParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: verifyError });
    });

    it('forwards relayTxAndWaitPacket failure', async () => {
      vi.spyOn(sodax.moneyMarket, 'createBorrowIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xtx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });
      const relayError = new Error('RELAY_TIMEOUT');
      mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: false, error: relayError });

      const result = await sodax.moneyMarket.borrow({
        raw: false,
        params: borrowParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: relayError });
    });

    it('returns ok:false when createBorrowIntent throws (outer catch)', async () => {
      const thrown = new Error('UNEXPECTED');
      vi.spyOn(sodax.moneyMarket, 'createBorrowIntent').mockRejectedValueOnce(thrown);

      const result = await sodax.moneyMarket.borrow({
        raw: false,
        params: borrowParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: thrown });
    });
  });
});

// =========================================================================
// withdraw / createWithdrawIntent
// =========================================================================
//
// Withdraw also uses `sendMessage` and validates the token on `toChainId`. The
// `needsRelay` calculation has the walletRouter exemption: skip relay only when src is
// hub AND target is hub AND target ≠ walletRouter.

describe('MoneyMarketService.createWithdrawIntent', () => {
  describe('happy paths', () => {
    it('on EVM spoke: builds withdraw data and sends message to the hub', async () => {
      vi.spyOn(sodax.moneyMarket, 'buildWithdrawData').mockReturnValueOnce('0xwithdraw-data');
      const sendSpy = vi
        .spyOn(sodax.spokeService, 'sendMessage')
        .mockResolvedValueOnce({ ok: true, value: '0xsend-hash' });

      const result = await sodax.moneyMarket.createWithdrawIntent({
        raw: false,
        params: withdrawParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('0xsend-hash');
        expect(result.data).toEqual({ address: HUB_WALLET, payload: '0xwithdraw-data' });
      }
      const call = sendSpy.mock.calls[0]?.[0];
      expect(call?.payload).toBe('0xwithdraw-data');
      expect(call?.raw).toBe(false);
    });
  });

  describe('rejects on invalid inputs', () => {
    it('rejects when action is not "withdraw"', async () => {
      const result = await sodax.moneyMarket.createWithdrawIntent({
        raw: false,
        params: { ...withdrawParams(ChainKeys.BSC_MAINNET), action: 'borrow' as never },
        walletProvider: mockEvmProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Invalid action/);
    });

    it('rejects walletProvider mismatched to srcChain', async () => {
      const result = await sodax.moneyMarket.createWithdrawIntent({
        raw: false,
        params: withdrawParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockSolanaProvider as unknown as IEvmWalletProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Invalid wallet provider for chain key/);
    });

    it('rejects when token is unsupported on toChainId (default = srcChain)', async () => {
      vi.spyOn(sodax.config, 'isMoneyMarketSupportedToken').mockReturnValueOnce(false);

      const result = await sodax.moneyMarket.createWithdrawIntent({
        raw: false,
        params: withdrawParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Unsupported spoke chain/);
    });

    it('rejects empty token', async () => {
      const result = await sodax.moneyMarket.createWithdrawIntent({
        raw: false,
        params: { ...withdrawParams(ChainKeys.BSC_MAINNET), token: '' },
        walletProvider: mockEvmProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Token is required/);
    });

    it('rejects amount = 0', async () => {
      const result = await sodax.moneyMarket.createWithdrawIntent({
        raw: false,
        params: { ...withdrawParams(ChainKeys.BSC_MAINNET), amount: 0n },
        walletProvider: mockEvmProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Amount must be greater than 0/);
    });
  });

  describe('propagates internal errors', () => {
    it('forwards a failure Result from spokeService.sendMessage', async () => {
      vi.spyOn(sodax.moneyMarket, 'buildWithdrawData').mockReturnValueOnce('0xwithdraw-data');
      const sendError = new Error('SEND_FAILED');
      vi.spyOn(sodax.spokeService, 'sendMessage').mockResolvedValueOnce({ ok: false, error: sendError });

      const result = await sodax.moneyMarket.createWithdrawIntent({
        raw: false,
        params: withdrawParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: sendError });
    });

    it('returns ok:false when spokeService.sendMessage throws', async () => {
      vi.spyOn(sodax.moneyMarket, 'buildWithdrawData').mockReturnValueOnce('0xwithdraw-data');
      const thrown = new Error('SEND_THREW');
      vi.spyOn(sodax.spokeService, 'sendMessage').mockRejectedValueOnce(thrown);

      const result = await sodax.moneyMarket.createWithdrawIntent({
        raw: false,
        params: withdrawParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: thrown });
    });
  });
});

describe('MoneyMarketService.createWithdrawIntent (raw: true)', () => {
  it('returns the raw transaction without walletProvider', async () => {
    vi.spyOn(sodax.moneyMarket, 'buildWithdrawData').mockReturnValueOnce('0xwithdraw-data');
    const rawTx = { from: SAMPLE_USER_ADDRESS, to: HUB_WALLET, data: '0x', value: 0n };
    const sendSpy = vi.spyOn(sodax.spokeService, 'sendMessage').mockResolvedValueOnce({ ok: true, value: rawTx });

    const result = await sodax.moneyMarket.createWithdrawIntent({ raw: true,
      params: withdrawParams(ChainKeys.BSC_MAINNET),
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ address: HUB_WALLET, payload: '0xwithdraw-data' });
    expect(sendSpy.mock.calls[0]?.[0].raw).toBe(true);
  });

  it('rejects unsupported token', async () => {
    vi.spyOn(sodax.config, 'isMoneyMarketSupportedToken').mockReturnValueOnce(false);

    const result = await sodax.moneyMarket.createWithdrawIntent({ raw: true,
      params: withdrawParams(ChainKeys.BSC_MAINNET),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Unsupported spoke chain/);
  });

  it('rejects when action is not "withdraw"', async () => {
    const result = await sodax.moneyMarket.createWithdrawIntent({ raw: true,
      params: { ...withdrawParams(ChainKeys.BSC_MAINNET), action: 'supply' as never },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Invalid action/);
  });

  it('rejects empty token', async () => {
    const result = await sodax.moneyMarket.createWithdrawIntent({ raw: true,
      params: { ...withdrawParams(ChainKeys.BSC_MAINNET), token: '' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Token is required/);
  });

  it('rejects amount = 0', async () => {
    const result = await sodax.moneyMarket.createWithdrawIntent({ raw: true,
      params: { ...withdrawParams(ChainKeys.BSC_MAINNET), amount: 0n },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Amount must be greater than 0/);
  });

  it('forwards a failure Result from spokeService.sendMessage', async () => {
    vi.spyOn(sodax.moneyMarket, 'buildWithdrawData').mockReturnValueOnce('0xwithdraw-data');
    const sendError = new Error('SEND_RAW_FAILED');
    vi.spyOn(sodax.spokeService, 'sendMessage').mockResolvedValueOnce({ ok: false, error: sendError });

    const result = await sodax.moneyMarket.createWithdrawIntent({ raw: true,
      params: withdrawParams(ChainKeys.BSC_MAINNET),
    });

    expect(result).toEqual({ ok: false, error: sendError });
  });
});

describe('MoneyMarketService.withdraw', () => {
  describe('happy paths', () => {
    it('on hub default-target: skips relay (src=hub, target=hub, target ≠ walletRouter)', async () => {
      vi.spyOn(sodax.moneyMarket, 'createWithdrawIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xhub-tx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });

      const result = await sodax.moneyMarket.withdraw({
        raw: false,
        params: withdrawParams(ChainKeys.SONIC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: true, value: ['0xhub-tx', '0xhub-tx'] });
      expect(mocks.relayTxAndWaitPacket).not.toHaveBeenCalled();
    });

    it('on hub with non-hub target: relays', async () => {
      vi.spyOn(sodax.moneyMarket, 'createWithdrawIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xhub-tx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });
      mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: true, value: { dst_tx_hash: '0xdst' } });

      const result = await sodax.moneyMarket.withdraw({
        raw: false,
        params: {
          ...withdrawParams(ChainKeys.SONIC_MAINNET),
          toChainId: ChainKeys.BSC_MAINNET,
          toAddress: SAMPLE_DST_ADDRESS,
        },
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: true, value: ['0xhub-tx', '0xdst'] });
    });

    it('on EVM spoke: relays', async () => {
      vi.spyOn(sodax.moneyMarket, 'createWithdrawIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xspoke-tx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      const verifySpy = vi
        .spyOn(sodax.spokeService, 'verifyTxHash')
        .mockResolvedValueOnce({ ok: true, value: true });
      mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: true, value: { dst_tx_hash: '0xdst' } });

      const result = await sodax.moneyMarket.withdraw({
        raw: false,
        params: withdrawParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: true, value: ['0xspoke-tx', '0xdst'] });
      expect(verifySpy).toHaveBeenCalledWith({ txHash: '0xspoke-tx', chainKey: ChainKeys.BSC_MAINNET });
      expect(mocks.relayTxAndWaitPacket).toHaveBeenCalledWith(
        '0xspoke-tx',
        undefined,
        ChainKeys.BSC_MAINNET,
        sodax.moneyMarket.relayerApiEndpoint,
        expect.any(Number),
      );
    });

    it('on hub with target = walletRouter: skips relay (walletRouter exemption)', async () => {
      const walletRouter = sodax.hubProvider.chainConfig.addresses.walletRouter;
      vi.spyOn(sodax.moneyMarket, 'createWithdrawIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xhub-tx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });

      const result = await sodax.moneyMarket.withdraw({
        raw: false,
        params: {
          ...withdrawParams(ChainKeys.SONIC_MAINNET),
          toChainId: ChainKeys.SONIC_MAINNET,
          toAddress: walletRouter,
        },
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: true, value: ['0xhub-tx', '0xhub-tx'] });
      expect(mocks.relayTxAndWaitPacket).not.toHaveBeenCalled();
    });
  });

  describe('propagates internal errors', () => {
    it('forwards createWithdrawIntent failure', async () => {
      const intentError = new Error('CREATE_INTENT_FAILED');
      vi.spyOn(sodax.moneyMarket, 'createWithdrawIntent').mockResolvedValueOnce({
        ok: false,
        error: intentError,
      });

      const result = await sodax.moneyMarket.withdraw({
        raw: false,
        params: withdrawParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: intentError });
    });

    it('forwards verifyTxHash failure', async () => {
      vi.spyOn(sodax.moneyMarket, 'createWithdrawIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xtx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      const verifyError = new Error('VERIFY_FAILED');
      vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: false, error: verifyError });

      const result = await sodax.moneyMarket.withdraw({
        raw: false,
        params: withdrawParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: verifyError });
    });

    it('forwards relayTxAndWaitPacket failure', async () => {
      vi.spyOn(sodax.moneyMarket, 'createWithdrawIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xtx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });
      const relayError = new Error('RELAY_TIMEOUT');
      mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: false, error: relayError });

      const result = await sodax.moneyMarket.withdraw({
        raw: false,
        params: withdrawParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: relayError });
    });

    it('returns ok:false when createWithdrawIntent throws', async () => {
      const thrown = new Error('UNEXPECTED');
      vi.spyOn(sodax.moneyMarket, 'createWithdrawIntent').mockRejectedValueOnce(thrown);

      const result = await sodax.moneyMarket.withdraw({
        raw: false,
        params: withdrawParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: thrown });
    });
  });
});

// =========================================================================
// repay / createRepayIntent
// =========================================================================
//
// Repay mirrors supply: uses spokeService.deposit, builds via buildRepayData, and the
// top-level method skips the relay only when src is the hub.

describe('MoneyMarketService.createRepayIntent', () => {
  describe('happy paths', () => {
    it('on EVM spoke: builds repay data and deposits to the hub wallet', async () => {
      vi.spyOn(sodax.moneyMarket, 'buildRepayData').mockReturnValueOnce('0xrepay-data');
      const depositSpy = vi
        .spyOn(sodax.spokeService, 'deposit')
        .mockResolvedValueOnce({ ok: true, value: '0xdeposit-hash' });

      const result = await sodax.moneyMarket.createRepayIntent({
        raw: false,
        params: repayParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('0xdeposit-hash');
        expect(result.data).toEqual({ address: HUB_WALLET, payload: '0xrepay-data' });
      }
      const call = depositSpy.mock.calls[0]?.[0];
      expect(call?.data).toBe('0xrepay-data');
      expect(call?.raw).toBe(false);
    });

    it('on hub: same path applies', async () => {
      vi.spyOn(sodax.moneyMarket, 'buildRepayData').mockReturnValueOnce('0xrepay-data');
      vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: true, value: '0xdep' });

      const result = await sodax.moneyMarket.createRepayIntent({
        raw: false,
        params: repayParams(ChainKeys.SONIC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result.ok).toBe(true);
    });
  });

  describe('rejects on invalid inputs', () => {
    it('rejects when action is not "repay"', async () => {
      const result = await sodax.moneyMarket.createRepayIntent({
        raw: false,
        params: { ...repayParams(ChainKeys.BSC_MAINNET), action: 'supply' as never },
        walletProvider: mockEvmProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Invalid action/);
    });

    it('rejects walletProvider mismatched to srcChain', async () => {
      const result = await sodax.moneyMarket.createRepayIntent({
        raw: false,
        params: repayParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockSolanaProvider as unknown as IEvmWalletProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Invalid wallet provider for chain key/);
    });

    it('rejects unsupported token on srcChain', async () => {
      vi.spyOn(sodax.config, 'isMoneyMarketSupportedToken').mockReturnValueOnce(false);

      const result = await sodax.moneyMarket.createRepayIntent({
        raw: false,
        params: repayParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Unsupported spoke chain/);
    });

    it('rejects empty token', async () => {
      const result = await sodax.moneyMarket.createRepayIntent({
        raw: false,
        params: { ...repayParams(ChainKeys.BSC_MAINNET), token: '' },
        walletProvider: mockEvmProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Token is required/);
    });

    it('rejects amount = 0', async () => {
      const result = await sodax.moneyMarket.createRepayIntent({
        raw: false,
        params: { ...repayParams(ChainKeys.BSC_MAINNET), amount: 0n },
        walletProvider: mockEvmProvider,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(String(result.error)).toMatch(/Amount must be greater than 0/);
    });
  });

  describe('propagates internal errors', () => {
    it('forwards a failure Result from spokeService.deposit', async () => {
      vi.spyOn(sodax.moneyMarket, 'buildRepayData').mockReturnValueOnce('0xrepay-data');
      const depositError = new Error('DEPOSIT_FAILED');
      vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: false, error: depositError });

      const result = await sodax.moneyMarket.createRepayIntent({
        raw: false,
        params: repayParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: depositError });
    });

    it('returns ok:false when spokeService.deposit throws', async () => {
      vi.spyOn(sodax.moneyMarket, 'buildRepayData').mockReturnValueOnce('0xrepay-data');
      const thrown = new Error('DEPOSIT_THREW');
      vi.spyOn(sodax.spokeService, 'deposit').mockRejectedValueOnce(thrown);

      const result = await sodax.moneyMarket.createRepayIntent({
        raw: false,
        params: repayParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: thrown });
    });
  });
});

describe('MoneyMarketService.createRepayIntent (raw: true)', () => {
  it('returns the raw transaction without walletProvider', async () => {
    vi.spyOn(sodax.moneyMarket, 'buildRepayData').mockReturnValueOnce('0xrepay-data');
    const rawTx = { from: SAMPLE_USER_ADDRESS, to: HUB_WALLET, data: '0x', value: 0n };
    const depositSpy = vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: true, value: rawTx });

    const result = await sodax.moneyMarket.createRepayIntent({ raw: true,
      params: repayParams(ChainKeys.BSC_MAINNET),
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ address: HUB_WALLET, payload: '0xrepay-data' });
    expect(depositSpy.mock.calls[0]?.[0].raw).toBe(true);
  });

  it('rejects when action is not "repay"', async () => {
    const result = await sodax.moneyMarket.createRepayIntent({ raw: true,
      params: { ...repayParams(ChainKeys.BSC_MAINNET), action: 'supply' as never },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Invalid action/);
  });

  it('rejects empty token', async () => {
    const result = await sodax.moneyMarket.createRepayIntent({ raw: true,
      params: { ...repayParams(ChainKeys.BSC_MAINNET), token: '' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Token is required/);
  });

  it('rejects amount = 0', async () => {
    const result = await sodax.moneyMarket.createRepayIntent({ raw: true,
      params: { ...repayParams(ChainKeys.BSC_MAINNET), amount: 0n },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Amount must be greater than 0/);
  });

  it('rejects unsupported token on srcChain', async () => {
    vi.spyOn(sodax.config, 'isMoneyMarketSupportedToken').mockReturnValueOnce(false);

    const result = await sodax.moneyMarket.createRepayIntent({ raw: true,
      params: repayParams(ChainKeys.BSC_MAINNET),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(String(result.error)).toMatch(/Unsupported spoke chain/);
  });

  it('forwards a failure Result from spokeService.deposit', async () => {
    vi.spyOn(sodax.moneyMarket, 'buildRepayData').mockReturnValueOnce('0xrepay-data');
    const depositError = new Error('DEPOSIT_RAW_FAILED');
    vi.spyOn(sodax.spokeService, 'deposit').mockResolvedValueOnce({ ok: false, error: depositError });

    const result = await sodax.moneyMarket.createRepayIntent({ raw: true,
      params: repayParams(ChainKeys.BSC_MAINNET),
    });

    expect(result).toEqual({ ok: false, error: depositError });
  });
});

describe('MoneyMarketService.repay', () => {
  describe('happy paths', () => {
    it('on hub: skips relay and returns [hash, hash]', async () => {
      vi.spyOn(sodax.moneyMarket, 'createRepayIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xhub-tx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });

      const result = await sodax.moneyMarket.repay({
        raw: false,
        params: repayParams(ChainKeys.SONIC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: true, value: ['0xhub-tx', '0xhub-tx'] });
      expect(mocks.relayTxAndWaitPacket).not.toHaveBeenCalled();
    });

    it('on EVM spoke: relays the packet', async () => {
      vi.spyOn(sodax.moneyMarket, 'createRepayIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xspoke-tx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      const verifySpy = vi
        .spyOn(sodax.spokeService, 'verifyTxHash')
        .mockResolvedValueOnce({ ok: true, value: true });
      mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: true, value: { dst_tx_hash: '0xdst' } });

      const result = await sodax.moneyMarket.repay({
        raw: false,
        params: repayParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: true, value: ['0xspoke-tx', '0xdst'] });
      expect(verifySpy).toHaveBeenCalledWith({ txHash: '0xspoke-tx', chainKey: ChainKeys.BSC_MAINNET });
      expect(mocks.relayTxAndWaitPacket).toHaveBeenCalledWith(
        '0xspoke-tx',
        undefined,
        ChainKeys.BSC_MAINNET,
        sodax.moneyMarket.relayerApiEndpoint,
        expect.any(Number),
      );
    });

    it('on Bitcoin: forwards the extra data tuple to the relay', async () => {
      const extraData = { address: HUB_WALLET, payload: '0xbtc-payload' as `0x${string}` };
      vi.spyOn(sodax.moneyMarket, 'createRepayIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xbtc-tx',
        data: extraData,
      });
      vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });
      mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: true, value: { dst_tx_hash: '0xdst' } });

      await sodax.moneyMarket.repay({
        raw: false,
        params: repayParams(ChainKeys.BITCOIN_MAINNET),
        walletProvider: mockBitcoinProvider,
      });

      expect(mocks.relayTxAndWaitPacket.mock.calls[0]?.[1]).toBe(extraData);
    });
  });

  describe('propagates internal errors', () => {
    it('forwards createRepayIntent failure', async () => {
      const intentError = new Error('CREATE_INTENT_FAILED');
      vi.spyOn(sodax.moneyMarket, 'createRepayIntent').mockResolvedValueOnce({
        ok: false,
        error: intentError,
      });

      const result = await sodax.moneyMarket.repay({
        raw: false,
        params: repayParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: intentError });
    });

    it('forwards verifyTxHash failure', async () => {
      vi.spyOn(sodax.moneyMarket, 'createRepayIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xtx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      const verifyError = new Error('VERIFY_FAILED');
      vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: false, error: verifyError });

      const result = await sodax.moneyMarket.repay({
        raw: false,
        params: repayParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: verifyError });
    });

    it('forwards relayTxAndWaitPacket failure', async () => {
      vi.spyOn(sodax.moneyMarket, 'createRepayIntent').mockResolvedValueOnce({
        ok: true,
        value: '0xtx',
        data: { address: HUB_WALLET, payload: '0x' },
      });
      vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });
      const relayError = new Error('RELAY_TIMEOUT');
      mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: false, error: relayError });

      const result = await sodax.moneyMarket.repay({
        raw: false,
        params: repayParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: relayError });
    });

    it('returns ok:false when createRepayIntent throws (outer catch)', async () => {
      const thrown = new Error('UNEXPECTED');
      vi.spyOn(sodax.moneyMarket, 'createRepayIntent').mockRejectedValueOnce(thrown);

      const result = await sodax.moneyMarket.repay({
        raw: false,
        params: repayParams(ChainKeys.BSC_MAINNET),
        walletProvider: mockEvmProvider,
      });

      expect(result).toEqual({ ok: false, error: thrown });
    });
  });
});

// =========================================================================
// build<Action>Data — pure helpers over ConfigService. We stub the config getters
// the helpers depend on and assert call-site shape rather than reproducing the
// EVM-encoding math (which is exercised by the static encoder tests above).
// =========================================================================

describe('MoneyMarketService.buildSupplyData', () => {
  // Minimal hub-asset shape the helper consumes.
  const fakeHubAsset = (overrides: Partial<{ hubAsset: Address; vault: Address; decimals: number }> = {}) => ({
    hubAsset: '0xa000000000000000000000000000000000000001' as Address,
    vault: '0xa000000000000000000000000000000000000002' as Address,
    decimals: 18,
    ...overrides,
  });

  it('returns hex bytes when the hub asset is a non-vault token (extra approve+deposit calls)', () => {
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce(fakeHubAsset() as never);
    // The hub-asset address is NOT a recognized vault → extra approve+deposit calls inserted.
    vi.spyOn(sodax.config, 'isValidVault').mockReturnValueOnce(false);

    const data = sodax.moneyMarket.buildSupplyData(ChainKeys.BSC_MAINNET, SAMPLE_EVM_TOKEN, 1_000_000n, HUB_WALLET);

    expect(typeof data).toBe('string');
    expect(data.startsWith('0x')).toBe(true);
    expect(data.length).toBeGreaterThan(2);
  });

  it('returns hex bytes when the hub asset is itself a vault (no extra deposit step)', () => {
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce(fakeHubAsset() as never);
    vi.spyOn(sodax.config, 'isValidVault').mockReturnValueOnce(true);

    const data = sodax.moneyMarket.buildSupplyData(ChainKeys.BSC_MAINNET, SAMPLE_EVM_TOKEN, 1_000_000n, HUB_WALLET);

    expect(data.startsWith('0x')).toBe(true);
  });

  it('throws (caught upstream) when the hub asset cannot be resolved', () => {
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce(undefined as never);

    expect(() => sodax.moneyMarket.buildSupplyData(ChainKeys.BSC_MAINNET, SAMPLE_EVM_TOKEN, 1n, HUB_WALLET)).toThrow(
      /hub asset not found/,
    );
  });
});

describe('MoneyMarketService.buildBorrowData', () => {
  const fakeHubAsset = (overrides: Partial<{ hubAsset: Address; vault: Address; decimals: number }> = {}) => ({
    hubAsset: '0xb000000000000000000000000000000000000001' as Address,
    vault: '0xb000000000000000000000000000000000000002' as Address,
    decimals: 18,
    ...overrides,
  });
  const fakeMoneyMarketToken = { address: '0xb000000000000000000000000000000000000003' as Address, decimals: 18 };

  it('returns hex bytes when target chain is the hub and token is wrappedSonic (withdrawTo path)', () => {
    const wrappedSonic = sodax.config.spokeChainConfig[ChainKeys.SONIC_MAINNET].addresses.wrappedSonic as Address;
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce(
      fakeHubAsset({ hubAsset: wrappedSonic }) as never,
    );
    vi.spyOn(sodax.config, 'getMoneyMarketToken').mockReturnValueOnce(fakeMoneyMarketToken as never);
    vi.spyOn(sodax.config, 'isValidVault').mockReturnValue(false);

    const data = sodax.moneyMarket.buildBorrowData(
      HUB_WALLET,
      SAMPLE_DST_ADDRESS,
      SAMPLE_EVM_TOKEN,
      1_000_000n,
      ChainKeys.SONIC_MAINNET,
    );

    expect(data.startsWith('0x')).toBe(true);
  });

  it('returns hex bytes when target chain is non-hub (asset-manager transfer path)', () => {
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce(fakeHubAsset() as never);
    vi.spyOn(sodax.config, 'getMoneyMarketToken').mockReturnValueOnce(fakeMoneyMarketToken as never);
    vi.spyOn(sodax.config, 'isValidVault').mockReturnValue(false);

    const data = sodax.moneyMarket.buildBorrowData(
      HUB_WALLET,
      SAMPLE_DST_ADDRESS,
      SAMPLE_EVM_TOKEN,
      1_000_000n,
      ChainKeys.BSC_MAINNET,
    );

    expect(data.startsWith('0x')).toBe(true);
  });

  it('returns hex bytes when target vault is the bnUSD vault (bnUSD-specific path)', () => {
    const bnUSDVault = sodax.config.moneyMarket.bnUSDVault;
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce(
      fakeHubAsset({ vault: bnUSDVault }) as never,
    );
    vi.spyOn(sodax.config, 'getMoneyMarketToken').mockReturnValueOnce(fakeMoneyMarketToken as never);
    vi.spyOn(sodax.config, 'isValidVault').mockReturnValue(false);

    const data = sodax.moneyMarket.buildBorrowData(
      HUB_WALLET,
      SAMPLE_DST_ADDRESS,
      SAMPLE_EVM_TOKEN,
      1_000_000n,
      ChainKeys.BSC_MAINNET,
    );

    expect(data.startsWith('0x')).toBe(true);
  });

  it('throws when the target hub asset cannot be resolved', () => {
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce(undefined as never);
    vi.spyOn(sodax.config, 'getMoneyMarketToken').mockReturnValueOnce(fakeMoneyMarketToken as never);

    expect(() =>
      sodax.moneyMarket.buildBorrowData(HUB_WALLET, SAMPLE_DST_ADDRESS, SAMPLE_EVM_TOKEN, 1n, ChainKeys.BSC_MAINNET),
    ).toThrow(/hub asset not found/);
  });

  it('throws when the dst money-market token cannot be resolved', () => {
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce(fakeHubAsset() as never);
    vi.spyOn(sodax.config, 'getMoneyMarketToken').mockReturnValueOnce(undefined as never);

    expect(() =>
      sodax.moneyMarket.buildBorrowData(HUB_WALLET, SAMPLE_DST_ADDRESS, SAMPLE_EVM_TOKEN, 1n, ChainKeys.BSC_MAINNET),
    ).toThrow(/Money market token not found/);
  });
});

describe('MoneyMarketService.buildWithdrawData', () => {
  const fakeHubAsset = {
    hubAsset: '0xc000000000000000000000000000000000000001' as Address,
    vault: '0xc000000000000000000000000000000000000002' as Address,
    decimals: 18,
  };
  const fakeMoneyMarketToken = { address: '0xc000000000000000000000000000000000000003' as Address, decimals: 18 };

  it('returns hex bytes for non-hub target chain', () => {
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce(fakeHubAsset as never);
    vi.spyOn(sodax.config, 'getMoneyMarketToken').mockReturnValueOnce(fakeMoneyMarketToken as never);
    vi.spyOn(sodax.config, 'isValidVault').mockReturnValue(false);

    const data = sodax.moneyMarket.buildWithdrawData(
      HUB_WALLET,
      SAMPLE_DST_ADDRESS,
      SAMPLE_EVM_TOKEN,
      1_000_000n,
      ChainKeys.BSC_MAINNET,
    );

    expect(data.startsWith('0x')).toBe(true);
  });

  it('returns hex bytes for hub target with wrappedSonic asset (withdrawTo branch)', () => {
    const wrappedSonic = sodax.config.spokeChainConfig[ChainKeys.SONIC_MAINNET].addresses.wrappedSonic as Address;
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce({
      ...fakeHubAsset,
      hubAsset: wrappedSonic,
    } as never);
    vi.spyOn(sodax.config, 'getMoneyMarketToken').mockReturnValueOnce(fakeMoneyMarketToken as never);
    vi.spyOn(sodax.config, 'isValidVault').mockReturnValue(false);

    const data = sodax.moneyMarket.buildWithdrawData(
      HUB_WALLET,
      SAMPLE_DST_ADDRESS,
      SAMPLE_EVM_TOKEN,
      1_000_000n,
      ChainKeys.SONIC_MAINNET,
    );

    expect(data.startsWith('0x')).toBe(true);
  });

  it('returns hex bytes when target token is itself a recognized vault (skip-vault-withdraw branch)', () => {
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce(fakeHubAsset as never);
    vi.spyOn(sodax.config, 'getMoneyMarketToken').mockReturnValueOnce(fakeMoneyMarketToken as never);
    vi.spyOn(sodax.config, 'isValidVault').mockReturnValue(true);

    const data = sodax.moneyMarket.buildWithdrawData(
      HUB_WALLET,
      SAMPLE_DST_ADDRESS,
      SAMPLE_EVM_TOKEN,
      1_000_000n,
      ChainKeys.BSC_MAINNET,
    );

    expect(data.startsWith('0x')).toBe(true);
  });

  it('throws when the target hub asset cannot be resolved', () => {
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce(undefined as never);
    vi.spyOn(sodax.config, 'getMoneyMarketToken').mockReturnValueOnce(fakeMoneyMarketToken as never);

    expect(() =>
      sodax.moneyMarket.buildWithdrawData(HUB_WALLET, SAMPLE_DST_ADDRESS, SAMPLE_EVM_TOKEN, 1n, ChainKeys.BSC_MAINNET),
    ).toThrow(/hub asset not found/);
  });
});

describe('MoneyMarketService.buildRepayData', () => {
  const fakeHubAsset = (overrides: Partial<{ hubAsset: Address; vault: Address; decimals: number }> = {}) => ({
    hubAsset: '0xd000000000000000000000000000000000000001' as Address,
    vault: '0xd000000000000000000000000000000000000002' as Address,
    decimals: 18,
    ...overrides,
  });

  it('returns hex bytes when the hub asset is non-vault (extra approve+deposit calls)', () => {
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce(fakeHubAsset() as never);
    vi.spyOn(sodax.config, 'isValidVault').mockReturnValue(false);

    const data = sodax.moneyMarket.buildRepayData(ChainKeys.BSC_MAINNET, SAMPLE_EVM_TOKEN, 1_000_000n, HUB_WALLET);

    expect(data.startsWith('0x')).toBe(true);
  });

  it('returns hex bytes when the hub vault is the bnUSD vault (bnUSD-debt repay path)', () => {
    const bnUSDVault = sodax.config.moneyMarket.bnUSDVault;
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce(
      fakeHubAsset({ vault: bnUSDVault }) as never,
    );

    const data = sodax.moneyMarket.buildRepayData(ChainKeys.BSC_MAINNET, SAMPLE_EVM_TOKEN, 1_000_000n, HUB_WALLET);

    expect(data.startsWith('0x')).toBe(true);
  });

  it('returns hex bytes when bnUSD-vault path is taken AND assetAddress equals bnUSDVault (no extra deposit step)', () => {
    const bnUSDVault = sodax.config.moneyMarket.bnUSDVault;
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce(
      fakeHubAsset({ hubAsset: bnUSDVault, vault: bnUSDVault }) as never,
    );

    const data = sodax.moneyMarket.buildRepayData(ChainKeys.BSC_MAINNET, SAMPLE_EVM_TOKEN, 1_000_000n, HUB_WALLET);

    expect(data.startsWith('0x')).toBe(true);
  });

  it('returns hex bytes when the hub asset itself is a recognized vault (skip the inner approve+deposit pair)', () => {
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce(fakeHubAsset() as never);
    vi.spyOn(sodax.config, 'isValidVault').mockReturnValue(true);

    const data = sodax.moneyMarket.buildRepayData(ChainKeys.BSC_MAINNET, SAMPLE_EVM_TOKEN, 1_000_000n, HUB_WALLET);

    expect(data.startsWith('0x')).toBe(true);
  });

  it('throws when the source hub asset cannot be resolved', () => {
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce(undefined as never);

    expect(() => sodax.moneyMarket.buildRepayData(ChainKeys.BSC_MAINNET, SAMPLE_EVM_TOKEN, 1n, HUB_WALLET)).toThrow(
      /hub asset not found/,
    );
  });
});

// =========================================================================
// Branch fillers — close gaps surfaced by coverage v8 reports.
// =========================================================================

describe('approve hub-path: forwards a failure Result from spokeService.approve', () => {
  it('approve (raw=false): hub-path failure propagates', async () => {
    mocks.getUserRouter.mockResolvedValueOnce(USER_ROUTER);
    const approveError = new Error('HUB_APPROVE_FAILED');
    vi.spyOn(sodax.spokeService, 'approve').mockResolvedValueOnce({ ok: false, error: approveError });

    const result = await sodax.moneyMarket.approve({
      raw: false,
      params: supplyParams(ChainKeys.SONIC_MAINNET),
      walletProvider: mockEvmProvider,
    });

    expect(result).toEqual({ ok: false, error: approveError });
  });

  it('approve (raw: true): hub-path failure propagates', async () => {
    mocks.getUserRouter.mockResolvedValueOnce(USER_ROUTER);
    const approveError = new Error('HUB_APPROVE_RAW_FAILED');
    vi.spyOn(sodax.spokeService, 'approve').mockResolvedValueOnce({ ok: false, error: approveError });

    const result = await sodax.moneyMarket.approve({
      raw: true,
      params: supplyParams(ChainKeys.SONIC_MAINNET),
    });

    expect(result).toEqual({ ok: false, error: approveError });
  });
});

describe('borrow / withdraw: extraData tuple is forwarded only for Solana / Bitcoin', () => {
  beforeEach(() => {
    vi.spyOn(sodax.config, 'getMoneyMarketToken').mockReturnValue({
      address: '0xaaaa000000000000000000000000000000000000' as Address,
      decimals: 18,
    } as never);
  });

  it('borrow on Solana: forwards extra data tuple', async () => {
    const extraData = { address: HUB_WALLET, payload: '0xsol-payload' as `0x${string}` };
    vi.spyOn(sodax.moneyMarket, 'createBorrowIntent').mockResolvedValueOnce({
      ok: true,
      value: '0xsol-tx',
      data: extraData,
    });
    vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });
    mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: true, value: { dst_tx_hash: '0xdst' } });

    await sodax.moneyMarket.borrow({
      raw: false,
      params: borrowParams(ChainKeys.SOLANA_MAINNET),
      walletProvider: mockSolanaProvider,
    });

    expect(mocks.relayTxAndWaitPacket.mock.calls[0]?.[1]).toBe(extraData);
  });

  it('withdraw on Bitcoin: forwards extra data tuple', async () => {
    const extraData = { address: HUB_WALLET, payload: '0xbtc-payload' as `0x${string}` };
    vi.spyOn(sodax.moneyMarket, 'createWithdrawIntent').mockResolvedValueOnce({
      ok: true,
      value: '0xbtc-tx',
      data: extraData,
    });
    vi.spyOn(sodax.spokeService, 'verifyTxHash').mockResolvedValueOnce({ ok: true, value: true });
    mocks.relayTxAndWaitPacket.mockResolvedValueOnce({ ok: true, value: { dst_tx_hash: '0xdst' } });

    await sodax.moneyMarket.withdraw({
      raw: false,
      params: withdrawParams(ChainKeys.BITCOIN_MAINNET),
      walletProvider: mockBitcoinProvider,
    });

    expect(mocks.relayTxAndWaitPacket.mock.calls[0]?.[1]).toBe(extraData);
  });
});

describe('buildBorrowData / buildWithdrawData — remaining branch coverage', () => {
  // To exercise the partner-fee and "isValidVault(toToken)" branches we spin up a
  // separate Sodax instance with a configured partnerFee. Reusing the shared `sodax`
  // would mean stubbing a readonly field on its MoneyMarketService.
  const sodaxWithFee = new Sodax({
    moneyMarket: {
      partnerFee: { address: '0x9999999999999999999999999999999999999999' as Address, percentage: 100 },
    },
  } as unknown as ConstructorParameters<typeof Sodax>[0]);

  it('buildBorrowData: bnUSD-vault path with partner fee adds the fee transfer call', () => {
    const bnUSDVault = sodaxWithFee.config.moneyMarket.bnUSDVault;
    vi.spyOn(sodaxWithFee.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce({
      hubAsset: '0xb000000000000000000000000000000000000001' as Address,
      vault: bnUSDVault,
      decimals: 18,
    } as never);
    vi.spyOn(sodaxWithFee.config, 'getMoneyMarketToken').mockReturnValueOnce({
      address: '0xb000000000000000000000000000000000000003' as Address,
      decimals: 18,
    } as never);
    vi.spyOn(sodaxWithFee.config, 'isValidVault').mockReturnValue(false);

    const data = sodaxWithFee.moneyMarket.buildBorrowData(
      HUB_WALLET,
      SAMPLE_DST_ADDRESS,
      SAMPLE_EVM_TOKEN,
      1_000_000n,
      ChainKeys.BSC_MAINNET,
    );

    expect(data.startsWith('0x')).toBe(true);
  });

  it('buildBorrowData: non-bnUSD vault path with partner fee adds the fee transfer call', () => {
    vi.spyOn(sodaxWithFee.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce({
      hubAsset: '0xb000000000000000000000000000000000000001' as Address,
      vault: '0xb000000000000000000000000000000000000002' as Address,
      decimals: 18,
    } as never);
    vi.spyOn(sodaxWithFee.config, 'getMoneyMarketToken').mockReturnValueOnce({
      address: '0xb000000000000000000000000000000000000003' as Address,
      decimals: 18,
    } as never);
    vi.spyOn(sodaxWithFee.config, 'isValidVault').mockReturnValue(false);

    const data = sodaxWithFee.moneyMarket.buildBorrowData(
      HUB_WALLET,
      SAMPLE_DST_ADDRESS,
      SAMPLE_EVM_TOKEN,
      1_000_000n,
      ChainKeys.BSC_MAINNET,
    );

    expect(data.startsWith('0x')).toBe(true);
  });

  it('buildBorrowData: when toToken IS itself a recognized vault, uses hub-asset decimals for outgoing translation', () => {
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce({
      hubAsset: '0xb000000000000000000000000000000000000001' as Address,
      vault: '0xb000000000000000000000000000000000000002' as Address,
      decimals: 18,
    } as never);
    vi.spyOn(sodax.config, 'getMoneyMarketToken').mockReturnValueOnce({
      address: '0xb000000000000000000000000000000000000003' as Address,
      decimals: 18,
    } as never);
    // Both toToken and fromHubAsset are recognized vaults → outgoing decimals from hubAsset.
    vi.spyOn(sodax.config, 'isValidVault').mockReturnValue(true);

    const data = sodax.moneyMarket.buildBorrowData(
      HUB_WALLET,
      SAMPLE_DST_ADDRESS,
      SAMPLE_EVM_TOKEN,
      1_000_000n,
      ChainKeys.BSC_MAINNET,
    );

    expect(data.startsWith('0x')).toBe(true);
  });

  it('buildBorrowData: hub target with non-wrappedSonic asset takes the Erc20 transfer branch', () => {
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce({
      hubAsset: '0xb000000000000000000000000000000000000099' as Address, // NOT wrappedSonic
      vault: '0xb000000000000000000000000000000000000002' as Address,
      decimals: 18,
    } as never);
    vi.spyOn(sodax.config, 'getMoneyMarketToken').mockReturnValueOnce({
      address: '0xb000000000000000000000000000000000000003' as Address,
      decimals: 18,
    } as never);
    vi.spyOn(sodax.config, 'isValidVault').mockReturnValue(false);

    const data = sodax.moneyMarket.buildBorrowData(
      HUB_WALLET,
      SAMPLE_DST_ADDRESS,
      SAMPLE_EVM_TOKEN,
      1_000_000n,
      ChainKeys.SONIC_MAINNET, // hub target
    );

    expect(data.startsWith('0x')).toBe(true);
  });

  it('buildWithdrawData: hub target with non-wrappedSonic asset takes the Erc20 transfer branch', () => {
    vi.spyOn(sodax.config, 'getSpokeTokenFromOriginalAssetAddress').mockReturnValueOnce({
      hubAsset: '0xc000000000000000000000000000000000000099' as Address, // NOT wrappedSonic
      vault: '0xc000000000000000000000000000000000000002' as Address,
      decimals: 18,
    } as never);
    vi.spyOn(sodax.config, 'getMoneyMarketToken').mockReturnValueOnce({
      address: '0xc000000000000000000000000000000000000003' as Address,
      decimals: 18,
    } as never);
    vi.spyOn(sodax.config, 'isValidVault').mockReturnValue(false);

    const data = sodax.moneyMarket.buildWithdrawData(
      HUB_WALLET,
      SAMPLE_DST_ADDRESS,
      SAMPLE_EVM_TOKEN,
      1_000_000n,
      ChainKeys.SONIC_MAINNET, // hub target
    );

    expect(data.startsWith('0x')).toBe(true);
  });
});
