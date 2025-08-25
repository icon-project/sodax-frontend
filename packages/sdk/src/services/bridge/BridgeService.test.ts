import { describe, it, expect } from 'vitest';
import { BridgeService } from './BridgeService.js';
import { ARBITRUM_MAINNET_CHAIN_ID, BASE_MAINNET_CHAIN_ID, type XToken } from '@sodax/types';
import type { SpokeChainId } from '@sodax/types';

describe('BridgeService', () => {
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

      const result = BridgeService.isBridgeable(fromToken, toToken);

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

      const result = BridgeService.isBridgeable(fromToken, toToken);

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

      const result = BridgeService.isBridgeable(fromToken, toToken);

      expect(result).toBe(false);
    });
  });

  describe('getBridgeableTokens', () => {
    it('should return bridgeable tokens from ETH on Arbitrum to Base chain', () => {
      const fromToken: XToken = {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        xChainId: ARBITRUM_MAINNET_CHAIN_ID,
      };

      const result = BridgeService.getBridgeableTokens(fromToken, BASE_MAINNET_CHAIN_ID);

      expect(result).toBeInstanceOf(Array);
      // Should include ETH on Base since they share the same vault
      const ethToken = result.find(token => token.symbol === 'ETH' && token.xChainId === BASE_MAINNET_CHAIN_ID);
      expect(ethToken).toBeDefined();
      expect(ethToken?.address).toBe('0x0000000000000000000000000000000000000000');
    });

    it('should return empty array for unsupported source token', () => {
      const fromToken: XToken = {
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: 18,
        address: '0x9999999999999999999999999999999999999999',
        xChainId: ARBITRUM_MAINNET_CHAIN_ID,
      };

      const result = BridgeService.getBridgeableTokens(fromToken, BASE_MAINNET_CHAIN_ID);

      expect(result).toEqual([]);
    });

    it('should return tokens with same vault from USDC on Arbitrum to Base chain', () => {
      const fromToken: XToken = {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        xChainId: ARBITRUM_MAINNET_CHAIN_ID,
      };

      const result = BridgeService.getBridgeableTokens(fromToken, BASE_MAINNET_CHAIN_ID);

      expect(result).toBeInstanceOf(Array);
      // Should include USDC on Base since they share the same vault
      const usdcToken = result.find(
        (token: XToken) => token.symbol === 'USDC' && token.xChainId === BASE_MAINNET_CHAIN_ID,
      );
      expect(usdcToken).toBeDefined();
      expect(usdcToken?.decimals).toBe(6);
    });

    it('should return empty array for unsupported destination chain', () => {
      const fromToken: XToken = {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        xChainId: ARBITRUM_MAINNET_CHAIN_ID,
      };

      // Use an unsupported chain ID
      const unsupportedChainId = '0x999999.unsupported' as SpokeChainId;
      const result = BridgeService.getBridgeableTokens(fromToken, unsupportedChainId);

      expect(result).toEqual([]);
    });
  });
});
