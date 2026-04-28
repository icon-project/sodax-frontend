// packages/sdk/src/shared/guards.test.ts
import { describe, expect, it } from 'vitest';
import { ChainKeys, spokeChainConfig } from '@sodax/types';
import {
  isEvmSpokeChainConfig,
  isJsonRpcPayloadResponse,
  isPartnerFeeAmount,
  isPartnerFeePercentage,
  isRawDestinationParams,
} from './guards.js';

describe('guards', () => {
  describe('isRawDestinationParams', () => {
    it('accepts dstChainKey/dstAddress for a known spoke key', () => {
      expect(
        isRawDestinationParams({
          dstChainKey: ChainKeys.ARBITRUM_MAINNET,
          dstAddress: '0x0000000000000000000000000000000000000001',
        }),
      ).toBe(true);
    });

    it('rejects unknown chain keys and legacy property names', () => {
      expect(
        isRawDestinationParams({
          dstChainKey: 'unknown-chain',
          dstAddress: '0x1',
        }),
      ).toBe(false);
      expect(
        isRawDestinationParams({
          toChainId: ChainKeys.ARBITRUM_MAINNET,
          toAddress: '0x1',
        }),
      ).toBe(false);
    });
  });

  describe('isJsonRpcPayloadResponse', () => {
    it('requires numeric id and string result', () => {
      expect(isJsonRpcPayloadResponse({ id: 1, result: 'ok' })).toBe(true);
      expect(isJsonRpcPayloadResponse({ id: '1', result: 'ok' })).toBe(false);
      expect(isJsonRpcPayloadResponse({ result: 'ok' })).toBe(false);
    });
  });

  describe('partner fee guards', () => {
    const receiver = '0x1111111111111111111111111111111111111111';

    it('isPartnerFeeAmount validates address and bigint amount', () => {
      expect(isPartnerFeeAmount({ address: receiver, amount: 1n })).toBe(true);
      expect(isPartnerFeeAmount({ address: 'not-an-address', amount: 1n })).toBe(false);
      expect(isPartnerFeeAmount({ address: receiver, amount: 1 })).toBe(false);
    });

    it('isPartnerFeePercentage rejects objects that already match amount variant', () => {
      expect(isPartnerFeePercentage({ address: receiver, percentage: 100 })).toBe(true);
      expect(
        isPartnerFeePercentage({
          address: receiver,
          percentage: 100,
          amount: 1n,
        }),
      ).toBe(false);
    });
  });

  describe('isEvmSpokeChainConfig', () => {
    it('excludes Sonic hub config from EVM-only spoke narrowing', () => {
      expect(isEvmSpokeChainConfig(spokeChainConfig[ChainKeys.ARBITRUM_MAINNET])).toBe(true);
      expect(isEvmSpokeChainConfig(spokeChainConfig[ChainKeys.SONIC_MAINNET])).toBe(false);
    });
  });
});
