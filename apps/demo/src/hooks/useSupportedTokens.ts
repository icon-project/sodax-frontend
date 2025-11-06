/**
 * Custom React hook that returns the supported tokens for a given chain ID.
 *
 * It maps tokens from the SDK's `moneyMarketSupportedTokens` list
 * and automatically adds the `xChainId` field required by the wallet SDK.
 *
 * @param {ChainId} selectedChainId - The active chain ID (e.g. 'sonic', '0x38.bsc', '0xa86a.avax')
 * @returns {XToken[]} An array of supported tokens with extended metadata.
 *
 * @example
 * ```tsx
 * const tokens = useSupportedTokens('sonic');
 * console.log(tokens);
 * ```
 */
import { useMemo } from 'react';
import { moneyMarketSupportedTokens } from '@sodax/sdk';
import type { Token, XToken } from '@sodax/types';
import type { ChainId } from '@sodax/types';

export function useSupportedTokens(selectedChainId: ChainId) {
  return useMemo<XToken[]>(() => {
    const supportedTokens = moneyMarketSupportedTokens[selectedChainId];

    if (!supportedTokens) {
      console.warn(`Unsupported chain ID: ${selectedChainId}`);
      return [];
    }

    return supportedTokens.map(
      (t: Token) =>
        ({
          ...t,
          xChainId: selectedChainId,
        }) satisfies XToken,
    );
  }, [selectedChainId]);
}
