// packages/sdk/src/constants.test.ts
import { describe, expect, it } from 'vitest';
import {
  AVALANCHE_FUJI_TESTNET_CHAIN_ID,
  AVALANCHE_MAINNET_CHAIN_ID,
  CHAIN_IDS,
  EVM_CHAIN_IDS,
  HUB_CHAIN_IDS,
  MAINNET_CHAIN_IDS,
  SONIC_MAINNET_CHAIN_ID,
  SONIC_TESTNET_CHAIN_ID,
  SPOKE_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
  getEvmViemChain,
  getHubAssetInfo,
  getHubChainConfig,
  getIntentRelayChainId,
  getMoneyMarketConfig,
  getOriginalAssetAddress,
  hubAssetToOriginalAssetMap,
  originalAssetTohubAssetMap,
} from './index.js';
import { avalanche, avalancheFuji, sonic } from 'viem/chains';
import type { EvmChainId, HubChainId } from './index.js';
import type { Address } from 'viem';

describe('Constants', () => {
  describe('Chain IDs', () => {
    it('should export valid chain ID constants', () => {
      expect(AVALANCHE_FUJI_TESTNET_CHAIN_ID).toBe(43113);
      expect(AVALANCHE_MAINNET_CHAIN_ID).toBe(43114);
      expect(SONIC_MAINNET_CHAIN_ID).toBe(146);
      expect(SONIC_TESTNET_CHAIN_ID).toBe(57054);
    });

    it('should have valid chain ID arrays', () => {
      expect(HUB_CHAIN_IDS).toContain(SONIC_MAINNET_CHAIN_ID);
      expect(HUB_CHAIN_IDS).toContain(SONIC_TESTNET_CHAIN_ID);

      expect(SPOKE_CHAIN_IDS).toContain(AVALANCHE_MAINNET_CHAIN_ID);
      expect(SPOKE_CHAIN_IDS).toContain(AVALANCHE_FUJI_TESTNET_CHAIN_ID);

      expect(MAINNET_CHAIN_IDS).toContain(AVALANCHE_MAINNET_CHAIN_ID);
      expect(MAINNET_CHAIN_IDS).toContain(SONIC_MAINNET_CHAIN_ID);

      expect(TESTNET_CHAIN_IDS).toContain(AVALANCHE_FUJI_TESTNET_CHAIN_ID);
      expect(TESTNET_CHAIN_IDS).toContain(SONIC_TESTNET_CHAIN_ID);

      expect(CHAIN_IDS).toEqual([...MAINNET_CHAIN_IDS, ...TESTNET_CHAIN_IDS]);

      expect(EVM_CHAIN_IDS).toContain(AVALANCHE_FUJI_TESTNET_CHAIN_ID);
      expect(EVM_CHAIN_IDS).toContain(SONIC_TESTNET_CHAIN_ID);
    });
  });

  describe('getEvmViemChain', () => {
    it('should return the correct viem chain for Sonic Mainnet', () => {
      const chain = getEvmViemChain(SONIC_MAINNET_CHAIN_ID as EvmChainId);
      expect(chain).toBe(sonic);
    });

    it('should return the correct viem chain for Avalanche Mainnet', () => {
      const chain = getEvmViemChain(AVALANCHE_MAINNET_CHAIN_ID as EvmChainId);
      expect(chain).toBe(avalanche);
    });

    it('should return the correct viem chain for Avalanche Fuji Testnet', () => {
      const chain = getEvmViemChain(AVALANCHE_FUJI_TESTNET_CHAIN_ID as EvmChainId);
      expect(chain).toBe(avalancheFuji);
    });

    it('should throw an error for unsupported chain ID', () => {
      expect(() => getEvmViemChain(999999 as EvmChainId)).toThrow('Unsupported EVM chain ID: 999999');
    });
  });

  describe('getHubChainConfig', () => {
    it('should return the correct hub chain config for Sonic Mainnet', () => {
      const config = getHubChainConfig(SONIC_MAINNET_CHAIN_ID);
      expect(config.chain.name).toBe('Sonic');
      expect(config.chain.id).toBe(SONIC_MAINNET_CHAIN_ID);
      expect(config.chain.type).toBe('evm');
      expect(config.addresses.assetManager).toBeDefined();
    });

    it('should return the correct hub chain config for Sonic Testnet', () => {
      const config = getHubChainConfig(SONIC_TESTNET_CHAIN_ID as HubChainId);
      expect(config.chain.name).toBe('Sonic Blaze Testnet');
      expect(config.chain.id).toBe(SONIC_TESTNET_CHAIN_ID);
      expect(config.chain.type).toBe('evm');
      expect(config.addresses.assetManager).toBeDefined();
      expect(config.supportedTokens.length).toBeGreaterThan(0);
    });
  });

  describe('getMoneyMarketConfig', () => {
    it('should return the correct money market config for Sonic Mainnet', () => {
      const config = getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID as HubChainId);
      expect(config.lendingPool).toBeDefined();
      expect(config.uiPoolDataProvider).toBeDefined();
      expect(config.poolAddressesProvider).toBeDefined();
    });

    it('should return the correct money market config for Sonic Testnet', () => {
      const config = getMoneyMarketConfig(SONIC_TESTNET_CHAIN_ID as HubChainId);
      expect(config.lendingPool).toBeDefined();
      expect(config.uiPoolDataProvider).toBeDefined();
      expect(config.poolAddressesProvider).toBeDefined();
      expect(config.bnUSD).toBeDefined();
    });
  });

  describe('getIntentRelayChainId', () => {
    it('should return the correct intent relay chain ID for supported chains', () => {
      const relayChainId = getIntentRelayChainId(AVALANCHE_MAINNET_CHAIN_ID);
      expect(relayChainId).toBeDefined();
    });
  });

  describe('Asset Maps', () => {
    it('should have valid originalAssetTohubAssetMap', () => {
      expect(originalAssetTohubAssetMap).toBeInstanceOf(Map);
      expect(originalAssetTohubAssetMap.size).toBeGreaterThan(0);
    });

    it('should have valid hubAssetToOriginalAssetMap', () => {
      expect(hubAssetToOriginalAssetMap).toBeInstanceOf(Map);
      expect(hubAssetToOriginalAssetMap.size).toBeGreaterThan(0);
    });
  });

  describe('getHubAssetInfo', () => {
    it('should return the correct hub asset info for a valid original asset', () => {
      // Use a known original asset from a supported chain
      const chainId = AVALANCHE_MAINNET_CHAIN_ID;
      const originalAsset = '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7';

      const hubAssetInfo = getHubAssetInfo(chainId, originalAsset);

      expect(hubAssetInfo).toBeDefined();
      expect(hubAssetInfo?.asset).toBeDefined();
      expect(hubAssetInfo?.decimal).toBeGreaterThan(0);
      expect(hubAssetInfo?.vault).toBeDefined();
    });

    it('should return undefined for an unsupported original asset', () => {
      const chainId = AVALANCHE_MAINNET_CHAIN_ID;
      const unsupportedAsset = '0x0000000000000000000000000000000000000001';

      const hubAssetInfo = getHubAssetInfo(chainId, unsupportedAsset);

      expect(hubAssetInfo).toBeUndefined();
    });

    it('should handle case-insensitive asset addresses', () => {
      const chainId = AVALANCHE_MAINNET_CHAIN_ID;
      const originalAssetLower = '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7'; // lowercase
      const originalAssetUpper = '0xB31F66AA3C1E785363F0875A1B74E27B85FD66C7'; // uppercase

      const infoLower = getHubAssetInfo(chainId, originalAssetLower);
      const infoUpper = getHubAssetInfo(chainId, originalAssetUpper);

      expect(infoLower).toEqual(infoUpper);
    });
  });

  describe('getOriginalAssetAddress', () => {
    it('should return the correct original asset for a valid hub asset', () => {
      // Use a known hub asset from a supported chain
      const chainId = AVALANCHE_MAINNET_CHAIN_ID;
      // Find a hub asset that exists in the map
      const hubAsset = Array.from(hubAssetToOriginalAssetMap.get(chainId)?.keys() || [])[0];

      if (hubAsset) {
        const originalAsset = getOriginalAssetAddress(chainId, hubAsset);

        expect(originalAsset).toBeDefined();
        expect(typeof originalAsset).toBe('string');
      } else {
        // Skip test if no hub assets found for this chain
        console.warn(`No hub assets found for chain ${chainId} in test`);
      }
    });

    it('should return undefined for an unsupported hub asset', () => {
      const chainId = AVALANCHE_MAINNET_CHAIN_ID;
      const unsupportedAsset = '0x0000000000000000000000000000000000000000';

      const originalAsset = getOriginalAssetAddress(chainId, unsupportedAsset);

      expect(originalAsset).toBeUndefined();
    });

    it('should handle case-insensitive asset addresses', () => {
      const chainId = AVALANCHE_MAINNET_CHAIN_ID;
      // Find a hub asset that exists in the map
      const hubAsset = Array.from(hubAssetToOriginalAssetMap.get(chainId)?.keys() || [])[0];

      if (hubAsset) {
        const hubAssetLower = hubAsset.toLowerCase() as Address;
        const hubAssetUpper = hubAsset.toUpperCase() as Address;

        const originalLower = getOriginalAssetAddress(chainId, hubAssetLower);
        const originalUpper = getOriginalAssetAddress(chainId, hubAssetUpper);

        expect(originalLower).toEqual(originalUpper);
      } else {
        // Skip test if no hub assets found for this chain
        console.warn(`No hub assets found for chain ${chainId} in test`);
      }
    });
  });
});
