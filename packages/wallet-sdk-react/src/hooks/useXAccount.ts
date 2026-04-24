import { useMemo } from 'react';

import { ChainTypeArr, type SpokeChainKey, type ChainType } from '@sodax/types';

import type { XAccount } from '../types/index.js';
import { useXConnection } from './useXConnection.js';
import { getXChainType } from '../actions/index.js';

/**
 * Hook to get the current connected account for a specific blockchain
 *
 * @param chainIdentifier - The blockchain identifier (either chain type like 'EVM' or chain ID like '0xa86a.avax')
 * @returns {XAccount} The current connected account, or undefined if no account is connected
 *
 * @example
 * ```ts
 * // Using ChainType (preferred)
 * const { address } = useXAccount('EVM');
 *
 * // Using SpokeChainKey
 * const { address } = useXAccount('0xa86a.avax');
 *
 * // Returns: { address: string | undefined, xChainType: ChainType | undefined }
 * ```
 */
function isChainType(chainIdentifier: ChainType | SpokeChainKey): chainIdentifier is ChainType {
  return ChainTypeArr.includes(chainIdentifier as ChainType);
}

export function useXAccount(chainIdentifier?: ChainType | SpokeChainKey): XAccount {
  const resolvedChainType: ChainType | undefined = chainIdentifier
    ? isChainType(chainIdentifier)
      ? chainIdentifier
      : getXChainType(chainIdentifier as SpokeChainKey)
    : undefined;

  const xConnection = useXConnection(resolvedChainType);

  const xAccount = useMemo((): XAccount => {
    if (!resolvedChainType) {
      return {
        address: undefined,
        xChainType: undefined,
      };
    }

    return xConnection?.xAccount || { address: undefined, xChainType: resolvedChainType };
  }, [resolvedChainType, xConnection]);

  return xAccount;
}
