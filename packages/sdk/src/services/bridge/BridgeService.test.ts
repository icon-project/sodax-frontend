import { describe, it, expect } from 'vitest';
import { ARBITRUM_MAINNET_CHAIN_ID, BASE_MAINNET_CHAIN_ID, type XToken } from '@sodax/types';
import { Sodax } from '../../index.js';

describe('BridgeService', () => {
  const sodax = new Sodax();

  describe('isBridgeable', () => {
    it('should return true for ETH on Arbitrum and ETH on Base (same vault)', () => {
      const fromToken: XToken = {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        xChainId: ARBITRUM_MAINNET_CHAIN_ID,
      };

      const toToken: XToken = {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        xChainId: BASE_MAINNET_CHAIN_ID,
      };

      const result = sodax.bridge.isBridgeable({
        from: fromToken,
        to: toToken,
      });

      expect(result).toBe(true);
    });

    it('should return false for ETH on Arbitrum and USDC on Base (different vaults)', () => {
      const fromToken: XToken = {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        xChainId: ARBITRUM_MAINNET_CHAIN_ID,
      };

      const toToken: XToken = {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0x72E852545B024ddCbc5b70C1bCBDAA025164259C',
        xChainId: BASE_MAINNET_CHAIN_ID,
      };

      const result = sodax.bridge.isBridgeable({
        from: fromToken,
        to: toToken,
      });

      expect(result).toBe(false);
    });

    it('should return false for unsupported assets', () => {
      const fromToken: XToken = {
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: 18,
        address: '0x9999999999999999999999999999999999999999',
        xChainId: ARBITRUM_MAINNET_CHAIN_ID,
      };

      const toToken: XToken = {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        xChainId: BASE_MAINNET_CHAIN_ID,
      };

      const result = sodax.bridge.isBridgeable({
        from: fromToken,
        to: toToken,
      });

      expect(result).toBe(false);
    });
  });

  // describe('getBridgeableTokens', () => {


  // });
});
