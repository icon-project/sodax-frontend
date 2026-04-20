import { describe, expect, it } from 'vitest';
import { ChainKeys, sodaxConfig as rawSodaxConfig, type Address, type HttpUrl, type PartnerFee, type SodaxConfig } from '@sodax/types';
import { deepMerge } from '../utils/deepMerge.js';

// sodaxConfig is typed narrowly (inferred literal types from `satisfies`); widen to `SodaxConfig`
// so overrides using generic `Address`, `HttpUrl`, `PartnerFee` assign cleanly.
const sodaxConfig: SodaxConfig = rawSodaxConfig;

/**
 * These tests exercise the config-override machinery used by `new Sodax(config)`.
 * `Sodax` calls `deepMerge(sodaxConfig, config)` in its constructor; here we invoke
 * `deepMerge` directly against the real `sodaxConfig` default so the merge logic is
 * verified in isolation, independent of the rest of the SDK wiring.
 */
describe('Sodax config override (deepMerge against sodaxConfig)', () => {
  describe('baseline', () => {
    it('produces a config deep-equal to sodaxConfig when the override is empty', () => {
      const merged = deepMerge(sodaxConfig, {});
      expect(merged).toStrictEqual(sodaxConfig);
    });

    it('does not return the same object reference (merge always clones the top level)', () => {
      const merged = deepMerge(sodaxConfig, {});
      expect(merged).not.toBe(sodaxConfig);
    });
  });

  describe('top-level atomic override', () => {
    it('overrides `fee` without touching any other top-level field', () => {
      const fee: PartnerFee = {
        address: '0x1111111111111111111111111111111111111111',
        percentage: 50,
      };

      const merged = deepMerge(sodaxConfig, { fee });

      expect(merged.fee).toStrictEqual(fee);
      expect(merged.chains).toStrictEqual(sodaxConfig.chains);
      expect(merged.hub).toStrictEqual(sodaxConfig.hub);
      expect(merged.api).toStrictEqual(sodaxConfig.api);
      expect(merged.moneyMarket).toStrictEqual(sodaxConfig.moneyMarket);
      expect(merged.dex).toStrictEqual(sodaxConfig.dex);
      expect(merged.swaps).toStrictEqual(sodaxConfig.swaps);
      expect(merged.bridge).toStrictEqual(sodaxConfig.bridge);
      expect(merged.solver).toStrictEqual(sodaxConfig.solver);
      expect(merged.relay).toStrictEqual(sodaxConfig.relay);
    });
  });

  describe('nested-object partial override (one level deep)', () => {
    it('overrides `api.baseURL` while preserving `api.timeout` and `api.headers`', () => {
      const baseURL = 'https://api.example.test' as HttpUrl;

      const merged = deepMerge(sodaxConfig, { api: { baseURL } });

      expect(merged.api.baseURL).toBe(baseURL);
      expect(merged.api.timeout).toBe(sodaxConfig.api.timeout);
      expect(merged.api.headers).toStrictEqual(sodaxConfig.api.headers);
    });
  });

  describe('nested-object partial override (two levels deep)', () => {
    it('overrides `hub.addresses.xSoda` and leaves every other address untouched', () => {
      const xSoda = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef' as Address;

      const merged = deepMerge(sodaxConfig, { hub: { addresses: { xSoda } } });

      expect(merged.hub.addresses.xSoda).toBe(xSoda);
      for (const key of Object.keys(sodaxConfig.hub.addresses) as (keyof typeof sodaxConfig.hub.addresses)[]) {
        if (key === 'xSoda') continue;
        expect(merged.hub.addresses[key]).toBe(sodaxConfig.hub.addresses[key]);
      }
      expect(merged.hub.chain).toStrictEqual(sodaxConfig.hub.chain);
      expect(merged.hub.nativeToken).toBe(sodaxConfig.hub.nativeToken);
      expect(merged.hub.wrappedNativeToken).toBe(sodaxConfig.hub.wrappedNativeToken);
    });
  });

  describe('record-keyed partial override', () => {
    it('merges a single chain entry under `chains` without affecting any other chain entry', () => {
      const customRpcUrl = 'https://sonic.rpc.example.test' as HttpUrl;

      const merged = deepMerge(sodaxConfig, {
        chains: {
          [ChainKeys.SONIC_MAINNET]: { rpcUrl: customRpcUrl },
        },
      });

      // rpcUrl lives on the EVM/Sonic variant of SpokeChainConfig; SONIC_MAINNET is that variant.
      expect((merged.chains[ChainKeys.SONIC_MAINNET] as { rpcUrl: HttpUrl }).rpcUrl).toBe(customRpcUrl);
      expect(merged.chains[ChainKeys.SONIC_MAINNET].supportedTokens).toStrictEqual(
        sodaxConfig.chains[ChainKeys.SONIC_MAINNET].supportedTokens,
      );

      for (const chainKey of Object.keys(sodaxConfig.chains) as (keyof typeof sodaxConfig.chains)[]) {
        if (chainKey === ChainKeys.SONIC_MAINNET) continue;
        expect(merged.chains[chainKey]).toStrictEqual(sodaxConfig.chains[chainKey]);
      }
    });
  });

  describe('array replacement', () => {
    it('replaces `moneyMarket.supportedReserveAssets` wholesale and leaves siblings intact', () => {
      const supportedReserveAssets: readonly Address[] = ['0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'];

      const merged = deepMerge(sodaxConfig, { moneyMarket: { supportedReserveAssets } });

      expect(merged.moneyMarket.supportedReserveAssets).toStrictEqual(supportedReserveAssets);
      expect(merged.moneyMarket.supportedTokens).toStrictEqual(sodaxConfig.moneyMarket.supportedTokens);
      expect(merged.moneyMarket.lendingPool).toBe(sodaxConfig.moneyMarket.lendingPool);
      expect(merged.moneyMarket.bnUSD).toBe(sodaxConfig.moneyMarket.bnUSD);
    });
  });

  describe('undefined values in source', () => {
    it('does not replace defaults when the user supplies `undefined`', () => {
      const merged = deepMerge(sodaxConfig, { fee: undefined });
      expect(merged.fee).toBe(sodaxConfig.fee);
    });
  });

  describe('default-object immutability', () => {
    it('never mutates the exported `sodaxConfig`, even across multiple deep overrides', () => {
      const replacer = (_key: string, value: unknown): unknown =>
        typeof value === 'bigint' ? value.toString() : value;
      const snapshot = JSON.stringify(sodaxConfig, replacer);

      deepMerge(sodaxConfig, {
        fee: { address: '0x2222222222222222222222222222222222222222', percentage: 25 },
        hub: { addresses: { xSoda: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Address } },
        api: { baseURL: 'https://snapshot.example.test' as HttpUrl },
        chains: {
          [ChainKeys.SONIC_MAINNET]: { rpcUrl: 'https://snapshot.rpc.example.test' as HttpUrl },
        },
        moneyMarket: {
          supportedReserveAssets: ['0xcccccccccccccccccccccccccccccccccccccccc'],
        },
      });

      deepMerge(sodaxConfig, {});

      const after = JSON.stringify(sodaxConfig, replacer);
      expect(after).toBe(snapshot);
    });
  });

  describe('multiple simultaneous overrides', () => {
    it('applies every override and disturbs nothing else', () => {
      const fee: PartnerFee = {
        address: '0x3333333333333333333333333333333333333333',
        percentage: 75,
      };
      const baseURL = 'https://multi.api.example.test' as HttpUrl;
      const xSoda = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' as Address;

      const merged = deepMerge(sodaxConfig, {
        fee,
        api: { baseURL },
        hub: { addresses: { xSoda } },
      });

      expect(merged.fee).toStrictEqual(fee);
      expect(merged.api.baseURL).toBe(baseURL);
      expect(merged.api.timeout).toBe(sodaxConfig.api.timeout);
      expect(merged.hub.addresses.xSoda).toBe(xSoda);
      expect(merged.hub.addresses.assetManager).toBe(sodaxConfig.hub.addresses.assetManager);
      expect(merged.chains).toStrictEqual(sodaxConfig.chains);
      expect(merged.moneyMarket).toStrictEqual(sodaxConfig.moneyMarket);
      expect(merged.bridge).toStrictEqual(sodaxConfig.bridge);
      expect(merged.dex).toStrictEqual(sodaxConfig.dex);
      expect(merged.solver).toStrictEqual(sodaxConfig.solver);
      expect(merged.relay).toStrictEqual(sodaxConfig.relay);
      expect(merged.swaps).toStrictEqual(sodaxConfig.swaps);
    });
  });
});
