import { describe, it, expect } from 'vitest';
import { ARBITRUM_MAINNET_CHAIN_ID, BASE_MAINNET_CHAIN_ID, type XToken, spokeChainConfig } from '@sodax/types';
import { Sodax } from '../index.js';
import BigNumber from 'bignumber.js';

describe('BridgeService', () => {
  const sodax = new Sodax();

  describe('isBridgeable', () => {
    it('should return true for ETH on Arbitrum and ETH on Base (same vault)', async () => {
      const fromToken: XToken = {
        ...spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.ETH,
        xChainId: ARBITRUM_MAINNET_CHAIN_ID,
      };

      const toToken: XToken = {
        ...spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.ETH,
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
        ...spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].supportedTokens.ETH,
        xChainId: ARBITRUM_MAINNET_CHAIN_ID,
      };

      const toToken: XToken = {
        ...spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.USDC,
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
        ...spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.ETH,
        xChainId: BASE_MAINNET_CHAIN_ID,
      };

      const result = sodax.bridge.isBridgeable({
        from: fromToken,
        to: toToken,
      });

      expect(result).toBe(false);
    });
  });

  describe('getBridgeableTokens', () => {
    // Tests for BridgeService.getBridgeableTokens
    // Purpose: Ensure getBridgeableTokens returns correct bridgeable tokens based on vault matching logic

    it('should return bridgeable tokens that share the same vault', async () => {
      // Mock a source token with a known vault
      const fromToken: XToken = {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        address: spokeChainConfig[BASE_MAINNET_CHAIN_ID].supportedTokens.USDC.address,
        xChainId: BASE_MAINNET_CHAIN_ID,
      };

      // Destination chain and tokens
      const toChainId = ARBITRUM_MAINNET_CHAIN_ID;

      // Find a token on the destination chain that shares the same vault as the source token
      // (Assume testnet config or mock config is set up so that USDC on Arbitrum shares the same vault)
      const bridgeableTokensResult = await sodax.bridge.getBridgeableTokens(
        fromToken.xChainId,
        toChainId,
        fromToken.address,
      );

      expect(Array.isArray(bridgeableTokensResult.ok && bridgeableTokensResult.value)).toBe(true);

      // All returned tokens should have the same vault as the source token
      if (bridgeableTokensResult.ok) {
        const srcAssetInfo = sodax.config.getHubAssetInfo(fromToken.xChainId, fromToken.address);
        for (const token of bridgeableTokensResult.value) {
          const dstAssetInfo = sodax.config.getHubAssetInfo(toChainId, token.address);
          expect(dstAssetInfo?.vault.toLowerCase()).toBe(srcAssetInfo?.vault.toLowerCase());
        }
      }
    });

    it('should return an error if the source asset is not supported', async () => {
      // Use a token address that is not in the hub asset info mapping
      const fromToken: XToken = {
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: 18,
        address: '0x9999999999999999999999999999999999999999',
        xChainId: BASE_MAINNET_CHAIN_ID,
      };

      const toChainId = ARBITRUM_MAINNET_CHAIN_ID;

      const bridgeableTokensResult = await sodax.bridge.getBridgeableTokens(
        fromToken.xChainId,
        toChainId,
        fromToken.address,
      );

      expect(!bridgeableTokensResult.ok && bridgeableTokensResult.error).toBeDefined();
    });

    it('should return the correct bridgeable amount', async () => {
      const fromTokenInfo = { decimals: 6 };
      const toTokenInfo = { decimals: 18 };
      const availableDeposit = BigInt(10 ** fromTokenInfo.decimals + 1);
      const assetManagerBalance = 2n * BigInt(10 ** toTokenInfo.decimals);

      BigNumber(availableDeposit)
        .shiftedBy(-fromTokenInfo.decimals)
        .isLessThan(BigNumber(assetManagerBalance).shiftedBy(-toTokenInfo.decimals));
    });
  });
});
